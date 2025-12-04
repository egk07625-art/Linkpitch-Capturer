"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, MoreHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Prospect, CRMStatus } from "@/types/prospect";

interface ProspectsTableProps {
  prospects: Prospect[];
  filterStatus?: "hot" | "warm" | "all";
  limit?: number;
  showViewAll?: boolean;
}

const statusConfig: Record<CRMStatus, { label: string; className: string }> = {
  hot: {
    label: "Hot",
    className: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  },
  warm: {
    label: "Warm",
    className: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
  cold: {
    label: "Cold",
    className: "bg-zinc-700 text-zinc-400 border-zinc-700",
  },
};

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

function formatLastActive(dateString: string | null | undefined): string {
  if (!dateString) return "-";
  try {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: ko,
    });
  } catch {
    return "-";
  }
}

export function ProspectsTable({
  prospects,
  filterStatus,
  limit,
  showViewAll = true,
}: ProspectsTableProps) {
  const router = useRouter();

  // 필터링 적용
  let filteredProspects = [...prospects];
  if (filterStatus === "hot") {
    filteredProspects = filteredProspects.filter((p) => p.crm_status === "hot");
  } else if (filterStatus === "warm") {
    filteredProspects = filteredProspects.filter(
      (p) => p.crm_status === "warm" || p.crm_status === "hot",
    );
  }

  // HOT 고객을 최상단에 정렬
  const sortedProspects = filteredProspects.sort((a, b) => {
    const statusOrder: Record<CRMStatus, number> = { hot: 0, warm: 1, cold: 2 };
    return statusOrder[a.crm_status] - statusOrder[b.crm_status];
  });

  // 제한 적용
  const displayedProspects = limit
    ? sortedProspects.slice(0, limit)
    : sortedProspects;

  if (displayedProspects.length === 0) {
    return (
      <section className="glass-panel gradient-border rounded-xl overflow-hidden">
        <div className="flex flex-col items-center justify-center gap-4 py-16 px-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 blur-3xl" />
            <div className="relative space-y-3 text-center">
              <p className="text-sm text-zinc-400">분석할 고객사가 없습니다</p>
              <Button asChild className="premium-button shadow-lg shadow-amber-500/20">
                <Link href="/app/create">분석 시작하기</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-white/[0.03] bg-zinc-900/30 backdrop-blur-md overflow-hidden">
      <div className="p-4 border-b border-zinc-800/50 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-50">
            {filterStatus === "hot"
              ? "당장 연락할 곳"
              : filterStatus === "warm"
                ? "우선순위 고객"
                : "우선순위 고객"}
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {displayedProspects.length}개의 고객사
            {filterStatus && ` (${filterStatus === "hot" ? "Hot" : "Hot/Warm"}만 표시)`}
          </p>
        </div>
        {showViewAll && (
          <Button asChild variant="outline" size="sm">
            <Link href="/prospects">모두 보기</Link>
          </Button>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-800/50 hover:bg-transparent">
            <TableHead className="text-xs text-zinc-500 font-medium">Company</TableHead>
            <TableHead className="text-xs text-zinc-500 font-medium">Status</TableHead>
            <TableHead className="text-xs text-zinc-500 font-medium">URL</TableHead>
            <TableHead className="text-xs text-zinc-500 font-medium">Last Active</TableHead>
            <TableHead className="text-xs text-zinc-500 font-medium w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayedProspects.map((prospect) => {
            const statusStyle = statusConfig[prospect.crm_status];
            const displayUrl = prospect.url || "-";
            const displayName = prospect.store_name || prospect.name;

            return (
              <TableRow
                key={prospect.id}
                className="border-zinc-800/50 hover:bg-zinc-800/30"
              >
                <TableCell
                  className="font-medium text-zinc-50 cursor-pointer"
                  onClick={() => {
                    router.push(`/prospects/${prospect.id}/mix`);
                  }}
                >
                  <Link
                    href={`/prospects/${prospect.id}/mix`}
                    className="flex items-center gap-3 hover:text-amber-400 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <div className="flex items-center justify-center size-8 rounded-full bg-zinc-800/80 text-zinc-300 text-sm font-semibold">
                      {getInitial(displayName)}
                    </div>
                    <div className="flex flex-col">
                      <span>{displayName}</span>
                      {prospect.category && (
                        <span className="text-xs text-zinc-500">{prospect.category}</span>
                      )}
                    </div>
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn("rounded-full", statusStyle.className)}
                  >
                    {statusStyle.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  {prospect.url ? (
                    <a
                      href={prospect.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-300 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span className="max-w-[200px] truncate">
                        {displayUrl}
                      </span>
                    </a>
                  ) : (
                    <span className="text-zinc-500">-</span>
                  )}
                </TableCell>
                <TableCell className="text-zinc-400 text-sm">
                  {formatLastActive(prospect.last_activity_at)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // TODO: 드롭다운 메뉴 구현
                    }}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </section>
  );
}
