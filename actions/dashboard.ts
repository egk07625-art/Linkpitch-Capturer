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
 * 최근 활동 조회 (타임라인용)
 * @param limit - 조회 개수 (기본값: 10)
 */
export async function getRecentActivity(limit: number = 10): Promise<{
  data: Array<{
    id: string;
    type: 'sent' | 'opened' | 'clicked' | 'hot';
    prospect_name: string;
    timestamp: string;
  }> | null;
  error: string | null;
}> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { data: null, error: '인증이 필요합니다.' };
    }

    const supabase = getServiceRoleClient();

    // 최근 발송된 이메일 조회
    const { data: emails, error: emailsError } = await supabase
      .from('generated_emails')
      .select(
        `
        id,
        status,
        sent_at,
        opened_at,
        clicked_at,
        prospects!inner(name)
      `
      )
      .eq('user_id', userId)
      .not('sent_at', 'is', null)
      .order('sent_at', { ascending: false })
      .limit(limit);

    if (emailsError) {
      console.error('최근 활동 조회 실패:', emailsError);
      return { data: null, error: emailsError.message };
    }

    // 활동 목록 생성
    const activities: Array<{
      id: string;
      type: 'sent' | 'opened' | 'clicked' | 'hot';
      prospect_name: string;
      timestamp: string;
    }> = [];

    for (const email of emails || []) {
      const prospectName =
        (email.prospects as unknown as { name: string })?.name || '알 수 없음';

      if (email.sent_at) {
        activities.push({
          id: `${email.id}-sent`,
          type: 'sent',
          prospect_name: prospectName,
          timestamp: email.sent_at,
        });
      }

      if (email.opened_at) {
        activities.push({
          id: `${email.id}-opened`,
          type: 'opened',
          prospect_name: prospectName,
          timestamp: email.opened_at,
        });
      }

      if (email.clicked_at) {
        activities.push({
          id: `${email.id}-clicked`,
          type: 'clicked',
          prospect_name: prospectName,
          timestamp: email.clicked_at,
        });
      }
    }

    // 시간순 정렬
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

