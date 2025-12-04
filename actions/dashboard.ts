/**
 * @file actions/dashboard.ts
 * @description 대시보드 KPI 집계 Server Actions
 *
 * MVP 기획서의 핵심 지표:
 * - 총 고객사 (Total Prospects)
 * - 발송 완료 (Sent Emails)
 * - 리포트 완독률 (Engagement - 80% 이상 스크롤)
 * - 평균 열람 시간 (Average Duration)
 * - 리드 전환율 (Conversion - Hot + Warm / Total)
 * - HOT Lead 수 (실시간)
 */

'use server';

import { auth } from '@clerk/nextjs/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';

export interface DashboardKPIs {
  totalProspects: number;
  sentEmails: number;
  completionRate: number; // 완독률 (%)
  avgDurationSeconds: number; // 평균 열람 시간 (초)
  conversionRate: number; // 리드 전환율 (%)
  hotLeads: number; // HOT 상태 고객 수
}

/**
 * 현재 사용자의 Supabase user ID 조회
 */
async function getCurrentUserId(): Promise<string | null> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const supabase = getServiceRoleClient();
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', clerkId)
    .single();

  return data?.id || null;
}

/**
 * 대시보드 KPI 집계
 */
export async function getDashboardKPIs(): Promise<{
  data: DashboardKPIs | null;
  error: string | null;
}> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { data: null, error: '인증이 필요합니다.' };
    }

    const supabase = getServiceRoleClient();

    // 병렬로 모든 데이터 조회
    const [prospectsResult, emailsResult, trackingResult] = await Promise.all([
      // 1. Prospects 데이터
      supabase
        .from('prospects')
        .select('id, crm_status, max_scroll_depth, max_duration_seconds')
        .eq('user_id', userId),

      // 2. Generated Emails 데이터
      supabase
        .from('generated_emails')
        .select('id, status')
        .eq('user_id', userId),

      // 3. Report Tracking Logs 데이터 (완독률, 평균 시간 계산용)
      supabase
        .from('report_tracking_logs')
        .select('scroll_depth, duration_seconds, prospect_id')
        .in(
          'prospect_id',
          (
            await supabase.from('prospects').select('id').eq('user_id', userId)
          ).data?.map((p) => p.id) || []
        ),
    ]);

    if (prospectsResult.error) {
      return { data: null, error: prospectsResult.error.message };
    }

    const prospects = prospectsResult.data || [];
    const emails = emailsResult.data || [];
    const trackingLogs = trackingResult.data || [];

    // KPI 계산
    const totalProspects = prospects.length;

    const sentEmails = emails.filter((e) => e.status === 'sent').length;

    // 완독률: 80% 이상 스크롤한 고객 비율
    const completedProspects = prospects.filter(
      (p) => p.max_scroll_depth >= 80
    ).length;
    const completionRate =
      totalProspects > 0
        ? Math.round((completedProspects / totalProspects) * 100)
        : 0;

    // 평균 열람 시간: 모든 트래킹 로그의 평균
    const totalDuration = trackingLogs.reduce(
      (sum, log) => sum + (log.duration_seconds || 0),
      0
    );
    const avgDurationSeconds =
      trackingLogs.length > 0 ? Math.round(totalDuration / trackingLogs.length) : 0;

    // 리드 전환율: Hot + Warm 비율
    const hotWarmCount = prospects.filter(
      (p) => p.crm_status === 'hot' || p.crm_status === 'warm'
    ).length;
    const conversionRate =
      totalProspects > 0
        ? Math.round((hotWarmCount / totalProspects) * 100 * 10) / 10
        : 0;

    // HOT Lead 수
    const hotLeads = prospects.filter((p) => p.crm_status === 'hot').length;

    return {
      data: {
        totalProspects,
        sentEmails,
        completionRate,
        avgDurationSeconds,
        conversionRate,
        hotLeads,
      },
      error: null,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
    console.error('대시보드 KPI 조회 중 예외:', errorMessage);
    return { data: null, error: errorMessage };
  }
}

/**
 * CRM 파이프라인 통계 조회
 */
export interface CRMPipelineStats {
  cold: { count: number; percentage: number };
  warm: { count: number; percentage: number };
  hot: { count: number; percentage: number };
  contacted: number; // 발송된 이메일 수
  engaged: number; // Warm 상태 도달 수
  qualified: number; // Hot 상태 도달 수
}

export async function getCRMPipelineStats(): Promise<{
  data: CRMPipelineStats | null;
  error: string | null;
}> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { data: null, error: '인증이 필요합니다.' };
    }

    const supabase = getServiceRoleClient();

    // 병렬로 데이터 조회
    const [prospectsResult, emailsResult] = await Promise.all([
      // 1. Prospects 데이터 (CRM 상태별)
      supabase
        .from('prospects')
        .select('id, crm_status')
        .eq('user_id', userId),

      // 2. 발송된 이메일 수
      supabase
        .from('generated_emails')
        .select('id, status')
        .eq('user_id', userId)
        .eq('status', 'sent'),
    ]);

    if (prospectsResult.error) {
      return { data: null, error: prospectsResult.error.message };
    }

    const prospects = prospectsResult.data || [];
    const emails = emailsResult.data || [];

    const totalProspects = prospects.length;
    const contacted = emails.length;

    // CRM 상태별 카운트
    const coldCount = prospects.filter((p) => p.crm_status === 'cold').length;
    const warmCount = prospects.filter((p) => p.crm_status === 'warm').length;
    const hotCount = prospects.filter((p) => p.crm_status === 'hot').length;

    // 비율 계산 (기본값 0으로 안전하게 처리)
    const coldPercentage = totalProspects > 0 
      ? Math.round((coldCount / totalProspects) * 100) 
      : 0;
    const warmPercentage = totalProspects > 0 
      ? Math.round((warmCount / totalProspects) * 100) 
      : 0;
    const hotPercentage = totalProspects > 0 
      ? Math.round((hotCount / totalProspects) * 100) 
      : 0;

    // Engaged = Warm 상태 도달 수
    const engaged = warmCount;
    // Qualified = Hot 상태 도달 수
    const qualified = hotCount;

    return {
      data: {
        cold: { count: coldCount, percentage: coldPercentage },
        warm: { count: warmCount, percentage: warmPercentage },
        hot: { count: hotCount, percentage: hotPercentage },
        contacted,
        engaged,
        qualified,
      },
      error: null,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
    console.error('CRM 파이프라인 통계 조회 중 예외:', errorMessage);
    return { data: null, error: errorMessage };
  }
}

/**
 * 최근 활동 조회 (타임라인용)
 * @param limit - 조회 개수 (기본값: 10)
 */
export async function getRecentActivity(limit: number = 10): Promise<{
  data: Array<{
    id: string;
    type: 'sent' | 'opened' | 'clicked' | 'scroll_80' | 'status_changed';
    title: string;
    timestamp: string;
    prospect_name?: string;
  }> | null;
  error: string | null;
}> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { data: null, error: '인증이 필요합니다.' };
    }

    const supabase = getServiceRoleClient();

    // 사용자의 prospects ID 목록 조회
    const { data: userProspects } = await supabase
      .from('prospects')
      .select('id')
      .eq('user_id', userId);

    const prospectIds = userProspects?.map((p) => p.id) || [];

    if (prospectIds.length === 0) {
      return { data: [], error: null };
    }

    // 병렬로 데이터 조회
    const [emailsResult, trackingLogsResult, hotProspectsResult] = await Promise.all([
      // 1. 최근 발송된 이메일 조회
      supabase
        .from('generated_emails')
        .select(
          `
          id,
          status,
          sent_at,
          opened_at,
          clicked_at,
          prospect_id,
          prospects!inner(name)
        `
        )
        .eq('user_id', userId)
        .not('sent_at', 'is', null)
        .order('sent_at', { ascending: false })
        .limit(limit * 2), // 더 많이 가져와서 필터링

      // 2. 리포트 추적 로그 조회 (최근 7일)
      supabase
        .from('report_tracking_logs')
        .select(
          `
          id,
          prospect_id,
          session_id,
          scroll_depth,
          duration_seconds,
          created_at,
          prospects!inner(name)
        `
        )
        .in('prospect_id', prospectIds)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // 최근 7일
        .order('created_at', { ascending: false })
        .limit(limit * 2),

      // 3. Hot 상태로 변경된 prospects
      supabase
        .from('prospects')
        .select('id, name, last_activity_at')
        .eq('user_id', userId)
        .eq('crm_status', 'hot')
        .not('last_activity_at', 'is', null)
        .order('last_activity_at', { ascending: false })
        .limit(limit),
    ]);

    if (emailsResult.error) {
      console.error('이메일 활동 조회 실패:', emailsResult.error);
    }
    if (trackingLogsResult.error) {
      console.error('리포트 추적 로그 조회 실패:', trackingLogsResult.error);
    }

    // 활동 목록 생성
    const activities: Array<{
      id: string;
      type: 'sent' | 'opened' | 'clicked' | 'scroll_80' | 'status_changed';
      title: string;
      timestamp: string;
      prospect_name?: string;
    }> = [];

    const processedSessions = new Set<string>(); // 중복 방지용

    // 1. 이메일 활동 추가
    for (const email of emailsResult.data || []) {
      const prospectName =
        (email.prospects as unknown as { name: string })?.name || '알 수 없음';

      if (email.sent_at) {
        activities.push({
          id: `email-${email.id}-sent`,
          type: 'sent',
          title: `${prospectName}에게 제안서 발송`,
          prospect_name: prospectName,
          timestamp: email.sent_at,
        });
      }

      if (email.opened_at) {
        activities.push({
          id: `email-${email.id}-opened`,
          type: 'opened',
          title: `${prospectName}이 링크를 클릭했습니다`,
          prospect_name: prospectName,
          timestamp: email.opened_at,
        });
      }

      if (email.clicked_at) {
        activities.push({
          id: `email-${email.id}-clicked`,
          type: 'clicked',
          title: `${prospectName}이 리포트를 열람했습니다`,
          prospect_name: prospectName,
          timestamp: email.clicked_at,
        });
      }
    }

    // 2. 리포트 추적 로그 활동 추가
    for (const log of trackingLogsResult.data || []) {
      const prospectName =
        (log.prospects as unknown as { name: string })?.name || '알 수 없음';
      const sessionKey = `${log.prospect_id}-${log.session_id}`;

      // 리포트 열람: 첫 조회만 기록 (session_id 기준)
      if (!processedSessions.has(sessionKey)) {
        processedSessions.add(sessionKey);
        activities.push({
          id: `tracking-${log.id}-opened`,
          type: 'opened',
          title: `${prospectName}님이 리포트를 열람했습니다`,
          prospect_name: prospectName,
          timestamp: log.created_at,
        });
      }

      // 리포트 완독: 스크롤 깊이 80% 이상
      if (log.scroll_depth >= 80) {
        activities.push({
          id: `tracking-${log.id}-scroll80`,
          type: 'scroll_80',
          title: `${prospectName}님이 리포트를 완독(80%+)했습니다`,
          prospect_name: prospectName,
          timestamp: log.created_at,
        });
      }
    }

    // 3. CRM 상태 변경 활동 추가
    for (const prospect of hotProspectsResult.data || []) {
      if (prospect.last_activity_at) {
        activities.push({
          id: `prospect-${prospect.id}-hot`,
          type: 'status_changed',
          title: `${prospect.name} 상태가 'Hot'으로 변경됨`,
          prospect_name: prospect.name,
          timestamp: prospect.last_activity_at,
        });
      }
    }

    // 시간순 정렬 (최신순)
    activities.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return { data: activities.slice(0, limit), error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
    console.error('최근 활동 조회 중 예외:', errorMessage);
    return { data: null, error: errorMessage };
  }
}

