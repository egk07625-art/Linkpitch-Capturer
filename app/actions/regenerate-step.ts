/**
 * @file regenerate-step.ts
 * @description Step 재생성 Server Action
 *
 * Strategy Chip을 드래그하여 Step의 email_body를 재생성합니다.
 * PRD.md의 /webhook/regenerate-step 명세를 따릅니다.
 */

'use server';

import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

/**
 * Step 재생성
 * 
 * @param stepId Step ID
 * @param chipText Strategy Chip 텍스트 (예: "📷 성과 그래프")
 * @returns 재생성된 email_body
 * @throws 에러 발생 시 예외 던짐
 */
export async function regenerateStepAction(
  stepId: string,
  chipText: string
): Promise<string> {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized: 사용자 인증이 필요합니다.');
  }

  const supabase = await createClerkSupabaseClient();

  // 1. Step 데이터 조회 (sequence, prospect 포함)
  const { data: step, error: stepError } = await supabase
    .from('step')
    .select(`
      *,
      sequence:sequences!inner(
        custom_context,
        prospect:prospects!inner(*)
      )
    `)
    .eq('id', stepId)
    .eq('user_id', userId)
    .single();

  if (stepError || !step) {
    throw new Error(`Step 조회 실패: ${stepError?.message || 'Step을 찾을 수 없습니다.'}`);
  }

  // 타입 안전성을 위한 타입 가드
  const sequence = step.sequence as any;
  const prospect = sequence?.prospect as any;

  if (!sequence || !prospect) {
    throw new Error('Sequence 또는 Prospect를 찾을 수 없습니다.');
  }

  const n8nWebhookUrl = process.env.N8N_WEBHOOK_REGENERATE_STEP;
  
  if (!n8nWebhookUrl) {
    throw new Error('N8N_WEBHOOK_REGENERATE_STEP 환경 변수가 설정되지 않았습니다.');
  }

  // 2. n8n Webhook 호출
  const response = await fetch(n8nWebhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      step_id: stepId,
      step_number: step.step_number,
      brand_name: prospect.name,
      current_body: step.email_body,
      source_material: {
        vision_data: prospect.vision_data,
        custom_context: sequence.custom_context || '',
      },
      strategy_chip: chipText,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Step 재생성 실패: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  const emailBody = result.email_body as string;

  if (!emailBody || typeof emailBody !== 'string') {
    throw new Error('Step 재생성 실패: email_body가 반환되지 않았습니다.');
  }

  // 3. Step 업데이트
  const { error: updateError } = await supabase
    .from('step')
    .update({ 
      email_body: emailBody,
      updated_at: new Date().toISOString(),
    })
    .eq('id', stepId)
    .eq('user_id', userId);

  if (updateError) {
    throw new Error(`Step 업데이트 실패: ${updateError.message}`);
  }

  return emailBody;
}


