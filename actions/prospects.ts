/**
 * @file actions/prospects.ts
 * @description Prospects 관련 Server Actions
 */

'use server';

import { auth } from '@clerk/nextjs/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';
import type { Prospect, CRMStatus, CampaignStats } from '@/types/prospect';

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

export type GetProspectsOptions = {
  status?: CRMStatus;
  limit?: number;
  offset?: number;
  search?: string;
};

/**
 * 사용자의 모든 prospects 조회
 * @param options - 조회 옵션 (status, limit, offset, search)
 */
export async function getProspects(options?: GetProspectsOptions): Promise<Prospect[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return [];
    }

    const supabase = getServiceRoleClient();
    let query = supabase
      .from('prospects')
      .select('*')
      .eq('user_id', userId)
      .order('last_activity_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (options?.status) {
      query = query.eq('crm_status', options.status);
    }

    if (options?.search) {
      query = query.or(`name.ilike.%${options.search}%,store_name.ilike.%${options.search}%,contact_email.ilike.%${options.search}%`);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('prospects 조회 실패:', error);
      return [];
    }

    return (data as Prospect[]) || [];
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
    console.error('prospects 조회 중 예외:', errorMessage);
    return [];
  }
}

/**
 * Prospects 개수 조회
 * @param options - 필터 옵션
 */
export async function getProspectsCount(options?: {
  status?: CRMStatus;
  search?: string;
}): Promise<number> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return 0;
    }

    const supabase = getServiceRoleClient();
    let query = supabase
      .from('prospects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (options?.status) {
      query = query.eq('crm_status', options.status);
    }

    if (options?.search) {
      query = query.or(`name.ilike.%${options.search}%,store_name.ilike.%${options.search}%,contact_email.ilike.%${options.search}%`);
    }

    const { count, error } = await query;

    if (error) {
      console.error('prospects 개수 조회 실패:', error);
      return 0;
    }

    return count || 0;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
    console.error('prospects 개수 조회 중 예외:', errorMessage);
    return 0;
  }
}

/**
 * 특정 prospect 상세 조회
 * @param prospectId - Prospect ID
 */
export async function getProspectById(
  prospectId: string
): Promise<{ data: Prospect | null; error: string | null }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { data: null, error: '인증이 필요합니다.' };
    }

    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from('prospects')
      .select('*')
      .eq('id', prospectId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('prospect 조회 실패:', error);
      return { data: null, error: error.message };
    }

    return { data: data as Prospect, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
    console.error('prospect 조회 중 예외:', errorMessage);
    return { data: null, error: errorMessage };
  }
}

/**
 * CRM 상태별 prospects 개수 조회
 */
export async function getProspectsCountByStatus(): Promise<{
  data: { hot: number; warm: number; cold: number; total: number } | null;
  error: string | null;
}> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { data: null, error: '인증이 필요합니다.' };
    }

    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from('prospects')
      .select('crm_status')
      .eq('user_id', userId);

    if (error) {
      console.error('prospects 개수 조회 실패:', error);
      return { data: null, error: error.message };
    }

    const counts = {
      hot: data?.filter((p) => p.crm_status === 'hot').length || 0,
      warm: data?.filter((p) => p.crm_status === 'warm').length || 0,
      cold: data?.filter((p) => p.crm_status === 'cold').length || 0,
      total: data?.length || 0,
    };

    return { data: counts, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
    console.error('prospects 개수 조회 중 예외:', errorMessage);
    return { data: null, error: errorMessage };
  }
}

/**
 * 새 Prospect 생성
 */
export async function createProspect(data: {
  name: string;
  contact_name?: string;
  contact_email: string;
  contact_phone?: string;
  url: string;
  memo?: string;
  store_name?: string;
  category?: string;
}): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('인증이 필요합니다.');
  }

  const supabase = getServiceRoleClient();
  const { error } = await supabase.from('prospects').insert({
    user_id: userId,
    name: data.name,
    store_name: data.store_name || data.name,
    contact_name: data.contact_name,
    contact_email: data.contact_email,
    contact_phone: data.contact_phone,
    url: data.url,
    memo: data.memo,
    category: data.category,
    crm_status: 'cold',
  });

  if (error) {
    console.error('Prospect 생성 실패:', error);
    throw new Error(error.message);
  }
}

/**
 * Prospect 정보 업데이트
 */
export async function updateProspect(
  prospectId: string,
  data: Partial<{
    name: string;
    store_name: string;
    contact_name: string;
    contact_email: string;
    contact_phone: string;
    url: string;
    memo: string;
    category: string;
    crm_status: CRMStatus;
  }>
): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('인증이 필요합니다.');
  }

  const supabase = getServiceRoleClient();
  const { error } = await supabase
    .from('prospects')
    .update(data)
    .eq('id', prospectId)
    .eq('user_id', userId);

  if (error) {
    console.error('Prospect 업데이트 실패:', error);
    throw new Error(error.message);
  }
}

/**
 * Prospect 삭제
 */
export async function deleteProspect(prospectId: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('인증이 필요합니다.');
  }

  const supabase = getServiceRoleClient();
  const { error } = await supabase
    .from('prospects')
    .delete()
    .eq('id', prospectId)
    .eq('user_id', userId);

  if (error) {
    console.error('Prospect 삭제 실패:', error);
    throw new Error(error.message);
  }
}

/**
 * Prospect CRM 상태 수동 업데이트
 * @param prospectId - Prospect ID
 * @param status - 새 CRM 상태
 */
export async function updateProspectCRMStatus(
  prospectId: string,
  status: CRMStatus
): Promise<{ success: boolean; error: string | null }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: '인증이 필요합니다.' };
    }

    const supabase = getServiceRoleClient();
    const { error } = await supabase
      .from('prospects')
      .update({ crm_status: status })
      .eq('id', prospectId)
      .eq('user_id', userId);

    if (error) {
      console.error('CRM 상태 업데이트 실패:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
    console.error('CRM 상태 업데이트 중 예외:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Prospect의 캠페인 통계 조회
 * @param prospectId - Prospect ID
 * @returns 캠페인 통계 데이터 (보낸 메일 수, 다음 일정 등)
 */
export async function getProspectCampaignStats(
  prospectId: string
): Promise<{ data: CampaignStats | null; error: string | null }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { data: null, error: '인증이 필요합니다.' };
    }

    const supabase = getServiceRoleClient();

    // 1. 해당 prospect의 모든 sequence 조회
    const { data: sequences, error: sequencesError } = await supabase
      .from('sequences')
      .select('id')
      .eq('prospect_id', prospectId)
      .eq('user_id', userId);

    if (sequencesError) {
      console.error('sequences 조회 실패:', sequencesError);
      return { data: null, error: sequencesError.message };
    }

    if (!sequences || sequences.length === 0) {
      // sequence가 없으면 기본값 반환
      return {
        data: {
          sentCount: 0,
          nextScheduleDate: null,
          daysUntilNext: null,
          progress: 0,
        },
        error: null,
      };
    }

    const sequenceIds = sequences.map((s) => s.id);

    // 2. 보낸 메일 수 계산 (status = 'sent')
    const { data: sentSteps, error: sentError } = await supabase
      .from('step')
      .select('id, sent_at')
      .in('sequence_id', sequenceIds)
      .eq('status', 'sent')
      .eq('user_id', userId);

    if (sentError) {
      console.error('sent steps 조회 실패:', sentError);
      return { data: null, error: sentError.message };
    }

    const sentCount = sentSteps?.length || 0;

    // 3. 다음 일정 계산 (status = 'pending'이고 가장 작은 step_number)
    const { data: pendingSteps, error: pendingError } = await supabase
      .from('step')
      .select('id, step_number, sent_at, created_at')
      .in('sequence_id', sequenceIds)
      .eq('status', 'pending')
      .eq('user_id', userId)
      .order('step_number', { ascending: true })
      .limit(1);

    if (pendingError) {
      console.error('pending steps 조회 실패:', pendingError);
      return { data: null, error: pendingError.message };
    }

    let nextScheduleDate: string | null = null;
    let daysUntilNext: number | null = null;

    if (pendingSteps && pendingSteps.length > 0) {
      const nextStep = pendingSteps[0];
      const now = new Date();
      
      // 마지막으로 보낸 메일의 sent_at을 기준으로 +3일 계산
      // sent_at이 없으면 created_at 기준으로 +3일
      let baseDate: Date;
      
      if (sentSteps && sentSteps.length > 0) {
        // 가장 최근에 보낸 메일의 sent_at 사용
        const lastSent = sentSteps
          .filter((s) => s.sent_at)
          .sort((a, b) => {
            const dateA = new Date(a.sent_at!).getTime();
            const dateB = new Date(b.sent_at!).getTime();
            return dateB - dateA;
          })[0];
        
        if (lastSent?.sent_at) {
          baseDate = new Date(lastSent.sent_at);
        } else {
          baseDate = new Date(nextStep.created_at);
        }
      } else {
        baseDate = new Date(nextStep.created_at);
      }

      // +3일 후 계산
      const nextDate = new Date(baseDate);
      nextDate.setDate(nextDate.getDate() + 3);
      nextScheduleDate = nextDate.toISOString();

      // 남은 일수 계산
      const diffTime = nextDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      daysUntilNext = diffDays > 0 ? diffDays : 0;
    }

    // 4. 진행률 계산 (보낸 메일 수 / 총 step 수 * 100)
    const { data: allSteps, error: allStepsError } = await supabase
      .from('step')
      .select('id')
      .in('sequence_id', sequenceIds)
      .eq('user_id', userId);

    if (allStepsError) {
      console.error('all steps 조회 실패:', allStepsError);
      return { data: null, error: allStepsError.message };
    }

    const totalSteps = allSteps?.length || 0;
    const progress = totalSteps > 0 ? Math.round((sentCount / totalSteps) * 100) : 0;

    return {
      data: {
        sentCount,
        nextScheduleDate,
        daysUntilNext,
        progress,
      },
      error: null,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
    console.error('캠페인 통계 조회 중 예외:', errorMessage);
    return { data: null, error: errorMessage };
  }
}

/**
 * 여러 Prospect의 캠페인 통계를 한 번에 조회 (N+1 문제 방지)
 * @param prospectIds - Prospect ID 배열
 * @returns Prospect ID를 키로 하는 캠페인 통계 맵
 */
export async function getProspectsCampaignStats(
  prospectIds: string[]
): Promise<{ data: Record<string, CampaignStats> | null; error: string | null }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { data: null, error: '인증이 필요합니다.' };
    }

    if (prospectIds.length === 0) {
      return { data: {}, error: null };
    }

    const supabase = getServiceRoleClient();

    // 모든 sequence 조회
    const { data: sequences, error: sequencesError } = await supabase
      .from('sequences')
      .select('id, prospect_id')
      .in('prospect_id', prospectIds)
      .eq('user_id', userId);

    if (sequencesError) {
      console.error('sequences 조회 실패:', sequencesError);
      return { data: null, error: sequencesError.message };
    }

    if (!sequences || sequences.length === 0) {
      // 모든 prospect에 대해 기본값 반환
      const defaultStats: Record<string, CampaignStats> = {};
      prospectIds.forEach((id) => {
        defaultStats[id] = {
          sentCount: 0,
          nextScheduleDate: null,
          daysUntilNext: null,
          progress: 0,
        };
      });
      return { data: defaultStats, error: null };
    }

    // prospect_id별로 sequence 그룹화
    const sequencesByProspect: Record<string, string[]> = {};
    sequences.forEach((seq) => {
      if (!sequencesByProspect[seq.prospect_id]) {
        sequencesByProspect[seq.prospect_id] = [];
      }
      sequencesByProspect[seq.prospect_id].push(seq.id);
    });

    const allSequenceIds = sequences.map((s) => s.id);

    // 모든 step 조회
    const { data: allSteps, error: allStepsError } = await supabase
      .from('step')
      .select('id, sequence_id, status, step_number, sent_at, created_at')
      .in('sequence_id', allSequenceIds)
      .eq('user_id', userId);

    if (allStepsError) {
      console.error('steps 조회 실패:', allStepsError);
      return { data: null, error: allStepsError.message };
    }

    // 각 prospect별로 통계 계산
    const stats: Record<string, CampaignStats> = {};
    const now = new Date();

    prospectIds.forEach((prospectId) => {
      const seqIds = sequencesByProspect[prospectId] || [];
      const steps = allSteps?.filter((s) => seqIds.includes(s.sequence_id)) || [];

      const sentSteps = steps.filter((s) => s.status === 'sent');
      const sentCount = sentSteps.length;

      // 다음 일정 계산
      const pendingSteps = steps
        .filter((s) => s.status === 'pending')
        .sort((a, b) => a.step_number - b.step_number);

      let nextScheduleDate: string | null = null;
      let daysUntilNext: number | null = null;

      if (pendingSteps.length > 0) {
        const nextStep = pendingSteps[0];
        let baseDate: Date;

        if (sentSteps.length > 0) {
          const lastSent = sentSteps
            .filter((s) => s.sent_at)
            .sort((a, b) => {
              const dateA = new Date(a.sent_at!).getTime();
              const dateB = new Date(b.sent_at!).getTime();
              return dateB - dateA;
            })[0];

          if (lastSent?.sent_at) {
            baseDate = new Date(lastSent.sent_at);
          } else {
            baseDate = new Date(nextStep.created_at);
          }
        } else {
          baseDate = new Date(nextStep.created_at);
        }

        const nextDate = new Date(baseDate);
        nextDate.setDate(nextDate.getDate() + 3);
        nextScheduleDate = nextDate.toISOString();

        const diffTime = nextDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        daysUntilNext = diffDays > 0 ? diffDays : 0;
      }

      const totalSteps = steps.length;
      const progress = totalSteps > 0 ? Math.round((sentCount / totalSteps) * 100) : 0;

      stats[prospectId] = {
        sentCount,
        nextScheduleDate,
        daysUntilNext,
        progress,
      };
    });

    return { data: stats, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
    console.error('캠페인 통계 일괄 조회 중 예외:', errorMessage);
    return { data: null, error: errorMessage };
  }
}
