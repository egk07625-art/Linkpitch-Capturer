/**
 * @file log-report-event.ts
 * @description 리포트 이벤트 로깅 Server Action
 *
 * 리포트 페이지에서 발생하는 사용자 행동을 추적하고 CRM 상태를 업데이트합니다.
 * PRD.md의 리포트 추적 로직 및 CRM 상태 승격 규칙을 따릅니다.
 */

'use server';

import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import type { ReportEventType, ReportEventMetadata } from '@/types/report-event';
import type { CRMStatus } from '@/types/prospect';

/**
 * 리포트 이벤트 로깅
 * 
 * @param prospectId Prospect ID
 * @param eventType 이벤트 타입
 * @param metadata 메타데이터 (선택)
 * @returns 로깅 성공 여부
 * @throws 에러 발생 시 예외 던짐
 */
export async function logReportEventAction(
  prospectId: string,
  eventType: ReportEventType,
  metadata?: ReportEventMetadata
): Promise<void> {
  const { userId } = await auth();
  
  if (!userId) {
    // 인증되지 않은 사용자는 조용히 무시 (리포트는 공개 가능)
    return;
  }

  const supabase = await createClerkSupabaseClient();

  // Prospect가 현재 사용자의 것인지 확인
  const { data: prospect, error: prospectError } = await supabase
    .from('prospects')
    .select('id, user_id, crm_status, visit_count, last_viewed_at')
    .eq('id', prospectId)
    .single();

  if (prospectError || !prospect) {
    // Prospect를 찾을 수 없어도 조용히 무시 (에러 로그만)
    console.error('Prospect 조회 실패:', prospectError);
    return;
  }

  // 사용자 ID가 일치하는지 확인 (보안)
  if (prospect.user_id !== userId) {
    console.error('권한 없음: Prospect 소유자가 아닙니다.');
    return;
  }

  // 1. report_events 테이블에 이벤트 INSERT
  const eventData = {
    user_id: userId,
    prospect_id: prospectId,
    event_type: eventType,
    metadata: metadata || {},
  };

  const { error: insertError } = await supabase
    .from('report_events')
    .insert(eventData);

  if (insertError) {
    console.error('Report event 삽입 실패:', insertError);
    return;
  }

  // 2. CRM 상태 승격 체크
  const { data: events } = await supabase
    .from('report_events')
    .select('metadata')
    .eq('user_id', userId)
    .eq('prospect_id', prospectId);

  const hasEvent = (condition: (e: any) => boolean) => 
    events?.some(condition) || false;

  let newStatus: CRMStatus = prospect.crm_status || 'cold';

  // Hot: (80% 스크롤) AND (30초 체류)
  if (
    hasEvent((e) => {
      const meta = e.metadata as ReportEventMetadata;
      return (meta?.scroll_depth || 0) >= 0.8;
    }) &&
    hasEvent((e) => {
      const meta = e.metadata as ReportEventMetadata;
      return (meta?.dwell_seconds || 0) >= 30;
    })
  ) {
    newStatus = 'hot';
  }
  // Warm: (50% 스크롤) AND (10초 체류)
  else if (
    hasEvent((e) => {
      const meta = e.metadata as ReportEventMetadata;
      return (meta?.scroll_depth || 0) >= 0.5;
    }) &&
    hasEvent((e) => {
      const meta = e.metadata as ReportEventMetadata;
      return (meta?.dwell_seconds || 0) >= 10;
    })
  ) {
    newStatus = 'warm';
  }

  // 3. Prospect 업데이트
  const now = new Date().toISOString();
  const updateData: {
    crm_status: CRMStatus;
    last_viewed_at: string;
    visit_count?: number;
  } = {
    crm_status: newStatus,
    last_viewed_at: now,
  };

  // 4. 재방문 체크 (1시간 경과)
  if (prospect.last_viewed_at) {
    const lastView = new Date(prospect.last_viewed_at);
    const timeDiff = new Date().getTime() - lastView.getTime();
    const oneHour = 3600000; // 1시간 (밀리초)

    if (timeDiff > oneHour) {
      updateData.visit_count = (prospect.visit_count || 0) + 1;
    }
  } else {
    // 첫 방문
    updateData.visit_count = 1;
  }

  await supabase
    .from('prospects')
    .update(updateData)
    .eq('id', prospectId)
    .eq('user_id', userId);
}


