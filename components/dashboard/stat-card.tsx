'use client';

import React from 'react';
import { LucideIcon, Users, Send, BarChart3, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

type IconName = 'Users' | 'Send' | 'BarChart3' | 'Flame';

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: string;
  icon: LucideIcon | IconName;
  color?: 'blue' | 'indigo' | 'emerald' | 'rose';
  isHighlighted?: boolean;
  onClick?: () => void;
}

const iconMap: Record<IconName, LucideIcon> = {
  Users,
  Send,
  BarChart3,
  Flame,
};

const colorClasses = {
  blue: {
    icon: 'text-blue-500',
    container: 'shadow-blue-500/10',
  },
  indigo: {
    icon: 'text-indigo-500',
    container: 'shadow-indigo-500/10',
  },
  emerald: {
    icon: 'text-emerald-500',
    container: 'shadow-emerald-500/10',
  },
  rose: {
    icon: 'text-rose-500',
    container: 'shadow-rose-500/20 bg-rose-500/5 border-rose-500/20',
  },
};

export function StatCard({
  title,
  value,
  trend,
  icon,
  color = 'blue',
  isHighlighted = false,
  onClick,
}: StatCardProps) {
  const colorStyle = colorClasses[color];
  
  // 아이콘 처리: 문자열이면 iconMap에서 찾고, 아니면 직접 사용
  const IconComponent = typeof icon === 'string' ? iconMap[icon] : icon;

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-3xl p-6 transition-all duration-300',
        'bg-[#161618] border border-[#333]',
        'hover:-translate-y-1 hover:shadow-2xl',
        isHighlighted ? colorStyle.container : 'hover:border-zinc-600',
        onClick && 'cursor-pointer',
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <p
          className={cn(
            'text-base font-semibold',
            isHighlighted ? 'text-rose-400' : 'text-zinc-300',
          )}
        >
          {title}
        </p>
        <div
          className={cn(
            'p-2 rounded-xl bg-zinc-900/50 border border-white/5',
            isHighlighted ? 'text-rose-500' : colorStyle.icon,
          )}
        >
          <IconComponent className="w-5 h-5" />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-4xl font-bold tracking-tight text-white">
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              'text-xs font-medium',
              isHighlighted ? 'text-rose-400/80' : 'text-zinc-500',
            )}
          >
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

