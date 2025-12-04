/**
 * @file app/prospects/page.tsx
 * @description 고객사 목록 페이지 - 대시보드와 동일한 디자인으로 통일
 *
 * 대시보드와 완벽하게 동일한 "Family Look"을 적용한 통합 뷰
 */

import { getProspects, getProspectsCount, type GetProspectsOptions } from "@/app/actions/prospects";
import { getProspectsCampaignStats } from "@/actions/prospects";
import ClientsUnifiedView from "@/components/clients/clients-unified-view";
import type { Prospect } from "@/types/prospect";

interface ProspectsPageProps {
  searchParams: Promise<{
    status?: string;
    search?: string;
    sort?: string;
    id?: string;
    page?: string;
  }>;
}

export default async function ProspectsPage({
  searchParams,
}: ProspectsPageProps) {
  const params = await searchParams;
  let prospects: Prospect[] = [];
  let errorMessage: string | null = null;

  // 페이지네이션 설정
  const itemsPerPage = 20;
  const currentPage = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const offset = (currentPage - 1) * itemsPerPage;

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
  
  // 페이지네이션 옵션 추가
  options.limit = itemsPerPage;
  options.offset = offset;

  // 전체 개수 조회 (필터링/검색 조건 반영)
  let totalCount = 0;
  try {
    totalCount = await getProspectsCount({
      status: options.status,
      search: options.search,
    });
  } catch (error) {
    console.error("Failed to fetch prospects count:", {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    // 개수 조회 실패 시에도 계속 진행
    totalCount = 0;
  }

  // 페이지 범위 검증 및 조정
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
  const validPage = Math.max(1, Math.min(currentPage, totalPages));
  if (validPage !== currentPage) {
    // 유효하지 않은 페이지 번호인 경우 조정된 값으로 재계산
    options.offset = (validPage - 1) * itemsPerPage;
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

  // 캠페인 통계 데이터 조회 (대시보드와 동일한 방식)
  const prospectIds = prospects.map((p) => p.id);
  const campaignStatsResult = await getProspectsCampaignStats(prospectIds);
  const campaignStats = campaignStatsResult.data || {};

  // URL에서 선택된 고객사 ID 추출 (쿼리 파라미터)
  const selectedId = params.id || undefined;

  return (
    <div className="h-full w-full bg-[#050505] text-zinc-100 font-sans overflow-hidden flex flex-col">
      {/* Error Message */}
      {errorMessage && (
        <div className="fixed top-4 right-4 z-50 rounded-xl border border-red-500/20 bg-red-500/10 p-4 max-w-md">
          <p className="text-sm text-red-400">{errorMessage}</p>
          <p className="mt-1 text-xs text-red-400/70">
            페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
          </p>
        </div>
      )}

      {/* 메인 스크롤 영역 */}
      <div className="flex-1 w-full h-full overflow-y-auto">
        {/* 컨텐츠 래퍼: 최대 너비 1500px로 제한하여 리스트 뷰 최적 밀도 달성 */}
        <div className="w-full max-w-[1500px] mx-auto px-6 py-10 md:px-8 md:py-12 flex flex-col gap-6">
          {/* Header 타이틀 영역 */}
          <header className="flex flex-col gap-2 px-1">
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              Clients
            </h1>
            <p className="text-lg text-zinc-500">
              고객사를 관리하고 이메일 캠페인 성과를 추적하세요.
            </p>
          </header>

          {/* 통합 뷰 컴포넌트 */}
          <ClientsUnifiedView
            prospects={prospects}
            campaignStats={campaignStats}
            selectedClientId={selectedId}
            totalCount={totalCount}
            currentPage={validPage}
            itemsPerPage={itemsPerPage}
          />
        </div>
      </div>
    </div>
  );
}
