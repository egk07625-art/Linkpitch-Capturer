/**
 * @file actions/prospects.ts
 * @description Prospects 관련 Server Actions
 */

'use server';

import { auth } from '@clerk/nextjs/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';
import type { Prospect, CRMStatus } from '@/types/prospect';

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
 * 사용자의 모든 prospects 조회
 * @param status - CRM 상태 필터 (선택)
 * @param limit - 조회 개수 제한
 */
export async function getProspects(options?: {
  status?: CRMStatus;
  limit?: number;
}): Promise<{ data: Prospect[] | null; error: string | null }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { data: null, error: '인증이 필요합니다.' };
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

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('prospects 조회 실패:', error);
      return { data: null, error: error.message };
    }

    return { data: data as Prospect[], error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
    console.error('prospects 조회 중 예외:', errorMessage);
    return { data: null, error: errorMessage };
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
