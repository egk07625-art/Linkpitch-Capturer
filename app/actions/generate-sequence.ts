/**
 * @file generate-sequence.ts
 * @description 시퀀스 생성 Server Action
 *
 * Prospect에 대한 9단계 시퀀스를 생성합니다.
 * PRD.md의 /webhook/generate-sequence 명세를 따릅니다.
 */

'use server';

import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import type { Sequence } from '@/types/sequence';

/**
 * 시퀀스 생성
 * 
 * @param prospectId Prospect ID
 * @param customContext 나만의 무기 (Custom Context) - 선택사항
 * @returns 생성된 Sequence 객체
 * @throws 에러 발생 시 예외 던짐
 */
export async function generateSequenceAction(
  prospectId: string,
  customContext?: string
): Promise<Sequence> {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized: 사용자 인증이 필요합니다.');
  }

  const supabase = await createClerkSupabaseClient();

  // 1. Prospect 데이터 조회
  const { data: prospect, error: prospectError } = await supabase
    .from('prospects')
    .select('*')
    .eq('id', prospectId)
    .eq('user_id', userId)
    .single();

  if (prospectError || !prospect) {
    throw new Error(`Prospect 조회 실패: ${prospectError?.message || 'Prospect를 찾을 수 없습니다.'}`);
  }

  const n8nWebhookUrl = process.env.N8N_WEBHOOK_GENERATE_SEQUENCE;
  
  if (!n8nWebhookUrl) {
    throw new Error('N8N_WEBHOOK_GENERATE_SEQUENCE 환경 변수가 설정되지 않았습니다.');
  }

  // 2. n8n Webhook 호출
  const response = await fetch(n8nWebhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prospect_id: prospectId,
      brand_name: prospect.name,
      vision_data: prospect.vision_data,
      custom_context: customContext || '',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`시퀀스 생성 실패: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  const steps = result.steps as Array<{
    step_number: number;
    step_type: string;
    email_subject: string;
    email_body: string;
  }>;

  if (!Array.isArray(steps) || steps.length !== 9) {
    throw new Error(`시퀀스 생성 실패: 9개의 Step이 생성되지 않았습니다. (실제: ${steps.length}개)`);
  }

  // 3. Sequence 생성
  const { data: sequence, error: sequenceError } = await supabase
    .from('sequences')
    .insert({
      user_id: userId,
      prospect_id: prospectId,
      name: `${prospect.name} 시퀀스`,
      sequence_type: '9_steps',
      total_steps: 9,
      current_step: 0,
      status: 'draft',
      custom_context: customContext || null,
    })
    .select()
    .single();

  if (sequenceError || !sequence) {
    throw new Error(`Sequence 생성 실패: ${sequenceError?.message || 'Sequence를 생성할 수 없습니다.'}`);
  }

  // 4. Steps 일괄 INSERT (제약 조건 검증 포함)
  const stepsToInsert = steps.map((s, index) => {
    // step_number 범위 검증 (1-9)
    const stepNumber = s.step_number || index + 1;
    if (stepNumber < 1 || stepNumber > 9) {
      throw new Error(`Step 번호가 유효하지 않습니다: ${stepNumber} (1-9 범위여야 함)`);
    }

    return {
      user_id: userId,
      sequence_id: sequence.id,
      step_number: stepNumber,
      step_type: s.step_type,
      email_subject: s.email_subject,
      email_body: s.email_body,
      status: 'pending' as const,
      is_core_step: [1, 3, 6, 9].includes(stepNumber),
    };
  });

  // step_number 중복 체크 (sequence_id, step_number UNIQUE 제약)
  const stepNumbers = stepsToInsert.map(s => s.step_number);
  const uniqueStepNumbers = new Set(stepNumbers);
  if (stepNumbers.length !== uniqueStepNumbers.size) {
    throw new Error(`Step 번호 중복이 발견되었습니다: ${stepNumbers.join(', ')}`);
  }

  const { error: stepsError } = await supabase
    .from('step')
    .insert(stepsToInsert);

  if (stepsError) {
    // Sequence는 이미 생성되었으므로 롤백 필요
    await supabase.from('sequences').delete().eq('id', sequence.id);
    throw new Error(`Steps 생성 실패: ${stepsError.message}`);
  }

  return sequence as Sequence;
}
