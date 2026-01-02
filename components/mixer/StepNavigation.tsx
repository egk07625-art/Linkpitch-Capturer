'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StepNavigationProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  stepsWithData?: number[];
  className?: string;
}

export function StepNavigation({
  currentStep,
  onStepChange,
  stepsWithData = [],
  className = '',
}: StepNavigationProps) {
  return (
    <nav className={cn('inline-flex p-1 bg-white rounded-xl border border-zinc-200 shadow-sm', className)}>
      {[1, 2, 3].map((step) => {
        const isActive = currentStep === step;
        const hasData = stepsWithData.includes(step);
        const isDisabled = !hasData;

        return (
          <button
            key={step}
            onClick={() => hasData && onStepChange(step)}
            disabled={isDisabled}
            className={cn(
              'relative px-5 py-1.5 rounded-lg text-sm font-medium tracking-tight transition-all duration-200',
              'active:scale-[0.98]',
              isActive
                ? 'text-zinc-900'
                : hasData
                  ? 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'
                  : 'text-zinc-300 cursor-not-allowed'
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activeStepIndicator"
                className="absolute inset-0 bg-zinc-100 border border-zinc-300 rounded-lg shadow-sm"
                transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
              />
            )}
            <span className="relative z-10">Step {step}</span>
          </button>
        );
      })}
    </nav>
  );
}
