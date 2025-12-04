import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

// Node.js Runtime 명시 (Edge Runtime 아님)
export const runtime = "nodejs";

/**
 * Clerk 사용자를 Supabase users 테이블에 동기화하는 API
 *
 * 클라이언트에서 로그인 후 이 API를 호출하여 사용자 정보를 Supabase에 저장합니다.
 * 이미 존재하는 경우 업데이트하고, 없으면 새로 생성합니다.
 * 
 * 제약 조건 처리:
 * - clerk_id UNIQUE: clerk_id로 먼저 조회
 * - email UNIQUE: email로도 조회하여 충돌 확인
 */
export async function POST() {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Clerk에서 사용자 정보 가져오기
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);

    if (!clerkUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Supabase에 사용자 정보 동기화
    const supabase = getServiceRoleClient();

    // Clerk에서 이메일 추출 (필수 필드)
    const email = clerkUser.emailAddresses[0]?.emailAddress;
    
    if (!email) {
      return NextResponse.json(
        { error: "User email not found in Clerk" },
        { status: 400 }
      );
    }

    // 1. clerk_id로 기존 사용자 조회
    const { data: existingByClerkId } = await supabase
      .from("users")
      .select("*")
      .eq("clerk_id", clerkUser.id)
      .single();

    // 2. email로도 조회 (다른 clerk_id로 같은 email이 있는지 확인)
    const { data: existingByEmail } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    let data;
    let error;

    if (existingByClerkId) {
      // clerk_id가 일치하는 경우: 업데이트 (credits는 유지)
      const { data: updatedData, error: updateError } = await supabase
        .from("users")
        .update({
          email: email,
          name:
            clerkUser.fullName ||
            clerkUser.username ||
            email ||
            "Unknown",
          // credits는 기존 값 유지 (업데이트하지 않음)
        })
        .eq("clerk_id", clerkUser.id)
        .select()
        .single();
      
      data = updatedData;
      error = updateError;
    } else if (existingByEmail) {
      // email이 일치하지만 clerk_id가 다른 경우: clerk_id 업데이트
      // (같은 사용자가 다른 인증 방식으로 로그인한 경우)
      // credits는 기존 값 유지
      const { data: updatedData, error: updateError } = await supabase
        .from("users")
        .update({
          clerk_id: clerkUser.id,
          name:
            clerkUser.fullName ||
            clerkUser.username ||
            email ||
            "Unknown",
          // credits는 기존 값 유지
        })
        .eq("email", email)
        .select()
        .single();
      
      data = updatedData;
      error = updateError;
    } else {
      // 새 사용자 생성 (credits 기본값 3 적용)
      const { data: insertedData, error: insertError } = await supabase
        .from("users")
        .insert({
          clerk_id: clerkUser.id,
          email: email,
          name:
            clerkUser.fullName ||
            clerkUser.username ||
            email ||
            "Unknown",
          credits: 3, // 새 사용자는 기본 크레딧 3개 제공
        })
        .select()
        .single();
      
      data = insertedData;
      error = insertError;
    }

    if (error) {
      console.error("Supabase sync error:", {
        error,
        errorCode: error.code,
        errorMessage: error.message,
        errorDetails: error.details,
        errorHint: error.hint,
        clerkUserId: clerkUser.id,
        email,
      });
      return NextResponse.json(
        { error: "Failed to sync user", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: data,
    });
  } catch (error) {
    console.error("Sync user error:", {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
