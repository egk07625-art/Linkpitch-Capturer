'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X, ChevronDown } from 'lucide-react';
import { STRATEGY_GUIDE } from '@/lib/constants/strategy-guide';
import { cn } from '@/lib/utils';

interface StrategyInsightPanelProps {
  stepNumber?: number;
}

export default function StrategyInsightPanel({ stepNumber = 1 }: StrategyInsightPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const guide = STRATEGY_GUIDE[stepNumber as keyof typeof STRATEGY_GUIDE] || STRATEGY_GUIDE[1];

  return (
    <div className="w-full px-4 mb-4">
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          <motion.button
            layoutId="strategy-panel"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onClick={() => setIsExpanded(true)}
            className="w-full h-10 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-lg flex items-center justify-between px-4 hover:bg-zinc-800/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-zinc-300 font-medium truncate">
                {guide.question}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
          </motion.button>
        ) : (
          <motion.div
            layoutId="strategy-panel"
            className="w-full bg-zinc-900/80 backdrop-blur-xl border border-amber-500/30 rounded-xl overflow-hidden relative"
          >
            {/* Background Gradient Mesh */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-purple-500/5 pointer-events-none" />
            
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 bg-zinc-900/50">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-zinc-100">Strategy Mentor</span>
              </div>
              <button 
                onClick={() => setIsExpanded(false)}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="grid grid-cols-2 divide-x divide-zinc-800/50">
              {/* Left: The Mistake */}
              <div className="p-4 space-y-2 bg-red-500/5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-red-400 uppercase tracking-wider">The Trap</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {guide.mistake}
                </p>
              </div>

              {/* Right: The Strategy */}
              <div className="p-4 space-y-2 bg-amber-500/5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">The Strategy</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {guide.strategy}
                </p>
              </div>
            </div>

            {/* Footer Tip */}
            <div className="px-4 py-3 bg-zinc-900/50 border-t border-zinc-800/50">
              <p className="text-xs text-zinc-500 italic">
                💡 Tip: {guide.why}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
