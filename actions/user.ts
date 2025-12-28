/**
 * @file actions/user.ts
 * @description User 관련 Server Actions
 */

'use server';

import { auth } from '@clerk/nextjs/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';

/**
 * 현재 로그인한 사용자의 Supabase UUID 조회
 * Chrome Extension이 n8n으로 데이터 전송 시 필요
 */
export async function getCurrentUserSupabaseId(): Promise<{
  userId: string | null;
  email: string | null;
  error: string | null;
}> {
  try {
    // 1. Clerk 인증 확인
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return { userId: null, email: null, error: 'NOT_AUTHENTICATED' };
    }

    // 2. Supabase에서 UUID 조회
    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from('users')
      .select('id, email')
      .eq('clerk_id', clerkId)
      .single();

    if (error) {
      console.error('Supabase user lookup failed:', error);
      return { userId: null, email: null, error: 'USER_NOT_FOUND' };
    }

    if (!data?.id) {
      return { userId: null, email: null, error: 'USER_ID_MISSING' };
    }

    return { userId: data.id, email: data.email, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'UNKNOWN_ERROR';
    console.error('getCurrentUserSupabaseId error:', errorMessage);
    return { userId: null, email: null, error: errorMessage };
  }
}

/**
 * 사용자 정보 조회 (확장된 정보 포함)
 */
export async function getCurrentUserInfo(): Promise<{
  data: {
    id: string;
    clerk_id: string;
    name: string | null;
    email: string | null;
  } | null;
  error: string | null;
}> {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return { data: null, error: 'NOT_AUTHENTICATED' };
    }

    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from('users')
      .select('id, clerk_id, name, email')
      .eq('clerk_id', clerkId)
      .single();

    if (error) {
      console.error('User info lookup failed:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'UNKNOWN_ERROR';
    console.error('getCurrentUserInfo error:', errorMessage);
    return { data: null, error: errorMessage };
  }
}
