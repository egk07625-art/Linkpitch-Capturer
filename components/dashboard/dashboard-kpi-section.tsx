"use client";

import { Users, Send, BarChart3, Flame } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import type { DashboardKPIs } from "@/actions/dashboard";

interface DashboardKPISectionProps {
  kpis: DashboardKPIs | null;
  selectedFilter: "hot" | "warm" | "all" | null;
  onFilterChange: (filter: "hot" | "warm" | "all" | null) => void;
}

export function DashboardKPISection({
  kpis,
  selectedFilter,
  onFilterChange,
}: DashboardKPISectionProps) {
  // 이번 주 발송 수 계산 (현재는 전체 발송 수 사용, 추후 주간 필터링 추가 가능)
  const weeklySent = kpis?.sentEmails ?? 0;
  const successRate = weeklySent > 0 ? Math.round((weeklySent / weeklySent) * 100) : 0;

  return (
    <>
      <StatCard
        title="총 고객사"
        value={kpis?.totalProspects ?? 0}
        trend="+3 this week"
        icon={Users}
        color="blue"
      />
      <StatCard
        title="이번 주 발송"
        value={weeklySent}
        trend={`${successRate}% success`}
        icon={Send}
        color="indigo"
      />
      <StatCard
        title="평균 오픈율"
        value={`${kpis?.completionRate ?? 0}%`}
        trend="+2.4% vs avg"
        icon={BarChart3}
        color="emerald"
      />
      <StatCard
        title="Hot 리드"
        value={kpis?.hotLeads ?? 0}
        trend="Action needed"
        icon={Flame}
        color="rose"
        isHighlighted
        onClick={() => onFilterChange(selectedFilter === "hot" ? null : "hot")}
      />
    </>
  );
}

