"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
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

  // 필터 탭 스타일 로직 (선택 시 빛나는 효과)
  const getTabStyle = (tabName: string) => {
    const baseStyle = "px-6 py-2 rounded-full text-xs font-medium transition-all duration-300 border";
    
    const isActive = tabName === 'All' 
      ? status === null 
      : status === tabName.toLowerCase();
    
    if (isActive) {
      switch (tabName) {
        case 'Hot':
          return `${baseStyle} bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]`;
        case 'Warm':
          return `${baseStyle} bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]`;
        case 'Cold':
          return `${baseStyle} bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]`;
        default: // All
          return `${baseStyle} bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]`;
      }
    }
    
    // 비활성 상태
    return `${baseStyle} border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]`;
  };

  return (
    <div className="w-full flex justify-between items-center mb-8">
      {/* Search Input: 넓이 확장 */}
      <div className="relative w-[400px] group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-zinc-300 transition-colors">
          <Search size={18} strokeWidth={1.5} />
        </div>
        <input 
          type="text" 
          placeholder="Search company, URL..." 
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full bg-[#0a0a0a] border border-white/[0.06] text-white text-sm rounded-xl pl-12 pr-10 py-3.5 
          focus:outline-none focus:border-zinc-600 focus:bg-[#0f0f0f] focus:ring-1 focus:ring-zinc-600/50 
          placeholder-zinc-700 transition-all font-light"
        />
        {search && (
          <button
            onClick={() => handleSearch("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-[#0a0a0a] p-1.5 rounded-full border border-white/[0.06]">
        {['All', 'Hot', 'Warm', 'Cold'].map((statusLabel) => (
          <button 
            key={statusLabel} 
            onClick={() => handleStatusFilter(statusLabel === 'All' ? 'all' : statusLabel.toLowerCase() as CRMStatus)}
            className={getTabStyle(statusLabel)}
          >
            {statusLabel}
          </button>
        ))}
      </div>
    </div>
  );
}

