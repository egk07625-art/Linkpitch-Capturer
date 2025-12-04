/**
 * @file app/prospects/page.tsx
 * @description 고객사 목록 페이지 - 마스터-디테일 레이아웃
 *
 * 좌측: 고객사 리스트 (검색/필터 포함)
 * 우측: 선택된 고객사 상세 정보 및 이메일 히스토리
 */

import { getProspects, type GetProspectsOptions } from "@/app/actions/prospects";
import ClientDashboard from "@/components/clients/client-dashboard";
import type { Prospect } from "@/types/prospect";

interface ProspectsPageProps {
  searchParams: Promise<{
    status?: string;
    search?: string;
    sort?: string;
  }>;
}

export default async function ProspectsPage({
  searchParams,
}: ProspectsPageProps) {
  const params = await searchParams;
  let prospects: Prospect[] = [];
  let errorMessage: string | null = null;

  const options: GetProspectsOptions = {};
  if (params.status && ["hot", "warm", "cold"].includes(params.status)) {
    options.status = params.status as "hot" | "warm" | "cold";
  }
  if (params.search) {
    options.search = params.search;
  }
  if (params.sort && ["name", "created_at", "last_activity_at"].includes(params.sort)) {
    options.sort = params.sort as "name" | "created_at" | "last_activity_at";
  }

  try {
    prospects = await getProspects(options);
  } catch (error) {
    console.error("Failed to fetch prospects:", {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      options,
    });

    // 에러 메시지 설정
    if (error instanceof Error) {
      // 사용자 친화적인 에러 메시지
      if (error.message.includes("사용자 정보를 찾을 수 없습니다")) {
        errorMessage = "로그인이 필요합니다. 다시 로그인해주세요.";
      } else if (error.message.includes("Unauthorized")) {
        errorMessage = "인증이 필요합니다. 다시 로그인해주세요.";
      } else {
        errorMessage = error.message;
      }
    } else {
      errorMessage = "고객사 목록을 불러오는 중 오류가 발생했습니다.";
    }
    
    // 에러가 발생해도 빈 배열로 설정하여 UI가 깨지지 않도록
    prospects = [];
  }

  // URL에서 선택된 고객사 ID 추출 (필요시)
  const selectedId = params.id || undefined;

  return (
    <div className="h-screen -m-6">
      {/* Error Message */}
      {errorMessage && (
        <div className="fixed top-4 right-4 z-50 rounded-xl border border-red-500/20 bg-red-500/10 p-4 max-w-md">
          <p className="text-sm text-red-400">{errorMessage}</p>
          <p className="mt-1 text-xs text-red-400/70">
            페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
          </p>
        </div>
      )}

      <ClientDashboard 
        initialClients={prospects}
        selectedClientId={selectedId}
      />
    </div>
  );
}
