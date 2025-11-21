/**
 * @file sequences.ts
 * @description Sequence 관련 서버 함수
 *
 * Sequence 생성, 조회, 업데이트 등의 서버 사이드 로직
 */

import { createClerkSupabaseClient } from "@/lib/supabase/server";
import type {
  Sequence,
  CreateSequenceInput,
  UpdateSequenceInput,
} from "@/types/sequence";

/**
 * Sequence 생성
 */
export async function createSequence(
  userId: string,
  input: CreateSequenceInput
): Promise<Sequence> {
  const supabase = createClerkSupabaseClient();

  const { data, error } = await supabase
    .from("sequences")
    .insert({
      user_id: userId,
      current_step: 0,
      status: "draft", // 스키마 기본값과 일치
      ...input,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create sequence: ${error.message}`);
  }

  return data;
}

/**
 * 사용자의 모든 Sequence 조회
 */
export async function listSequencesByUser(userId: string): Promise<Sequence[]> {
  const supabase = createClerkSupabaseClient();

  const { data, error } = await supabase
    .from("sequences")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to list sequences: ${error.message}`);
  }

  return data || [];
}

/**
 * Sequence 조회 (ID로)
 */
export async function getSequenceById(
  userId: string,
  sequenceId: string
): Promise<Sequence | null> {
  const supabase = createClerkSupabaseClient();

  const { data, error } = await supabase
    .from("sequences")
    .select("*")
    .eq("id", sequenceId)
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw new Error(`Failed to get sequence: ${error.message}`);
  }

  return data;
}

/**
 * Sequence 업데이트
 */
export async function updateSequence(
  userId: string,
  sequenceId: string,
  input: UpdateSequenceInput
): Promise<Sequence> {
  const supabase = createClerkSupabaseClient();

  // status 제약 조건 검증
  if (input.status && !['draft', 'active', 'completed', 'paused'].includes(input.status)) {
    throw new Error(`Invalid status: ${input.status}. Must be one of: draft, active, completed, paused`);
  }

  const { data, error } = await supabase
    .from("sequences")
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sequenceId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update sequence: ${error.message}`);
  }

  return data;
}

/**
 * 현재 Step 업데이트
 */
export async function updateCurrentStep(
  userId: string,
  sequenceId: string,
  currentStep: number
): Promise<Sequence> {
  return updateSequence(userId, sequenceId, { current_step: currentStep });
}
