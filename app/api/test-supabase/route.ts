/**
 * @file route.ts
 * @description Supabase 데이터베이스 연동 테스트 API
 *
 * 이 API는 Supabase와의 연동이 정상적으로 작동하는지 테스트합니다.
 * - 테이블 조회 테스트
 * - 데이터 삽입 테스트
 * - 데이터 조회 테스트
 *
 * @dependencies
 * - @supabase/supabase-js: Supabase 클라이언트
 * - lib/supabase/service-role: RLS 우회용 관리자 클라이언트
 */

import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";

export async function GET() {
  console.group("🔍 Supabase 연동 테스트 시작");

  const supabase = getServiceRoleClient();
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    tests: {},
    errors: [],
  };

  try {
    // 1. plans 테이블 조회 (초기 데이터 확인)
    console.log("📋 테스트 1: plans 테이블 조회");
    const { data: plans, error: plansError } = await supabase
      .from("plans")
      .select("*")
      .order("price_krw", { ascending: true });

    if (plansError) {
      console.error("❌ plans 조회 실패:", plansError);
      results.errors.push({ test: "plans_select", error: plansError.message });
    } else {
      console.log("✅ plans 조회 성공:", plans?.length, "개");
      results.tests.plans = {
        success: true,
        count: plans?.length || 0,
        data: plans,
      };
    }

    // 2. step_templates 테이블 조회 (초기 데이터 확인)
    console.log("📋 테스트 2: step_templates 테이블 조회");
    const { data: templates, error: templatesError } = await supabase
      .from("step_templates")
      .select("*")
      .order("step_number", { ascending: true });

    if (templatesError) {
      console.error("❌ step_templates 조회 실패:", templatesError);
      results.errors.push({
        test: "step_templates_select",
        error: templatesError.message,
      });
    } else {
      console.log("✅ step_templates 조회 성공:", templates?.length, "개");
      results.tests.step_templates = {
        success: true,
        count: templates?.length || 0,
        data: templates?.map((t) => ({
          step_number: t.step_number,
          step_name: t.step_name,
        })),
      };
    }

    // 3. users 테이블 조회
    console.log("📋 테스트 3: users 테이블 조회");
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("*")
      .limit(10);

    if (usersError) {
      console.error("❌ users 조회 실패:", usersError);
      results.errors.push({ test: "users_select", error: usersError.message });
    } else {
      console.log("✅ users 조회 성공:", users?.length || 0, "개");
      results.tests.users = {
        success: true,
        count: users?.length || 0,
        data: users,
      };
    }

    // 4. 테스트용 user 데이터 삽입
    console.log("📋 테스트 4: users 테이블 삽입");
    const testUser = {
      clerk_id: `test_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      name: "테스트 사용자",
    };

    const { data: insertedUser, error: insertError } = await supabase
      .from("users")
      .insert(testUser)
      .select()
      .single();

    if (insertError) {
      console.error("❌ users 삽입 실패:", insertError);
      results.errors.push({
        test: "users_insert",
        error: insertError.message,
      });
    } else {
      console.log("✅ users 삽입 성공:", insertedUser?.id);
      results.tests.users_insert = {
        success: true,
        data: insertedUser,
      };

      // 5. 삽입한 데이터 조회 확인
      console.log("📋 테스트 5: 삽입한 user 조회");
      const { data: fetchedUser, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("id", insertedUser.id)
        .single();

      if (fetchError) {
        console.error("❌ user 조회 실패:", fetchError);
        results.errors.push({
          test: "users_fetch",
          error: fetchError.message,
        });
      } else {
        console.log("✅ user 조회 성공:", fetchedUser?.id);
        results.tests.users_fetch = {
          success: true,
          data: fetchedUser,
        };
      }

      // 6. 테스트용 prospect 데이터 삽입
      console.log("📋 테스트 6: prospects 테이블 삽입");
      const testProspect = {
        user_id: insertedUser.id,
        name: "테스트 고객사",
        contact_name: "홍길동",
        contact_email: "test@prospect.com",
        url: "https://example.com",
        memo: "테스트용 고객사입니다",
        crm_status: "cold",
      };

      const { data: insertedProspect, error: prospectError } = await supabase
        .from("prospects")
        .insert(testProspect)
        .select()
        .single();

      if (prospectError) {
        console.error("❌ prospects 삽입 실패:", prospectError);
        results.errors.push({
          test: "prospects_insert",
          error: prospectError.message,
        });
      } else {
        console.log("✅ prospects 삽입 성공:", insertedProspect?.id);
        results.tests.prospects_insert = {
          success: true,
          data: insertedProspect,
        };
      }

      // 7. 테스트용 sequence 데이터 삽입
      console.log("📋 테스트 7: sequences 테이블 삽입");
      const testSequence = {
        user_id: insertedUser.id,
        prospect_id: insertedProspect?.id,
        name: "테스트 시퀀스",
        sequence_type: "9_steps",
        total_steps: 9,
        current_step: 0,
        status: "draft",
      };

      const { data: insertedSequence, error: sequenceError } = await supabase
        .from("sequences")
        .insert(testSequence)
        .select()
        .single();

      if (sequenceError) {
        console.error("❌ sequences 삽입 실패:", sequenceError);
        results.errors.push({
          test: "sequences_insert",
          error: sequenceError.message,
        });
      } else {
        console.log("✅ sequences 삽입 성공:", insertedSequence?.id);
        results.tests.sequences_insert = {
          success: true,
          data: insertedSequence,
        };
      }

      // 8. 테스트 데이터 정리 (선택사항)
      console.log("📋 테스트 8: 테스트 데이터 정리");
      if (insertedSequence?.id) {
        await supabase.from("sequences").delete().eq("id", insertedSequence.id);
      }
      if (insertedProspect?.id) {
        await supabase.from("prospects").delete().eq("id", insertedProspect.id);
      }
      if (insertedUser?.id) {
        await supabase.from("users").delete().eq("id", insertedUser.id);
      }
      console.log("✅ 테스트 데이터 정리 완료");
    }

    // 최종 결과 요약
    const successCount = Object.keys(results.tests).filter(
      (key) => results.tests[key].success
    ).length;
    const totalTests = Object.keys(results.tests).length;

    console.log(
      `\n📊 테스트 결과: ${successCount}/${totalTests} 성공, ${results.errors.length} 실패`
    );
    console.groupEnd();

    return NextResponse.json(
      {
        ...results,
        summary: {
          total_tests: totalTests,
          passed: successCount,
          failed: results.errors.length,
          success_rate: `${Math.round((successCount / totalTests) * 100)}%`,
        },
      },
      { status: results.errors.length === 0 ? 200 : 207 } // 207 = Multi-Status
    );
  } catch (error) {
    console.error("❌ 테스트 중 예외 발생:", error);
    console.groupEnd();

    return NextResponse.json(
      {
        ...results,
        errors: [
          ...results.errors,
          {
            test: "exception",
            error: error instanceof Error ? error.message : String(error),
          },
        ],
      },
      { status: 500 }
    );
  }
}

