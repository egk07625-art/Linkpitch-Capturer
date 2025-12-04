"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { CRMStatus } from "@/types/prospect";

export function ProspectsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const status = searchParams.get("status") as CRMStatus | null;
  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "created_at";

  const updateParams = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/prospects?${params.toString()}`);
  };

  const handleStatusFilter = (newStatus: CRMStatus | "all") => {
    updateParams("status", newStatus === "all" ? null : newStatus);
  };

  const handleSearch = (value: string) => {
    updateParams("search", value || null);
  };

  const handleSort = (value: string) => {
    updateParams("sort", value);
  };

  const clearFilters = () => {
    router.push("/prospects");
  };

  const hasActiveFilters = status || search;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* 검색 */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="회사명, URL, 담당자 검색..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 pr-9"
          />
          {search && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* 정렬 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 whitespace-nowrap">정렬:</span>
          <div className="flex gap-1 border border-zinc-800 rounded-md p-1">
            <Button
              variant={sort === "created_at" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleSort("created_at")}
              className={cn(
                "h-7 text-xs",
                sort === "created_at" &&
                  "bg-amber-600 hover:bg-amber-500 text-white",
              )}
            >
              생성일
            </Button>
            <Button
              variant={sort === "name" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleSort("name")}
              className={cn(
                "h-7 text-xs",
                sort === "name" &&
                  "bg-amber-600 hover:bg-amber-500 text-white",
              )}
            >
              이름
            </Button>
            <Button
              variant={sort === "last_activity_at" ? "default" : "ghost"}
              size="sm"
              onClick={() => handleSort("last_activity_at")}
              className={cn(
                "h-7 text-xs",
                sort === "last_activity_at" &&
                  "bg-amber-600 hover:bg-amber-500 text-white",
              )}
            >
              활동일
            </Button>
          </div>
        </div>
      </div>

      {/* 상태 필터 */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-zinc-400">상태:</span>
        <Button
          variant={status === null ? "default" : "outline"}
          size="sm"
          onClick={() => handleStatusFilter("all")}
          className={cn(
            "h-8",
            status === null &&
              "bg-amber-600 hover:bg-amber-500 text-white border-amber-600",
          )}
        >
          전체
        </Button>
        <Button
          variant={status === "hot" ? "default" : "outline"}
          size="sm"
          onClick={() => handleStatusFilter("hot")}
          className={cn(
            "h-8",
            status === "hot" &&
              "bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20",
          )}
        >
          Hot
        </Button>
        <Button
          variant={status === "warm" ? "default" : "outline"}
          size="sm"
          onClick={() => handleStatusFilter("warm")}
          className={cn(
            "h-8",
            status === "warm" &&
              "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20",
          )}
        >
          Warm
        </Button>
        <Button
          variant={status === "cold" ? "default" : "outline"}
          size="sm"
          onClick={() => handleStatusFilter("cold")}
          className={cn(
            "h-8",
            status === "cold" &&
              "bg-zinc-700 text-zinc-400 border-zinc-700 hover:bg-zinc-600",
          )}
        >
          Cold
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-8 text-zinc-400 hover:text-zinc-300 ml-auto"
          >
            <X className="h-4 w-4 mr-1" />
            필터 초기화
          </Button>
        )}
      </div>
    </div>
  );
}

