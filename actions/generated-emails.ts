/**
 * @file actions/generated-emails.ts
 * @description Generated Emails 관련 Server Actions
 *
 * n8n에서 생성된 이메일/리포트를 관리합니다.
 */

'use server';

import { auth } from '@clerk/nextjs/server';
import { getServiceRoleClient } from '@/lib/supabase/service-role';
import type {
  GeneratedEmail,
  UpdateGeneratedEmailInput,
  GeneratedEmailStatus,
} from '@/types/generated-email';

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
 * Prospect별 생성된 이메일 조회
 * @param prospectId - Prospect ID
 * @param stepNumber - Step 번호 (선택)
 */
export async function getGeneratedEmailsByProspect(
  prospectId: string,
  stepNumber?: number
): Promise<{ data: GeneratedEmail[] | null; error: string | null }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { data: null, error: '인증이 필요합니다.' };
    }

    const supabase = getServiceRoleClient();
    let query = supabase
      .from('generated_emails')
      .select('*')
      .eq('prospect_id', prospectId)
      .eq('user_id', userId)
      .order('step_number', { ascending: true });

    if (stepNumber) {
      query = query.eq('step_number', stepNumber);
    }

    const { data, error } = await query;

    if (error) {
      console.error('generated_emails 조회 실패:', error);
      return { data: null, error: error.message };
    }

    // 🔍 전체 데이터 객체 구조 확인 (서버 사이드)
    if (data && data.length > 0) {
      console.log('[getGeneratedEmailsByProspect] 🔍 전체 데이터 객체 구조:', JSON.stringify(data, null, 2));
      data.forEach((email, index) => {
        console.log(`[getGeneratedEmailsByProspect] Email ${index + 1} (step ${email.step_number}):`, {
          id: email.id,
          step_number: email.step_number,
          email_body: email.email_body,
          email_body_solopreneur: email.email_body_solopreneur,
          email_body_corporate: email.email_body_corporate,
          cta_text: email.cta_text,
          report_url: email.report_url,
          '전체 키 목록': Object.keys(email),
        });
      });
    } else {
      console.log('[getGeneratedEmailsByProspect] ⚠️ 데이터가 없습니다.');
    }

    return { data: data as GeneratedEmail[], error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
    console.error('generated_emails 조회 중 예외:', errorMessage);
    return { data: null, error: errorMessage };
  }
}

/**
 * 특정 이메일 상세 조회
 * @param emailId - Generated Email ID
 */
export async function getGeneratedEmailById(
  emailId: string
): Promise<{ data: GeneratedEmail | null; error: string | null }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { data: null, error: '인증이 필요합니다.' };
    }

    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from('generated_emails')
      .select('*')
      .eq('id', emailId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('generated_email 조회 실패:', error);
      return { data: null, error: error.message };
    }

    return { data: data as GeneratedEmail, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
    console.error('generated_email 조회 중 예외:', errorMessage);
    return { data: null, error: errorMessage };
  }
}

/**
 * 이메일 콘텐츠 업데이트 (Workspace에서 편집 후 저장)
 * @param emailId - Generated Email ID
 * @param input - 업데이트할 필드
 */
export async function updateGeneratedEmailContent(
  emailId: string,
  input: UpdateGeneratedEmailInput
): Promise<{ success: boolean; error: string | null }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: '인증이 필요합니다.' };
    }

    const supabase = getServiceRoleClient();
    const { error } = await supabase
      .from('generated_emails')
      .update(input)
      .eq('id', emailId)
      .eq('user_id', userId);

    if (error) {
      console.error('generated_email 업데이트 실패:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
    console.error('generated_email 업데이트 중 예외:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * 이메일 발송 완료 처리 (Snapshot 저장)
 * @param emailId - Generated Email ID
 */
export async function markEmailAsSent(
  emailId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: '인증이 필요합니다.' };
    }

    const supabase = getServiceRoleClient();
    const { error } = await supabase
      .from('generated_emails')
      .update({
        status: 'sent' as GeneratedEmailStatus,
        sent_at: new Date().toISOString(),
      })
      .eq('id', emailId)
      .eq('user_id', userId);

    if (error) {
      console.error('발송 완료 처리 실패:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
    console.error('발송 완료 처리 중 예외:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * 사용자의 모든 발송된 이메일 조회
 */
export async function getSentEmails(): Promise<{
  data: GeneratedEmail[] | null;
  error: string | null;
}> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { data: null, error: '인증이 필요합니다.' };
    }

    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from('generated_emails')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'sent')
      .order('sent_at', { ascending: false });

    if (error) {
      console.error('발송된 이메일 조회 실패:', error);
      return { data: null, error: error.message };
    }

    return { data: data as GeneratedEmail[], error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
    console.error('발송된 이메일 조회 중 예외:', errorMessage);
    return { data: null, error: errorMessage };
  }
}

/**
 * 이메일 상태별 개수 조회 (대시보드 KPI용)
 */
export async function getEmailCountByStatus(): Promise<{
  data: { pending: number; sent: number; opened: number; clicked: number; total: number } | null;
  error: string | null;
}> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { data: null, error: '인증이 필요합니다.' };
    }

    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from('generated_emails')
      .select('status')
      .eq('user_id', userId);

    if (error) {
      console.error('이메일 상태 개수 조회 실패:', error);
      return { data: null, error: error.message };
    }

    const counts = {
      pending: data?.filter((e) => e.status === 'pending').length || 0,
      sent: data?.filter((e) => e.status === 'sent').length || 0,
      opened: data?.filter((e) => e.status === 'opened').length || 0,
      clicked: data?.filter((e) => e.status === 'clicked').length || 0,
      total: data?.length || 0,
    };

    return { data: counts, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류';
    console.error('이메일 상태 개수 조회 중 예외:', errorMessage);
    return { data: null, error: errorMessage };
  }
}
