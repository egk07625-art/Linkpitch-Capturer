/**
 * @file update-step-status.ts
 * @description Step 발송 상태 업데이트 Server Action
 *
 * Copy & Log 버튼 클릭 시 Step의 상태를 'sent'로 업데이트합니다.
 * PRD.md의 Optimistic UI 패턴을 따릅니다.
 */

'use server';

import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import type { StepStatus } from '@/types/step';

/**
 * Step 발송 상태 업데이트
 * 
 * @param stepId Step ID
 * @param status 업데이트할 상태 (일반적으로 'sent')
 * @returns 업데이트 성공 여부
 * @throws 에러 발생 시 예외 던짐
 */
export async function updateStepStatusAction(
  stepId: string,
  status: StepStatus = 'sent'
): Promise<void> {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized: 사용자 인증이 필요합니다.');
  }

  // StepStatus 타입 검증 ('pending' | 'sent'만 허용)
  if (status !== 'pending' && status !== 'sent') {
    throw new Error(`Invalid status: ${status}. Only 'pending' or 'sent' are allowed.`);
  }

  const supabase = await createClerkSupabaseClient();

  // Step이 현재 사용자의 것인지 확인
  const { data: step, error: checkError } = await supabase
    .from('step')
    .select('id')
    .eq('id', stepId)
    .eq('user_id', userId)
    .single();

  if (checkError || !step) {
    throw new Error(`Step 조회 실패: ${checkError?.message || 'Step을 찾을 수 없습니다.'}`);
  }

  // Step 상태 업데이트
  const updateData: {
    status: StepStatus;
    sent_at?: string;
    updated_at: string;
  } = {
    status,
    updated_at: new Date().toISOString(),
  };

  // 'sent' 상태로 변경 시 sent_at 타임스탬프 기록
  if (status === 'sent') {
    updateData.sent_at = new Date().toISOString();
  }

  const { error: updateError } = await supabase
    .from('step')
    .update(updateData)
    .eq('id', stepId)
    .eq('user_id', userId);

  if (updateError) {
    throw new Error(`Step 상태 업데이트 실패: ${updateError.message}`);
  }
}


