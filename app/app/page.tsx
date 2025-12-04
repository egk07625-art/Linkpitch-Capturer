/**
 * @file app/app/page.tsx
 * @description 대시보드 페이지 - 6-KPI Premium Layout with Real Data
 */

import { Users, Send, Activity, Timer, PieChart, Flame } from "lucide-react";
import { ProspectsTable } from "@/components/dashboard/prospects-table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, formatDuration } from "@/lib/utils";
import { getDashboardKPIs } from "@/actions/dashboard";
import { getProspects } from "@/actions/prospects";

interface KPICardProps {
  title: string;
  description: string;
  value: string | number;
  valueComponent?: React.ReactNode;
  icon: React.ElementType;
  theme: "indigo" | "sky" | "teal" | "amber" | "violet" | "rose";
  pulse?: boolean;
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
}: KPICardProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "relative overflow-hidden rounded-lg border border-white/[0.03] bg-zinc-900/30 backdrop-blur-md p-4 shadow-lg transition-all duration-300",
            "hover:-translate-y-1 hover:bg-zinc-900/60 hover:shadow-xl",
            themeStyles[theme]
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

function DurationDisplay({ seconds }: { seconds: number }) {
  const { minutes, seconds: secs } = formatDuration(seconds);
  return (
    <div className="flex items-baseline gap-0.5">
      <span className="text-2xl xl:text-3xl font-bold text-zinc-50">{minutes}</span>
      <span className="text-xs font-medium text-zinc-500 mr-1">m</span>
      <span className="text-2xl xl:text-3xl font-bold text-zinc-50">{secs}</span>
      <span className="text-xs font-medium text-zinc-500">s</span>
    </div>
  );
}

export default async function DashboardPage() {
  // 병렬로 데이터 조회
  const [kpiResult, prospectsResult] = await Promise.all([
    getDashboardKPIs(),
    getProspects(),
  ]);

  const kpis = kpiResult.data;
  const prospects = prospectsResult.data || [];

  // KPI 카드 데이터 구성
  const kpiCards: KPICardProps[] = [
    {
      title: "총 고객사",
      description: "등록된 모든 잠재 고객사의 수입니다.",
      value: kpis?.totalProspects ?? 0,
      icon: Users,
      theme: "indigo",
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
      valueComponent: <DurationDisplay seconds={kpis?.avgDurationSeconds ?? 0} />,
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
      description: "CRM 상태가 'Hot'인 최우선 대응 고객입니다.",
      value: kpis?.hotLeads ?? 0,
      icon: Flame,
      theme: "rose",
      pulse: (kpis?.hotLeads ?? 0) > 0,
    },
  ];

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-8">
        <header>
          <h1 className="text-3xl font-semibold text-zinc-50">대시보드</h1>
          <p className="mt-2 text-sm text-zinc-400">
            오늘 보낼 메일과 KPI를 한 눈에 확인하세요.
          </p>
        </header>

        <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {kpiCards.map((card, index) => (
            <KPICard key={index} {...card} />
          ))}
        </section>

        <ProspectsTable prospects={prospects} />
      </div>
    </TooltipProvider>
  );
}
