/**
 * @file actions/track-report-view.ts
 * @description 리포트 조회 추적 Server Action
 *
 * 리포트 뷰어 페이지에서 발생하는 사용자 행동을 추적하고
 * report_tracking_logs 테이블에 저장합니다.
 * 기존 트리거(update_prospect_status)가 자동으로 CRM 상태를 업데이트합니다.
 */

'use server';

import { headers } from 'next/headers';
import { supabase } from '@/lib/supabase/client';
import type { ReportTrackingLog } from '@/types/report-viewer';

/**
 * 클라이언트 IP 주소 추출 헬퍼
 */
async function getClientIP(): Promise<string | null> {
  try {
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIP = headersList.get('x-real-ip');
    
    if (forwardedFor) {
      // x-forwarded-for는 여러 IP를 포함할 수 있음 (프록시 체인)
      return forwardedFor.split(',')[0].trim();
    }
    
    if (realIP) {
      return realIP;
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * 리포트 조회 추적 로그 저장
 * 
 * @param log 추적 로그 데이터
 * @returns 저장 성공 여부
 */
export async function trackReportViewAction(
  log: ReportTrackingLog
): Promise<{ success: boolean; error?: string }> {
  try {
    // Server Action에서 IP 주소 가져오기
    const ipAddress = log.ip_address || (await getClientIP());

    const { error } = await supabase
      .from('report_tracking_logs')
      .insert({
        prospect_id: log.prospect_id,
        session_id: log.session_id,
        user_agent: log.user_agent || null,
        ip_address: ipAddress || null,
        scroll_depth: log.scroll_depth,
        duration_seconds: log.duration_seconds,
      });

    if (error) {
      console.error('리포트 추적 로그 저장 실패:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
    console.error('리포트 추적 로그 저장 중 예외 발생:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

