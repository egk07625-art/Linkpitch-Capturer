/**
 * @file prospects.ts
 * @description Prospect 관련 Server Actions
 *
 * Prospect 생성, 조회, 업데이트를 위한 Server Actions
 * PRD.md의 prospects 테이블과 연동
 */

"use server";

import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { auth } from "@clerk/nextjs/server";
import type {
  Prospect,
  CreateProspectInput,
  UpdateProspectInput,
} from "@/types/prospect";

/**
 * Clerk userId를 Supabase users 테이블의 UUID로 변환
 *
 * @param clerkId Clerk의 userId
 * @returns Supabase users 테이블의 UUID
 */
async function getSupabaseUserId(clerkId: string): Promise<string> {
  // Service Role 클라이언트 사용 (RLS 우회, 개발 단계에서 안정적)
  const supabase = getServiceRoleClient();

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_id", clerkId)
    .single();

  if (userError || !userData) {
    // 상세한 에러 정보 로깅
    console.error("User not found in Supabase:", {
      clerkId,
      error: userError,
      errorCode: userError?.code,
      errorMessage: userError?.message,
      errorDetails: userError?.details,
      errorHint: userError?.hint,
      hasData: !!userData,
    });

    // 사용자가 존재하지 않는 경우 더 명확한 에러 메시지
    if (userError?.code === "PGRST116") {
      throw new Error(
        "사용자 정보를 찾을 수 없습니다. 로그인을 다시 시도해주세요. (사용자가 Supabase에 동기화되지 않았을 수 있습니다.)",
      );
    }

    throw new Error(
      `사용자 정보를 찾을 수 없습니다. 로그인을 다시 시도해주세요. (에러 코드: ${userError?.code || "UNKNOWN"})`,
    );
  }

  return userData.id;
}

/**
 * Prospect 조회 옵션
 */
export interface GetProspectsOptions {
  status?: "hot" | "warm" | "cold";
  search?: string; // 회사명, URL, 담당자 검색
  sort?: "name" | "created_at" | "last_activity_at";
  limit?: number;
}

/**
 * 현재 사용자의 모든 Prospect 조회
 *
 * @param options 조회 옵션 (필터, 검색, 정렬, 제한)
 * @returns 현재 사용자의 Prospect 배열
 */
export async function getProspects(
  options?: GetProspectsOptions,
): Promise<Prospect[]> {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      console.error("getProspects: No Clerk user ID");
      throw new Error("Unauthorized: 사용자 인증이 필요합니다.");
    }

    console.log("getProspects: Fetching prospects for Clerk ID:", clerkId);
    const userUuid = await getSupabaseUserId(clerkId);
    console.log("getProspects: Supabase user UUID:", userUuid);
    
    // Service Role 클라이언트 사용 (RLS 우회)
    const supabase = getServiceRoleClient();

  let query = supabase
    .from("prospects")
    .select("*")
    .eq("user_id", userUuid);

  // 상태 필터
  if (options?.status) {
    query = query.eq("crm_status", options.status);
  }

  // 검색 기능 (회사명, URL, 담당자 이름/이메일)
  if (options?.search) {
    const searchTerm = options.search;
    query = query.or(
      `name.ilike.%${searchTerm}%,url.ilike.%${searchTerm}%,contact_name.ilike.%${searchTerm}%,contact_email.ilike.%${searchTerm}%`,
    );
  }

  // 정렬
  if (options?.sort === "name") {
    query = query.order("name", { ascending: true });
  } else if (options?.sort === "last_activity_at") {
    query = query.order("last_activity_at", {
      ascending: false,
      nullsFirst: false,
    });
  } else {
    // 기본값: created_at
    query = query.order("created_at", { ascending: false });
  }

  // 제한
  if (options?.limit) {
    query = query.limit(options.limit);
  }

    const { data, error } = await query;

    if (error) {
      console.error("Prospect 조회 실패:", {
        error,
        errorCode: error.code,
        errorMessage: error.message,
        errorDetails: error.details,
        errorHint: error.hint,
        userUuid,
        options,
      });
      throw new Error(`Prospect 조회 실패: ${error.message}`);
    }

    console.log("getProspects: Successfully fetched", data?.length || 0, "prospects");
    return (data || []) as Prospect[];
  } catch (error) {
    console.error("getProspects: Unexpected error:", {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      options,
    });
    // 에러를 다시 throw하여 상위에서 처리할 수 있도록
    throw error;
  }
}

/**
 * 특정 Prospect 조회
 *
 * @param id Prospect ID
 * @returns Prospect 객체 또는 null
 */
export async function getProspectById(id: string): Promise<Prospect | null> {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    throw new Error("Unauthorized: 사용자 인증이 필요합니다.");
  }

  const userUuid = await getSupabaseUserId(clerkId);
  // Service Role 클라이언트 사용 (RLS 우회)
  const supabase = getServiceRoleClient();

  const { data, error } = await supabase
    .from("prospects")
    .select("*")
    .eq("id", id)
    .eq("user_id", userUuid)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // 레코드를 찾을 수 없음
      return null;
    }
    console.error("Prospect 조회 실패:", {
      error,
      errorCode: error.code,
      errorMessage: error.message,
      errorDetails: error.details,
      errorHint: error.hint,
      prospectId: id,
      userUuid,
    });
    throw new Error(`Prospect 조회 실패: ${error.message}`);
  }

  return data as Prospect;
}

/**
 * 새로운 Prospect 생성
 *
 * @param input Prospect 생성 데이터
 * @returns 생성된 Prospect 객체
 */
export async function createProspect(
  input: CreateProspectInput,
): Promise<Prospect> {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    throw new Error("Unauthorized: 사용자 인증이 필요합니다.");
  }

  const userUuid = await getSupabaseUserId(clerkId);
  // Service Role 클라이언트 사용 (RLS 우회)
  const supabase = getServiceRoleClient();

  const { data, error } = await supabase
    .from("prospects")
    .insert({
      user_id: userUuid,
      name: input.name,
      contact_name: input.contact_name,
      contact_email: input.contact_email,
      url: input.url,
      memo: input.memo,
      crm_status: "cold",
      visit_count: 0,
    })
    .select()
    .single();

  if (error) {
    console.error("Prospect 생성 실패:", {
      error,
      errorCode: error.code,
      errorMessage: error.message,
      errorDetails: error.details,
      errorHint: error.hint,
      userUuid,
      input,
    });
    throw new Error(`Prospect 생성 실패: ${error.message}`);
  }

  if (!data) {
    throw new Error("Prospect 생성 실패: 데이터가 반환되지 않았습니다.");
  }

  return data as Prospect;
}

/**
 * Prospect 업데이트
 *
 * @param id Prospect ID
 * @param input 업데이트할 데이터
 * @returns 업데이트된 Prospect 객체
 */
export async function updateProspect(
  id: string,
  input: UpdateProspectInput,
): Promise<Prospect> {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    throw new Error("Unauthorized: 사용자 인증이 필요합니다.");
  }

  const userUuid = await getSupabaseUserId(clerkId);
  // Service Role 클라이언트 사용 (RLS 우회)
  const supabase = getServiceRoleClient();

  // Prospect가 현재 사용자의 것인지 확인
  const { data: existing, error: checkError } = await supabase
    .from("prospects")
    .select("id")
    .eq("id", id)
    .eq("user_id", userUuid)
    .single();

  if (checkError || !existing) {
    console.error("Prospect 소유권 확인 실패:", {
      error: checkError,
      errorCode: checkError?.code,
      errorMessage: checkError?.message,
      prospectId: id,
      userUuid,
      hasExisting: !!existing,
    });
    throw new Error(
      `Prospect 조회 실패: ${
        checkError?.message || "Prospect를 찾을 수 없습니다."
      }`,
    );
  }

  // 업데이트 데이터 준비
  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) updateData.name = input.name;
  if (input.contact_name !== undefined)
    updateData.contact_name = input.contact_name;
  if (input.contact_email !== undefined)
    updateData.contact_email = input.contact_email;
  if (input.url !== undefined) updateData.url = input.url;
  if (input.memo !== undefined) updateData.memo = input.memo;
  if (input.vision_data !== undefined)
    updateData.vision_data = input.vision_data;
  if (input.crm_status !== undefined) updateData.crm_status = input.crm_status;
  if (input.visit_count !== undefined)
    updateData.visit_count = input.visit_count;
  if (input.last_activity_at !== undefined)
    updateData.last_activity_at = input.last_activity_at;

  const { data, error } = await supabase
    .from("prospects")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", userUuid)
    .select()
    .single();

  if (error) {
    console.error("Prospect 업데이트 실패:", {
      error,
      errorCode: error.code,
      errorMessage: error.message,
      errorDetails: error.details,
      errorHint: error.hint,
      prospectId: id,
      userUuid,
      updateData,
    });
    throw new Error(`Prospect 업데이트 실패: ${error.message}`);
  }

  if (!data) {
    throw new Error("Prospect 업데이트 실패: 데이터가 반환되지 않았습니다.");
  }

  return data as Prospect;
}

/**
 * Prospect 삭제
 *
 * @param id Prospect ID
 */
export async function deleteProspect(id: string): Promise<void> {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    throw new Error("Unauthorized: 사용자 인증이 필요합니다.");
  }

  const userUuid = await getSupabaseUserId(clerkId);
  // Service Role 클라이언트 사용 (RLS 우회)
  const supabase = getServiceRoleClient();

  // Prospect가 현재 사용자의 것인지 확인
  const { data: existing, error: checkError } = await supabase
    .from("prospects")
    .select("id")
    .eq("id", id)
    .eq("user_id", userUuid)
    .single();

  if (checkError || !existing) {
    console.error("Prospect 소유권 확인 실패:", {
      error: checkError,
      errorCode: checkError?.code,
      errorMessage: checkError?.message,
      prospectId: id,
      userUuid,
      hasExisting: !!existing,
    });
    throw new Error(
      `Prospect 조회 실패: ${
        checkError?.message || "Prospect를 찾을 수 없습니다."
      }`,
    );
  }

  const { error } = await supabase
    .from("prospects")
    .delete()
    .eq("id", id)
    .eq("user_id", userUuid);

  if (error) {
    console.error("Prospect 삭제 실패:", {
      error,
      errorCode: error.code,
      errorMessage: error.message,
      errorDetails: error.details,
      errorHint: error.hint,
      prospectId: id,
      userUuid,
    });
    throw new Error(`Prospect 삭제 실패: ${error.message}`);
  }
}
