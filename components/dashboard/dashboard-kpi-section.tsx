"use client";

import { useState } from "react";
import { Users, Send, Activity, Timer, PieChart, Flame } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { DashboardKPIs } from "@/actions/dashboard";

interface KPICardProps {
  title: string;
  description: string;
  value: string | number;
  valueComponent?: React.ReactNode;
  icon: React.ElementType;
  theme: "indigo" | "sky" | "teal" | "amber" | "violet" | "rose";
  pulse?: boolean;
  onClick?: () => void;
  isSelected?: boolean;
}

const themeStyles = {
  indigo: "shadow-indigo-500/5 hover:shadow-indigo-500/10",
  sky: "shadow-sky-500/5 hover:shadow-sky-500/10",
  teal: "shadow-teal-500/5 hover:shadow-teal-500/10",
  amber: "shadow-amber-500/5 hover:shadow-amber-500/10",
  violet: "shadow-violet-500/5 hover:shadow-violet-500/10",
  rose: "shadow-rose-500/5 hover:shadow-rose-500/10",
};

function KPICard({
  title,
  description,
  value,
  valueComponent,
  icon: Icon,
  theme,
  pulse,
  onClick,
  isSelected,
}: KPICardProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          onClick={onClick}
          className={cn(
            "relative overflow-hidden rounded-lg p-4 transition-all duration-300",
            "glass-panel gradient-border",
            "hover:-translate-y-1 hover:bg-white/[0.05] hover:shadow-2xl",
            themeStyles[theme],
            onClick && "cursor-pointer",
            isSelected && "gold-glow ring-1 ring-amber-500/50 bg-white/[0.08]",
          )}
        >
          <div className="flex items-start justify-between mb-3">
            <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">
              {title}
            </p>
            <Icon className={cn("size-4 text-zinc-600", pulse && "animate-pulse")} />
          </div>

          <div className="flex items-baseline">
            {valueComponent || (
              <span className="text-2xl xl:text-3xl font-bold tracking-tight text-zinc-50">
                {value}
              </span>
            )}
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        sideOffset={10}
        className="bg-zinc-800 text-zinc-300 text-xs px-3 py-2 rounded-md shadow-xl border border-white/5 max-w-[180px] break-keep text-center"
      >
        {description}
      </TooltipContent>
    </Tooltip>
  );
}

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
  const kpiCards: KPICardProps[] = [
    {
      title: "총 고객사",
      description: "등록된 모든 잠재 고객사의 수입니다.",
      value: kpis?.totalProspects ?? 0,
      icon: Users,
      theme: "amber",
    },
    {
      title: "발송 완료",
      description: "생성 후 실제로 발송된 메일의 총합입니다.",
      value: kpis?.sentEmails ?? 0,
      icon: Send,
      theme: "sky",
    },
    {
      title: "리포트 완독률",
      description: "리포트의 80% 지점까지 스크롤한 고객의 비율입니다.",
      value: `${kpis?.completionRate ?? 0}%`,
      icon: Activity,
      theme: "teal",
    },
    {
      title: "평균 열람 시간",
      description: "고객이 리포트 페이지에 머무른 평균 시간입니다.",
      value: "",
      valueComponent: (
        <div className="flex items-baseline gap-0.5">
          <span className="text-2xl xl:text-3xl font-bold text-zinc-50">
            {Math.floor((kpis?.avgDurationSeconds ?? 0) / 60)}
          </span>
          <span className="text-xs font-medium text-zinc-500 mr-1">m</span>
          <span className="text-2xl xl:text-3xl font-bold text-zinc-50">
            {(kpis?.avgDurationSeconds ?? 0) % 60}
          </span>
          <span className="text-xs font-medium text-zinc-500">s</span>
        </div>
      ),
      icon: Timer,
      theme: "amber",
    },
    {
      title: "리드 전환율",
      description: "전체 고객 중 긍정적 반응(Warm/Hot)으로 전환된 비율입니다.",
      value: `${kpis?.conversionRate ?? 0}%`,
      icon: PieChart,
      theme: "violet",
    },
    {
      title: "당장 연락할 곳",
      description: "CRM 상태가 'Hot'인 최우선 대응 고객입니다. 클릭하여 확인하세요.",
      value: kpis?.hotLeads ?? 0,
      icon: Flame,
      theme: "rose",
      pulse: (kpis?.hotLeads ?? 0) > 0,
      onClick: () => onFilterChange(selectedFilter === "hot" ? null : "hot"),
      isSelected: selectedFilter === "hot",
    },
  ];

  return (
    <TooltipProvider delayDuration={200}>
      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((card, index) => (
          <KPICard key={index} {...card} />
        ))}
      </section>
    </TooltipProvider>
  );
}

