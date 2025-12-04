/**
 * @file actions/workspace.ts
 * @description Workspace 관련 Server Actions
 *
 * Prospect별 Workspace 데이터를 조회하고 관리합니다.
 */

'use server';

import { auth } from '@clerk/nextjs/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';
import type { Prospect, VisionData } from '@/types/prospect';
import type { UserAsset } from '@/types/user-asset';
import type { GeneratedEmail } from '@/types/generated-email';

export interface WorkspaceData {
  prospect: Prospect | null;
  visionData: VisionData | null;
  userAssets: UserAsset[];
  generatedEmails: GeneratedEmail[];
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
 * Workspace용 전체 데이터 로드
 * @param prospectId - Prospect ID
 */
export async function getWorkspaceData(
  prospectId: string
): Promise<{ data: WorkspaceData | null; error: string | null }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { data: null, error: '인증이 필요합니다.' };
    }

    const supabase = getServiceRoleClient();

    // 병렬로 모든 데이터 조회
    const [prospectResult, assetsResult, emailsResult] = await Promise.all([
      // 1. Prospect 데이터 (cache_id 포함)
      supabase
        .from('prospects')
        .select('*')
        .eq('id', prospectId)
        .eq('user_id', userId)
        .single(),

      // 2. User Assets
      supabase
        .from('user_assets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),

      // 3. Generated Emails (해당 prospect)
      supabase
        .from('generated_emails')
        .select('*')
        .eq('prospect_id', prospectId)
        .eq('user_id', userId)
        .order('step_number', { ascending: true }),
    ]);

    if (prospectResult.error) {
      console.error('Prospect 조회 실패:', prospectResult.error);
      return { data: null, error: prospectResult.error.message };
    }

    const prospect = prospectResult.data as Prospect;

    // Vision Data 조회 (cache_id가 있는 경우)
    let visionData: VisionData | null = null;
    if (prospect?.cache_id) {
      const { data: cacheData } = await supabase
        .from('site_analysis_cache')
        .select('vision_data')
        .eq('id', prospect.cache_id)
        .single();

      if (cacheData?.vision_data) {
        visionData = cacheData.vision_data as VisionData;
      }
    }

    return {
      data: {
        prospect,
        visionData,
        userAssets: (assetsResult.data as UserAsset[]) || [],
        generatedEmails: (emailsResult.data as GeneratedEmail[]) || [],
      },
      error: null,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
    console.error('Workspace 데이터 조회 중 예외:', errorMessage);
    return { data: null, error: errorMessage };
  }
}

/**
 * 편집 중인 이메일 콘텐츠 저장
 * @param emailId - Generated Email ID
 * @param editableHtml - 편집된 HTML
 */
export async function saveWorkspaceEdit(
  emailId: string,
  editableHtml: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: '인증이 필요합니다.' };
    }

    const supabase = getServiceRoleClient();
    const { error } = await supabase
      .from('generated_emails')
      .update({ report_html_editable: editableHtml })
      .eq('id', emailId)
      .eq('user_id', userId);

    if (error) {
      console.error('Workspace 편집 저장 실패:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
    console.error('Workspace 편집 저장 중 예외:', errorMessage);
    return { success: false, error: errorMessage };
  }
}
