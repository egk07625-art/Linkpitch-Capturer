/**
 * @file route.ts
 * @description Supabase 데이터 추가 테스트 API
 *
 * 사용자가 입력한 데이터를 Supabase에 저장하고 결과를 반환합니다.
 *
 * @dependencies
 * - @supabase/supabase-js: Supabase 클라이언트
 * - lib/supabase/service-role: RLS 우회용 관리자 클라이언트
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

export async function POST(request: NextRequest) {
  console.group("➕ Supabase 데이터 추가 테스트 시작");

  const supabase = getServiceRoleClient();

  try {
    const body = await request.json();
    const { table, data } = body;

    console.log(`📝 테이블: ${table}, 데이터:`, data);

    if (!table || !data) {
      return NextResponse.json(
        { error: "table과 data가 필요합니다." },
        { status: 400 }
      );
    }

    // 테이블별 데이터 검증 및 삽입
    let insertedData;

    switch (table) {
      case "users": {
        const { clerk_id, email, name } = data;
        if (!clerk_id || !email) {
          return NextResponse.json(
            { error: "clerk_id와 email은 필수입니다." },
            { status: 400 }
          );
        }

        const { data: userData, error: userError } = await supabase
          .from("users")
          .insert({
            clerk_id: `test_${Date.now()}_${clerk_id}`,
            email: email,
            name: name || "테스트 사용자",
          })
          .select()
          .single();

        if (userError) {
          console.error("❌ users 삽입 실패:", userError);
          return NextResponse.json(
            { error: userError.message },
            { status: 500 }
          );
        }

        insertedData = userData;
        console.log("✅ users 삽입 성공:", userData?.id);
        break;
      }

      case "prospects": {
        const { user_id, name, contact_name, contact_email, url, memo } = data;
        if (!user_id || !name || !contact_email || !url) {
          return NextResponse.json(
            {
              error: "user_id, name, contact_email, url은 필수입니다.",
            },
            { status: 400 }
          );
        }

        // user_id가 실제로 존재하는지 확인
        const { data: userCheck } = await supabase
          .from("users")
          .select("id")
          .eq("id", user_id)
          .single();

        if (!userCheck) {
          return NextResponse.json(
            { error: "존재하지 않는 user_id입니다." },
            { status: 400 }
          );
        }

        const { data: prospectData, error: prospectError } = await supabase
          .from("prospects")
          .insert({
            user_id,
            name,
            contact_name: contact_name || null,
            contact_email,
            url,
            memo: memo || null,
            crm_status: "cold",
          })
          .select()
          .single();

        if (prospectError) {
          console.error("❌ prospects 삽입 실패:", prospectError);
          return NextResponse.json(
            { error: prospectError.message },
            { status: 500 }
          );
        }

        insertedData = prospectData;
        console.log("✅ prospects 삽입 성공:", prospectData?.id);
        break;
      }

      case "sequences": {
        const { user_id, prospect_id, name, custom_context } = data;
        if (!user_id || !prospect_id || !name) {
          return NextResponse.json(
            { error: "user_id, prospect_id, name은 필수입니다." },
            { status: 400 }
          );
        }

        // user_id와 prospect_id가 실제로 존재하는지 확인
        const { data: userCheck } = await supabase
          .from("users")
          .select("id")
          .eq("id", user_id)
          .single();

        const { data: prospectCheck } = await supabase
          .from("prospects")
          .select("id")
          .eq("id", prospect_id)
          .single();

        if (!userCheck || !prospectCheck) {
          return NextResponse.json(
            { error: "존재하지 않는 user_id 또는 prospect_id입니다." },
            { status: 400 }
          );
        }

        const { data: sequenceData, error: sequenceError } = await supabase
          .from("sequences")
          .insert({
            user_id,
            prospect_id,
            name,
            sequence_type: "9_steps",
            total_steps: 9,
            current_step: 0,
            status: "draft",
            custom_context: custom_context || null,
          })
          .select()
          .single();

        if (sequenceError) {
          console.error("❌ sequences 삽입 실패:", sequenceError);
          return NextResponse.json(
            { error: sequenceError.message },
            { status: 500 }
          );
        }

        insertedData = sequenceData;
        console.log("✅ sequences 삽입 성공:", sequenceData?.id);
        break;
      }

      default:
        return NextResponse.json(
          { error: `지원하지 않는 테이블: ${table}` },
          { status: 400 }
        );
    }

    console.groupEnd();

    return NextResponse.json(
      {
        success: true,
        table,
        data: insertedData,
        message: `${table} 테이블에 데이터가 성공적으로 추가되었습니다.`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ 데이터 추가 중 예외 발생:", error);
    console.groupEnd();

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "알 수 없는 에러",
      },
      { status: 500 }
    );
  }
}


