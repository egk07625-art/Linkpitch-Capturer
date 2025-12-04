"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Plus } from "lucide-react";
import { ProspectActionsMenu } from "./prospect-actions-menu";

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
import type { Prospect } from "@/types/prospect";

const statusConfig = {
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

function formatDate(dateString?: string): string {
  if (!dateString) return "방문 없음";
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins}분 전`;
  } else if (diffHours < 24) {
    return `${diffHours}시간 전`;
  } else if (diffDays < 7) {
    return `${diffDays}일 전`;
  } else {
    return date.toLocaleDateString("ko-KR");
  }
}

interface ProspectsListProps {
  prospects: Prospect[];
}

export function ProspectsList({ prospects }: ProspectsListProps) {
  const router = useRouter();

  if (prospects.length === 0) {
    return (
      <section className="rounded-lg border border-white/[0.03] bg-zinc-900/30 backdrop-blur-md overflow-hidden">
        <div className="flex flex-col items-center justify-center gap-4 py-16 px-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-amber-600/20 blur-3xl" />
            <div className="relative space-y-3 text-center">
              <p className="text-sm text-zinc-400">등록된 고객사가 없습니다</p>
              <Button asChild className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400">
                <Link href="/prospects/new">
                  <Plus className="mr-2 h-4 w-4" />
                  고객사 등록하기
                </Link>
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
        <p className="text-sm text-zinc-400">
          총 {prospects.length}개의 고객사
        </p>
        <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-500">
          <Link href="/prospects/new">
            <Plus className="mr-2 h-4 w-4" />
            새로 등록
          </Link>
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-800/50 hover:bg-transparent">
            <TableHead className="text-xs text-zinc-500 font-medium">회사명</TableHead>
            <TableHead className="text-xs text-zinc-500 font-medium">상태</TableHead>
            <TableHead className="text-xs text-zinc-500 font-medium">URL</TableHead>
            <TableHead className="text-xs text-zinc-500 font-medium">마지막 방문</TableHead>
            <TableHead className="text-xs text-zinc-500 font-medium w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {prospects.map((prospect) => {
            const statusStyle = statusConfig[prospect.crm_status];
            return (
              <TableRow
                key={prospect.id}
                className="border-zinc-800/50 hover:bg-zinc-800/30 cursor-pointer"
                onClick={() => router.push(`/prospects/${prospect.id}/mix`)}
              >
                <TableCell 
                  className="font-medium text-zinc-50"
                >
                  <Link 
                    href={`/prospects/${prospect.id}/mix`}
                    className="flex items-center gap-3 hover:text-amber-400 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <div className="flex items-center justify-center size-8 rounded-full bg-zinc-800/80 text-zinc-300 text-sm font-semibold">
                      {getInitial(prospect.name)}
                    </div>
                    <span>{prospect.name}</span>
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
                  <a
                    href={prospect.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-300 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span className="max-w-[200px] truncate">
                      {prospect.url}
                    </span>
                  </a>
                </TableCell>
                <TableCell className="text-zinc-400 text-sm">
                  {formatDate(prospect.last_activity_at)}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <ProspectActionsMenu prospect={prospect} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </section>
  );
}

