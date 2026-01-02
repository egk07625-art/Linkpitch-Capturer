'use client';

import { ReactNode, cloneElement, isValidElement } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Segment {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface SegmentedControlProps {
  segments: Segment[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SegmentedControl({
  segments,
  value,
  onChange,
  className = '',
}: SegmentedControlProps) {
  return (
    <div
      className={cn(
        'inline-flex p-1',
        'bg-white',
        'rounded-xl',
        'border border-zinc-200',
        'shadow-sm',
        className
      )}
    >
      {segments.map((segment) => {
        const isActive = value === segment.id;
        
        // 세그먼트별 색상 정의
        const getActiveStyles = () => {
          if (segment.id === 'email') {
            return {
              bg: 'bg-cyan-50',
              text: 'text-cyan-700',
              border: 'border-cyan-200'
            };
          } else if (segment.id === 'report') {
            return {
              bg: 'bg-violet-50',
              text: 'text-violet-700',
              border: 'border-violet-200'
            };
          }
          return {
            bg: 'bg-zinc-100',
            text: 'text-zinc-900',
            border: 'border-zinc-200'
          };
        };

        const activeStyles = getActiveStyles();

        return (
          <button
            key={segment.id}
            onClick={() => onChange(segment.id)}
            className={cn(
              'relative px-5 py-1.5',
              'rounded-lg',
              'text-sm font-medium tracking-tight',
              'transition-all duration-200',
              'active:scale-[0.98]',
              isActive
                ? activeStyles.text
                : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'
            )}
          >
            {isActive && (
              <motion.div
                layoutId="segmentIndicator"
                className={cn('absolute inset-0 rounded-lg shadow-sm', activeStyles.bg, activeStyles.border)}
                transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {segment.icon && isValidElement(segment.icon) ? (
                cloneElement(segment.icon as React.ReactElement, {
                  className: cn(
                    'flex-shrink-0',
                    segment.icon.props?.className || '',
                    isActive 
                      ? segment.id === 'email' 
                        ? 'text-cyan-700' 
                        : segment.id === 'report'
                          ? 'text-violet-700'
                          : 'text-zinc-900'
                      : 'text-zinc-500'
                  )
                })
              ) : (
                <span className={cn(
                  'flex-shrink-0',
                  isActive 
                    ? segment.id === 'email' 
                      ? 'text-cyan-700' 
                      : segment.id === 'report'
                        ? 'text-violet-700'
                        : 'text-zinc-900'
                    : 'text-zinc-500'
                )}>
                  {segment.icon}
                </span>
              )}
              {segment.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
