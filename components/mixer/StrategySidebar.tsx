'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, CheckCircle2, X, Check } from 'lucide-react';
import { SCENARIO_STEPS } from '@/lib/constants/scenario-steps';
import { cn } from '@/lib/utils';

interface StrategySidebarProps {
  currentStep: number;
  onStepChange: (step: number) => void;
}

export default function StrategySidebar({ currentStep, onStepChange }: StrategySidebarProps) {
  const currentMentor = SCENARIO_STEPS.find(s => s.step === currentStep)?.mentor || SCENARIO_STEPS[0].mentor;

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      {/* Header */}
      <div className="flex-shrink-0 px-5 py-4 border-b border-zinc-800/50">
        <h2 className="text-sm font-bold text-zinc-200 tracking-tight">제안 시나리오</h2>
        <p className="text-xs text-zinc-500 mt-1">Proposal Scenario</p>
      </div>

      {/* Timeline List */}
      <div className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
        <div className="relative space-y-2">
          {SCENARIO_STEPS.map((step) => (
            <button
              key={step.step}
              onClick={() => onStepChange(step.step)}
              className={cn(
                "relative w-full text-left px-4 py-3 rounded-lg transition-all duration-200",
                step.step === currentStep
                  ? "text-white"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"
              )}
            >
              {/* Active Background */}
              {step.step === currentStep && (
                <motion.div
                  layoutId="active-bg"
                  className="absolute inset-0 bg-zinc-800 rounded-lg"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}

              {/* Content */}
              <div className="relative flex items-center gap-3">
                <div className={cn(
                  "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                  step.step === currentStep
                    ? "bg-amber-600 text-white"
                    : step.step < currentStep
                    ? "bg-zinc-700 text-zinc-400"
                    : "bg-zinc-800/50 text-zinc-600"
                )}>
                  {step.step < currentStep ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    step.step
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium truncate",
                    step.step === currentStep && "font-bold"
                  )}>
                    {step.title}
                  </p>
                  <p className="text-xs text-zinc-600 truncate">{step.subtitle}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Strategy Mentor Card (Always Visible) */}
      <div className="flex-shrink-0 p-4 border-t border-zinc-800/50">
        <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-5">
          <div className="flex items-start gap-3 mb-4">
            <Lightbulb className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-zinc-100 mb-1">Strategy Mentor</h3>
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="text-xs text-zinc-400 leading-relaxed"
                >
                  {currentMentor.question}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-2"
            >
              {/* Trap Box */}
              <div className="bg-rose-950/30 border border-rose-500/20 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <X className="w-3 h-3 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-rose-300 mb-1">The Trap</p>
                    <p className="text-xs text-rose-200/80 leading-relaxed">{currentMentor.trap}</p>
                  </div>
                </div>
              </div>
              
              {/* Strategy Box */}
              <div className="bg-amber-950/30 border border-amber-500/20 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Check className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-amber-300 mb-1">The Strategy</p>
                    <p className="text-xs text-amber-200/80 leading-relaxed">{currentMentor.strategy}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
