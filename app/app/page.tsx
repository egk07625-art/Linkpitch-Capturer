/**
 * @file app/app/page.tsx
 * @description 대시보드 페이지 - 6-KPI Premium Layout with Real Data
 */

import { getDashboardKPIs } from "@/actions/dashboard";
import { getProspectsCampaignStats } from "@/actions/prospects";
import { getProspects } from "@/app/actions/prospects";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  // 병렬로 데이터 조회
  const [kpiResult, prospects] = await Promise.all([
    getDashboardKPIs(),
    getProspects({ limit: 10 }),
  ]);

  const kpis = kpiResult.data;

  // 캠페인 통계 데이터 조회 (N+1 문제 방지를 위해 일괄 조회)
  const prospectIds = prospects.map((p) => p.id);
  const campaignStatsResult = await getProspectsCampaignStats(prospectIds);
  const campaignStats = campaignStatsResult.data || {};

  return (
    <div className="h-full bg-[#050505] text-zinc-100 font-sans overflow-hidden flex flex-col">
      {/* Unified Card Container - 제목, KPI, 테이블을 하나의 카드로 */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="px-2 py-6 md:py-8">
          <div className="w-full max-w-[1400px] mx-auto rounded-2xl bg-[#0a0a0a] border border-white/10 overflow-hidden p-6 md:p-8 lg:p-10">
            {/* Page Title - 컨테이너 내부 최상단 */}
            <header className="flex flex-col gap-2 mb-8">
              <h1 className="text-4xl font-bold text-white tracking-tight">대시보드</h1>
              <p className="text-base text-zinc-500">
                오늘 보낼 메일과 KPI를 한 눈에 확인하세요.
              </p>
            </header>

            <DashboardClient
              kpis={kpis}
              initialProspects={prospects}
              campaignStats={campaignStats}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
