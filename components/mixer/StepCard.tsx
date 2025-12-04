'use client';

import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Copy, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface StepCardProps {
  step: number;
  title: string;
  defaultContent?: string;
}

export default function StepCard({ step, title, defaultContent = '' }: StepCardProps) {
  const [mode, setMode] = useState<'mail' | 'report'>('mail');
  const [content, setContent] = useState(defaultContent);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id: `step-${step}`,
    data: { step, title },
  });

  // Simulate AI Regeneration when item is dropped (handled by parent, but visual state here)
  // For now, we'll just expose a way to trigger it or handle it via props if needed.
  // Ideally, the parent component handles the drop event and updates the content.

  return (
    <div 
      ref={setNodeRef}
      className={`
        relative overflow-hidden rounded-2xl border transition-all duration-300
        ${isOver ? 'border-amber-500/50 bg-zinc-900/50 ring-1 ring-amber-500/20' : 'border-white/5 bg-zinc-900/30 backdrop-blur-md'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/5">
        <h3 className="text-lg font-bold text-white">
          Step {step}. {title}
        </h3>
        
        <div className="flex items-center gap-1 bg-zinc-950/50 rounded-lg p-1 border border-white/5">
          <button
            onClick={() => setMode('mail')}
            className={`
              px-3 py-1.5 text-xs font-medium rounded-md transition-all
              ${mode === 'mail' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}
            `}
          >
            메일 본문
          </button>
          <button
            onClick={() => setMode('report')}
            className={`
              px-3 py-1.5 text-xs font-medium rounded-md transition-all
              ${mode === 'report' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}
            `}
          >
            리포트 내용
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6 relative min-h-[300px]">
        <AnimatePresence mode="wait">
          {mode === 'mail' ? (
            <motion.div
              key="mail"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="이메일 본문을 작성하세요..."
                className="w-full h-[250px] bg-transparent border-none resize-none text-zinc-300 placeholder:text-zinc-700 focus:outline-none text-base leading-relaxed"
              />
            </motion.div>
          ) : (
            <motion.div
              key="report"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="h-full space-y-4"
            >
              <div className="p-4 rounded-xl bg-zinc-950/50 border border-white/5">
                <label className="block text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wider">
                  Vision Analysis Result
                </label>
                <div className="text-sm text-zinc-400">
                  분석된 비전 데이터가 이곳에 표시됩니다.
                </div>
              </div>
              <div className="p-4 rounded-xl bg-zinc-950/50 border border-white/5">
                <label className="block text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wider">
                  Key Insights
                </label>
                <div className="text-sm text-zinc-400">
                  주요 인사이트 요약...
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Overlay */}
        {isRegenerating && (
          <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-medium text-amber-400">AI Updating...</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
        <button 
          className="group flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-amber-400 transition-colors"
          onClick={() => {
            setIsRegenerating(true);
            setTimeout(() => setIsRegenerating(false), 1500);
          }}
        >
          <Sparkles className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span>AI 재작성</span>
        </button>

        <button 
          className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
          title="Copy content"
        >
          <Copy className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
