/**
 * @file actions/user-assets.ts
 * @description User Assets 관련 Server Actions
 *
 * 사용자의 자료(포트폴리오, 성공 사례, GIF 등)를 관리합니다.
 */

'use server';

import { auth } from '@clerk/nextjs/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';
import type { UserAsset, CreateUserAssetInput } from '@/types/user-asset';

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
 * 사용자의 모든 assets 조회
 * @param fileType - 파일 타입 필터 (선택)
 */
export async function getUserAssets(options?: {
  fileType?: string;
}): Promise<{ data: UserAsset[] | null; error: string | null }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { data: null, error: '인증이 필요합니다.' };
    }

    const supabase = getServiceRoleClient();
    let query = supabase
      .from('user_assets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options?.fileType) {
      query = query.eq('file_type', options.fileType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('user_assets 조회 실패:', error);
      return { data: null, error: error.message };
    }

    return { data: data as UserAsset[], error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
    console.error('user_assets 조회 중 예외:', errorMessage);
    return { data: null, error: errorMessage };
  }
}

/**
 * 새 asset 메타데이터 저장
 * (파일 업로드는 클라이언트에서 Supabase Storage로 직접 수행 후 이 함수 호출)
 *
 * @param input - Asset 정보
 */
export async function createUserAsset(
  input: Omit<CreateUserAssetInput, 'user_id'>
): Promise<{ data: UserAsset | null; error: string | null }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { data: null, error: '인증이 필요합니다.' };
    }

    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from('user_assets')
      .insert({
        user_id: userId,
        file_type: input.file_type,
        file_url: input.file_url,
        file_name: input.file_name,
        summary: input.summary || null,
      })
      .select()
      .single();

    if (error) {
      console.error('user_asset 생성 실패:', error);
      return { data: null, error: error.message };
    }

    return { data: data as UserAsset, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
    console.error('user_asset 생성 중 예외:', errorMessage);
    return { data: null, error: errorMessage };
  }
}

/**
 * Asset 삭제
 * (Storage에서 파일 삭제는 별도로 수행 필요)
 *
 * @param assetId - Asset ID
 */
export async function deleteUserAsset(
  assetId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: '인증이 필요합니다.' };
    }

    const supabase = getServiceRoleClient();
    const { error } = await supabase
      .from('user_assets')
      .delete()
      .eq('id', assetId)
      .eq('user_id', userId);

    if (error) {
      console.error('user_asset 삭제 실패:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
    console.error('user_asset 삭제 중 예외:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Asset summary 업데이트
 *
 * @param assetId - Asset ID
 * @param summary - 새 요약 텍스트
 */
export async function updateUserAssetSummary(
  assetId: string,
  summary: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: '인증이 필요합니다.' };
    }

    const supabase = getServiceRoleClient();
    const { error } = await supabase
      .from('user_assets')
      .update({ summary })
      .eq('id', assetId)
      .eq('user_id', userId);

    if (error) {
      console.error('user_asset 업데이트 실패:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
    console.error('user_asset 업데이트 중 예외:', errorMessage);
    return { success: false, error: errorMessage };
  }
}
