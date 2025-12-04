/**
 * @file app/app/page.tsx
 * @description 대시보드 페이지 - Temperature 로직 및 데이터 바인딩
 */

import {
  getDashboardKPIs,
  getCRMPipelineStats,
  getRecentActivity,
} from "@/actions/dashboard";
import { getProspectsCampaignStats } from "@/actions/prospects";
import { getProspects } from "@/app/actions/prospects";
import { DashboardTemperature } from "@/components/dashboard/dashboard-temperature";

// Dynamic rendering 설정 (auth()가 headers()를 사용하므로)
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // 병렬로 데이터 조회
  const [kpiResult, prospectsResult, pipelineResult, activityResult] =
    await Promise.all([
      getDashboardKPIs(),
      getProspects(), // 모든 prospects 조회 (Temperature 계산용)
      getCRMPipelineStats(),
      getRecentActivity(10),
    ]);

  const kpis = kpiResult.data;
  const prospects = prospectsResult || [];
  const pipelineStats = pipelineResult.data;
  const activities = activityResult.data;

  // 캠페인 통계 데이터 조회 (N+1 문제 방지를 위해 일괄 조회)
  const prospectIds = prospects.map((p) => p.id);
  const campaignStatsResult = await getProspectsCampaignStats(prospectIds);
  const campaignStats = campaignStatsResult.data || {};

  return (
    <div className="h-full w-full bg-[#050505] text-zinc-100 font-sans overflow-hidden flex flex-col">
      {/* 메인 스크롤 영역 */}
      <div className="flex-1 w-full h-full overflow-y-auto">
        {/* 컨텐츠 래퍼: 최대 너비 1800px로 제한하여 가독성 확보 */}
        <div className="w-full max-w-[1800px] mx-auto px-6 py-10 md:px-10 md:py-12 flex flex-col gap-8">
          {/* Header 타이틀 영역 */}
          <header className="flex flex-col gap-2 px-1">
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              대시보드
            </h1>
            <p className="text-lg text-zinc-500">
              오늘의 세일즈 현황과 인사이트를 한눈에 확인하세요.
            </p>
          </header>

          <DashboardTemperature
            kpis={kpis}
            prospects={prospects}
            pipelineStats={pipelineStats}
            activities={activities}
            campaignStats={campaignStats}
          />
        </div>
      </div>
    </div>
  );
}
