'use client';

import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useMixerStore } from '@/store/mixer-store';
import { GripVertical } from 'lucide-react';

interface StrategyChipProps {
  id: string;
  label: string;
}

const StrategyChip = ({ id, label }: StrategyChipProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: id,
    data: { type: 'strategy', label },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        flex items-center gap-2 p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 
        cursor-grab active:cursor-grabbing hover:border-zinc-700 transition-colors
        ${isDragging ? 'opacity-50' : ''}
      `}
    >
      <GripVertical className="w-4 h-4 text-zinc-500" />
      <span className="text-sm text-zinc-300 font-medium">{label}</span>
    </div>
  );
};

export default function StrategyConsole() {
  const { customContext, setCustomContext } = useMixerStore();

  const strategies = [
    { id: 'strat-1', label: '🎯 경쟁사 분석' },
    { id: 'strat-2', label: '📊 성과 그래프' },
    { id: 'strat-3', label: '📰 최근 뉴스' },
    { id: 'strat-4', label: '⚙️ 사용 기술' },
  ];

  return (
    <div className="h-full flex flex-col p-6 border-r border-zinc-800 bg-zinc-950">
      <div className="mb-8">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
          나만의 무기 (성과/강점)
        </h2>
        <textarea
          value={customContext}
          onChange={(e) => setCustomContext(e.target.value)}
          placeholder="지난 3개월간 뷰티 브랜드 ROAS 200% 달성 등, 당신만의 구체적인 성과를 입력하세요."
          className="w-full h-32 bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 resize-none"
        />
      </div>

      <div className="flex-1">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
          전략 칩 (드래그하세요)
        </h2>
        <div className="space-y-3">
          {strategies.map((strat) => (
            <StrategyChip key={strat.id} id={strat.id} label={strat.label} />
          ))}
        </div>
      </div>
    </div>
  );
}
