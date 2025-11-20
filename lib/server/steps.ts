/**
 * @file steps.ts
 * @description Step 관련 서버 함수
 *
 * Step 생성, 조회, 업데이트 등의 서버 사이드 로직
 */

import { createClerkSupabaseClient } from "@/lib/supabase/server";
import type { Step, CreateStepInput, UpdateStepInput } from "@/types/step";

/**
 * Step 생성
 */
export async function createStep(
  userId: string,
  input: CreateStepInput
): Promise<Step> {
  const supabase = createClerkSupabaseClient();

  const { data, error } = await supabase
    .from("steps")
    .insert({
      user_id: userId,
      status: "pending",
      ...input,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create step: ${error.message}`);
  }

  return data;
}

/**
 * Sequence의 모든 Step 조회
 */
export async function listStepsBySequence(
  userId: string,
  sequenceId: string
): Promise<Step[]> {
  const supabase = createClerkSupabaseClient();

  const { data, error } = await supabase
    .from("steps")
    .select("*")
    .eq("sequence_id", sequenceId)
    .eq("user_id", userId)
    .order("step_number", { ascending: true });

  if (error) {
    throw new Error(`Failed to list steps: ${error.message}`);
  }

  return data || [];
}

/**
 * Step 조회 (ID로)
 */
export async function getStepById(
  userId: string,
  stepId: string
): Promise<Step | null> {
  const supabase = createClerkSupabaseClient();

  const { data, error } = await supabase
    .from("steps")
    .select("*")
    .eq("id", stepId)
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to get step: ${error.message}`);
  }

  return data;
}

/**
 * Step 업데이트
 */
export async function updateStep(
  userId: string,
  stepId: string,
  input: UpdateStepInput
): Promise<Step> {
  const supabase = createClerkSupabaseClient();

  const { data, error } = await supabase
    .from("steps")
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq("id", stepId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update step: ${error.message}`);
  }

  return data;
}

/**
 * Step 상태 업데이트
 */
// export async function updateStepStatus(
//   userId: string,
//   stepId: string,
// //   status: Step["status"]
// // ): Promise<Step> {
// //   return updateStep(userId, stepId, { status });
// // }


/**
 * Step 발송 완료 처리 (PRD.md 기반)
 * 새로운 타입 정의에 맞춰 is_sent를 사용
 */
export async function markStepAsSent(
  userId: string,
  stepId: string
): Promise<Step> {
  return updateStep(userId, stepId, { 
    
    sent_at: new Date().toISOString(),
  });
}
