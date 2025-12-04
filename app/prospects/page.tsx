/**
 * @file app/prospects/page.tsx
 * @description 고객사 목록 페이지
 *
 * 등록된 모든 고객사를 표시하고, 클릭 시 이메일 편집 페이지로 이동
 */

import { getProspects } from "@/app/actions/prospects";
import { ProspectsList } from "@/components/prospects/prospects-list";
import type { Prospect } from "@/types/prospect";

export default async function ProspectsPage() {
  let prospects: Prospect[] = [];
  let errorMessage: string | null = null;
  
  try {
    prospects = await getProspects();
  } catch (error) {
    console.error("Failed to fetch prospects:", {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // 사용자에게 표시할 에러 메시지 설정
    if (error instanceof Error) {
      errorMessage = error.message;
    } else {
      errorMessage = "고객사 목록을 불러오는 중 오류가 발생했습니다.";
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold text-zinc-50">고객사 관리</h1>
        <p className="mt-2 text-sm text-zinc-400">
          등록된 고객사를 관리하고 이메일을 편집하세요.
        </p>
      </header>
      
      {errorMessage && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">{errorMessage}</p>
          <p className="mt-2 text-xs text-red-400/70">
            페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
          </p>
        </div>
      )}
      
      <ProspectsList prospects={prospects} />
    </div>
  );
}

