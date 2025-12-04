'use client';

import React from 'react';
import type { CRMPipelineStats } from '@/actions/dashboard';

interface CRMPipelineCardProps {
  stats: CRMPipelineStats | null;
}

export function CRMPipelineCard({ stats }: CRMPipelineCardProps) {
  // 기본값 설정 (안전한 처리)
  const coldPercentage = stats?.cold.percentage ?? 0;
  const warmPercentage = stats?.warm.percentage ?? 0;
  const hotPercentage = stats?.hot.percentage ?? 0;

  return (
    <div className="xl:col-span-2 bg-[#161618] border border-[#333] rounded-[2rem] p-8 flex flex-col justify-between shadow-xl relative overflow-hidden group">
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
          Customer Temperature
        </h3>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
          Live
        </span>
      </div>

      {/* 파이프라인 바 (Visual Bar) */}
      <div className="space-y-6 relative z-10">
        <div className="flex h-12 w-full rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
          {/* Cold Segment */}
          {coldPercentage > 0 && (
            <div
              className="h-full bg-blue-500/20 border-r border-black/20 flex items-center justify-center relative group/bar transition-all"
              style={{ width: `${coldPercentage}%` }}
            >
              <span className="text-xs font-bold text-blue-400">
                Cold ({coldPercentage}%)
              </span>
              <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover/bar:opacity-100 transition-opacity"></div>
            </div>
          )}
          {/* Warm Segment */}
          {warmPercentage > 0 && (
            <div
              className="h-full bg-amber-500/20 border-r border-black/20 flex items-center justify-center relative group/bar transition-all"
              style={{ width: `${warmPercentage}%` }}
            >
              <span className="text-xs font-bold text-amber-400">
                Warm ({warmPercentage}%)
              </span>
              <div className="absolute inset-0 bg-amber-500/10 opacity-0 group-hover/bar:opacity-100 transition-opacity"></div>
            </div>
          )}
          {/* Hot Segment */}
          {hotPercentage > 0 && (
            <div
              className="h-full bg-rose-500/20 flex items-center justify-center relative group/bar transition-all"
              style={{ width: `${hotPercentage}%` }}
            >
              <span className="text-xs font-bold text-rose-400">
                Hot ({hotPercentage}%)
              </span>
              <div className="absolute inset-0 bg-rose-500/10 opacity-0 group-hover/bar:opacity-100 transition-opacity"></div>
            </div>
          )}
        </div>

        {/* 범례 (Legend) */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{stats?.cold.count ?? 0}</p>
            <p className="text-xs text-zinc-500 uppercase font-semibold tracking-wider mt-1">
              Cold
            </p>
          </div>
          <div className="text-center border-l border-zinc-800">
            <p className="text-2xl font-bold text-white">{stats?.warm.count ?? 0}</p>
            <p className="text-xs text-zinc-500 uppercase font-semibold tracking-wider mt-1">
              Warm
            </p>
          </div>
          <div className="text-center border-l border-zinc-800">
            <p className="text-2xl font-bold text-white">{stats?.hot.count ?? 0}</p>
            <p className="text-xs text-zinc-500 uppercase font-semibold tracking-wider mt-1">
              Hot
            </p>
          </div>
        </div>
      </div>

      {/* 배경 장식 */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/5 to-transparent rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
    </div>
  );
}

