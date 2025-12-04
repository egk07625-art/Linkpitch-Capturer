"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { ProspectsTable } from "@/components/dashboard/prospects-table";
import { DashboardKPISection } from "@/components/dashboard/dashboard-kpi-section";
import { CRMPipelineCard } from "@/components/dashboard/crm-pipeline-card";
import {
  ActivityTimelineCard,
  type ActivityItem,
} from "@/components/dashboard/activity-timeline-card";
import type { DashboardKPIs, CRMPipelineStats } from "@/actions/dashboard";
import type { Prospect, CampaignStats } from "@/types/prospect";

interface DashboardClientProps {
  kpis: DashboardKPIs | null;
  initialProspects: Prospect[];
  pipelineStats: CRMPipelineStats | null;
  activities: ActivityItem[] | null;
  campaignStats?: Record<string, CampaignStats>;
}

export function DashboardClient({
  kpis,
  initialProspects,
  pipelineStats,
  activities,
  campaignStats = {},
}: DashboardClientProps) {
  const [selectedFilter, setSelectedFilter] = useState<
    "hot" | "warm" | "all" | null
  >(null);

  // 필터링된 고객사 목록
  const filteredProspects =
    selectedFilter === "hot"
      ? initialProspects.filter((p) => p.crm_status === "hot")
      : selectedFilter === "warm"
        ? initialProspects.filter(
            (p) => p.crm_status === "warm" || p.crm_status === "hot",
          )
        : initialProspects;

  // 필터링된 prospect에 대한 캠페인 통계만 필터링
  const filteredCampaignStats: Record<string, CampaignStats> = {};
  filteredProspects.forEach((prospect) => {
    if (campaignStats[prospect.id]) {
      filteredCampaignStats[prospect.id] = campaignStats[prospect.id];
    }
  });

  return (
    <div className="flex flex-col gap-8">
      {/* Bento Grid System */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Level 1: 핵심 지표 4개 (각각 1칸) */}
        <DashboardKPISection
          kpis={kpis}
          selectedFilter={selectedFilter}
          onFilterChange={setSelectedFilter}
        />

        {/* Level 2: CRM 파이프라인 (2칸 차지) */}
        <CRMPipelineCard stats={pipelineStats} />

        {/* Level 2: 실시간 활동 로그 (2칸 차지) */}
        <ActivityTimelineCard activities={activities} />
      </div>

      {/* Level 3: 우선순위 리스트 (전체 너비) */}
      <div className="xl:col-span-4 bg-[#161618] border border-[#333] rounded-[2rem] overflow-hidden shadow-2xl flex flex-col">
        {/* 리스트 헤더 */}
        <div className="px-8 py-6 border-b border-[#2C2C2E] flex justify-between items-center bg-[#1C1C1E]/50">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white">Focus Accounts</h2>
            {(kpis?.hotLeads ?? 0) > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20">
                Action Required
              </span>
            )}
          </div>
          <button
            onClick={() => setSelectedFilter(selectedFilter === "hot" ? null : "hot")}
            className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
          >
            관리 페이지로 이동 <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Prospects Table */}
        <div className="flex-1 flex flex-col min-h-0">
          <ProspectsTable
            prospects={filteredProspects}
            filterStatus={selectedFilter || undefined}
            limit={selectedFilter ? undefined : 5}
            showViewAll={true}
            campaignStats={filteredCampaignStats}
          />
        </div>
      </div>
    </div>
  );
}

