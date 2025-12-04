'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDroppable } from '@dnd-kit/core';
import { Sparkles, ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VisionItem } from '@/types/vision';

interface DropZoneProps {
  droppedInsights: VisionItem[];
  onRemove: (id: string) => void;
  isCollapsible?: boolean;
}

export default function DropZone({ droppedInsights, onRemove, isCollapsible = false }: DropZoneProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { setNodeRef, isOver } = useDroppable({
    id: 'drop-zone',
  })

  if (isCollapsible) {
    return (
      <div className="border-b border-zinc-800/50">
        {/* Collapsible Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-5 py-4 bg-zinc-900/50 hover:bg-zinc-900/70 transition-colors flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <div className="text-left">
              <h3 className="text-sm font-semibold text-zinc-200">✨ AI 재구성 도구</h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                {isExpanded ? '클릭하여 닫기' : '클릭하여 열기'} · {droppedInsights.length}개 선택됨
              </p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
          )}
        </button>

        {/* Collapsible Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div
                ref={setNodeRef}
                className={cn(
                  "p-5 transition-colors",
                  isOver && "bg-amber-500/10"
                )}
              >
                {droppedInsights.length === 0 ? (
                  <div className="bg-gradient-to-b from-zinc-900/50 to-transparent rounded-xl flex flex-col items-center justify-center text-zinc-500 py-12">
                    <Sparkles className="w-10 h-10 mb-3 text-amber-500/50 animate-pulse" />
                    <p className="text-sm font-medium text-zinc-500">이곳에 칩을 놓으세요...</p>
                    <p className="text-xs text-zinc-600 mt-1">좌측에서 인사이트를 드래그하여 추가</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {droppedInsights.map((item) => (
                      <div 
                        key={item.id}
                        className="relative group bg-zinc-800/60 border border-amber-500/30 rounded-lg p-4"
                      >
                        <button
                          onClick={() => onRemove(item.id)}
                          className="absolute top-2 right-2 p-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700 rounded opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <p className="text-xs font-bold text-amber-400 mb-1">{item.label}</p>
                        <p className="text-sm text-zinc-200">{item.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Non-collapsible version (original)
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-zinc-800/50 bg-zinc-900/50">
        <h3 className="text-base font-semibold text-zinc-200">선택한 인사이트</h3>
        <p className="text-sm text-zinc-500 mt-1">{droppedInsights.length}개 선택됨</p>
      </div>

      {/* Drop Area */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 p-5 transition-colors",
          isOver && "bg-amber-500/10"
        )}
      >
        {droppedInsights.length === 0 ? (
          <div className="h-full bg-gradient-to-b from-zinc-900/50 to-transparent rounded-xl flex flex-col items-center justify-center text-zinc-500">
            <Sparkles className="w-12 h-12 mb-4 text-amber-500/50 animate-pulse" />
            <p className="text-base font-medium text-zinc-500">이곳에 칩을 놓고 &quot;제안서 작성&quot; 버튼을 누르면 AI가 조합하여 작성합니다.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {droppedInsights.map((item) => (
              <div 
                key={item.id}
                className="relative group bg-zinc-800/60 border border-amber-500/30 rounded-lg p-4"
              >
                <button
                  onClick={() => onRemove(item.id)}
                  className="absolute top-2 right-2 p-1 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700 rounded opacity-0 group-hover:opacity-100 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <p className="text-xs font-bold text-amber-400 mb-1">{item.label}</p>
                <p className="text-sm text-zinc-200">{item.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
