/**
 * @file steps.ts
 * @description Step 관련 Server Actions
 *
 * Step 생성, 업데이트를 위한 Server Actions
 * PRD.md의 steps 테이블과 연동
 */

'use server';

import type { Step, CreateStepInput, UpdateStepInput } from '@/types/step';

/**
 * 특정 Prospect의 모든 Step 조회
 */
export async function getStepsByProspectId(_prospectId: string): Promise<Step[]> {
  // const supabase = await createClerkSupabaseClient();
  // TODO: 구현 필요
  return [];
}

/**
 * 새로운 Step 생성
 */
export async function createStep(_input: CreateStepInput): Promise<Step> {
  // const supabase = await createClerkSupabaseClient();
  // TODO: 구현 필요
  throw new Error('Not implemented');
}

/**
 * Step 업데이트 (발송 완료 처리 등)
 */
export async function updateStep(
  _id: string,
  _input: UpdateStepInput
): Promise<Step> {
  // const supabase = await createClerkSupabaseClient();
  // TODO: 구현 필요
  throw new Error('Not implemented');
}

/**
 * Step 발송 완료 처리
 */
export async function markStepAsSent(stepId: string): Promise<Step> {
  return updateStep(stepId, {
    
    sent_at: new Date().toISOString(),
  });
}
