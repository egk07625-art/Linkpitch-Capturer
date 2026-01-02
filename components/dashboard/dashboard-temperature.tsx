'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import type { Prospect, CampaignStats } from '@/types/prospect';
import type { DashboardKPIs, CRMPipelineStats } from '@/actions/dashboard';
import type { ActivityItem } from './activity-timeline-card';
import { ActivityTimelineCard } from './activity-timeline-card';
import { ProspectsTable } from './prospects-table';
import { StatCard } from './stat-card';

interface DashboardTemperatureProps {
  kpis: DashboardKPIs | null;
  prospects: Prospect[];
  pipelineStats: CRMPipelineStats | null;
  activities: ActivityItem[] | null;
  campaignStats: Record<string, CampaignStats>;
}

export function DashboardTemperature({
  kpis,
  prospects,
  pipelineStats: _pipelineStats,
  activities,
  campaignStats,
}: DashboardTemperatureProps) {
  // 에러 처리: 기본값 설정
  const safeProspects = prospects || [];
  const safeKpis = kpis || {
    totalProspects: 0,
    sentEmails: 0,
    completionRate: 0,
    avgDurationSeconds: 0,
    conversionRate: 0,
    hotLeads: 0,
  };
  const safeActivities = activities || [];
  const safeCampaignStats = campaignStats || {};

  // Temperature 계산 로직 (0으로 나누기 방지)
  const total = safeProspects.length;
  const coldCount = safeProspects.filter((p) => p.crm_status === 'cold').length;
  const warmCount = safeProspects.filter((p) => p.crm_status === 'warm').length;
  const hotCount = safeProspects.filter((p) => p.crm_status === 'hot').length;

  const coldPercent = total > 0 ? (coldCount / total) * 100 : 0;
  const warmPercent = total > 0 ? (warmCount / total) * 100 : 0;
  const hotPercent = total > 0 ? (hotCount / total) * 100 : 0;

  // Focus Accounts 필터링: Cold 상태 제외, Warm/Hot만 표시
  // 또는 다음 일정이 있는 경우도 포함 (집중 관리 대상)
  const focusAccounts = safeProspects.filter((prospect) => {
    // Warm 또는 Hot 상태인 경우
    if (prospect.crm_status === 'warm' || prospect.crm_status === 'hot') {
      return true;
    }
    
    // Cold 상태이지만 다음 일정이 있는 경우도 포함
    const stats = safeCampaignStats[prospect.id];
    if (stats && stats.nextScheduleDate !== null) {
      return true;
    }
    
    // 그 외 Cold 상태는 제외
    return false;
  });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
      {/* KPI 카드들 */}
      <StatCard
        title="총 고객사"
        value={safeKpis.totalProspects}
        trend="+3 this week"
        icon="Users"
        color="blue"
      />
      <StatCard
        title="이번 주 발송"
        value={safeKpis.sentEmails}
        trend="0% success"
        icon="Send"
        color="indigo"
      />
      <StatCard
        title="평균 오픈율"
        value={`${safeKpis.completionRate}%`}
        trend="+2.4% vs avg"
        icon="BarChart3"
        color="emerald"
      />
      <StatCard
        title="Hot 리드"
        value={hotCount}
        trend="Action needed"
        icon="Flame"
        color="rose"
        isHighlighted={hotCount > 0}
      />

      {/* Customer Temperature */}
      <div className="xl:col-span-2 bg-[#161618] border border-[#333] rounded-[2rem] p-8 flex flex-col justify-between shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-6 relative z-10">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            Customer Temperature
          </h3>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
            Live
          </span>
        </div>

        <div className="space-y-8 relative z-10">
          {/* 동적 그래프 바 */}
          <div className="flex h-14 w-full rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800">
            {/* Cold Segment (파랑) */}
            {coldPercent > 0 && (
              <div
                className="h-full bg-zinc-500/20 border-r border-black/10 flex items-center justify-center relative group transition-all duration-500"
                style={{ width: `${coldPercent}%` }}
              >
                {coldPercent > 5 && (
                  <span className="text-xs font-bold text-zinc-400">
                    Cold ({Math.round(coldPercent)}%)
                  </span>
                )}
                <div className="absolute inset-0 bg-zinc-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            )}
            {/* Warm Segment (노랑) */}
            {warmPercent > 0 && (
              <div
                className="h-full bg-amber-500/20 border-r border-black/10 flex items-center justify-center relative group transition-all duration-500"
                style={{ width: `${warmPercent}%` }}
              >
                {warmPercent > 5 && (
                  <span className="text-xs font-bold text-amber-400">
                    Warm ({Math.round(warmPercent)}%)
                  </span>
                )}
                <div className="absolute inset-0 bg-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            )}
            {/* Hot Segment (빨강) */}
            {hotPercent > 0 && (
              <div
                className="h-full bg-rose-500/20 flex items-center justify-center relative group transition-all duration-500"
                style={{ width: `${hotPercent}%` }}
              >
                {hotPercent > 5 && (
                  <span className="text-xs font-bold text-rose-400">
                    Hot ({Math.round(hotPercent)}%)
                  </span>
                )}
                <div className="absolute inset-0 bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            )}
          </div>

          {/* 하단 수치 (Legend 이름 변경: COLD / WARM / HOT) */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{coldCount}</p>
              <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest mt-2">
                COLD
              </p>
            </div>
            <div className="text-center border-l border-zinc-800">
              <p className="text-3xl font-bold text-white">{warmCount}</p>
              <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest mt-2">
                WARM
              </p>
            </div>
            <div className="text-center border-l border-zinc-800">
              <p className="text-3xl font-bold text-white">{hotCount}</p>
              <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest mt-2">
                HOT
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Feed */}
      {safeActivities.length === 0 ? (
        <div className="xl:col-span-2 bg-[#161618] border border-[#333] rounded-[2rem] p-8 shadow-xl relative overflow-hidden flex flex-col justify-center min-h-[160px]">
          <div className="flex flex-col items-center justify-center text-zinc-600 gap-2">
            <Clock className="w-8 h-8 opacity-20" />
            <span className="text-sm font-medium">최근 활동이 없습니다</span>
          </div>
        </div>
      ) : (
        <ActivityTimelineCard activities={safeActivities} />
      )}

      {/* Focus Accounts */}
      <div className="xl:col-span-4 bg-[#161618] border border-[#333] rounded-[2rem] overflow-hidden shadow-2xl flex flex-col mt-4">
        {/* 리스트 헤더 */}
        <div className="px-8 py-6 border-b border-[#2C2C2E] flex justify-between items-center bg-[#1C1C1E]/50">
          <h2 className="text-lg font-bold text-white">Focus Accounts</h2>
          <Link
            href="/prospects"
            className="text-sm font-medium text-zinc-400 hover:text-zinc-300 transition-colors flex items-center gap-1 group"
          >
            전체 리스트 보기
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Prospects Table */}
        <ProspectsTable
          prospects={focusAccounts}
          campaignStats={safeCampaignStats}
          limit={10}
          emptyMessage="현재 집중 관리할 고객이 없습니다. 신규 고객을 발굴해보세요!"
          emptyActionLabel="고객사 추가하기"
          emptyActionHref="/prospects/new"
        />
      </div>
    </div>
  );
}

