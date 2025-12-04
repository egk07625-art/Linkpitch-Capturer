'use client';

import React from 'react';
import { Mail, MousePointerClick, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import Link from 'next/link';

export interface ActivityItem {
  id: string;
  type: 'sent' | 'opened' | 'clicked' | 'scroll_80' | 'status_changed';
  title: string;
  timestamp: string;
  prospect_name?: string;
}

interface ActivityTimelineCardProps {
  activities: ActivityItem[] | null;
}

function getActivityIcon(type: ActivityItem['type']) {
  switch (type) {
    case 'sent':
      return Mail;
    case 'opened':
    case 'clicked':
      return MousePointerClick;
    case 'scroll_80':
      return CheckCircle2;
    case 'status_changed':
      return CheckCircle2;
    default:
      return Clock;
  }
}

function getActivityColor(type: ActivityItem['type']) {
  switch (type) {
    case 'sent':
      return 'text-zinc-400 bg-zinc-900';
    case 'opened':
    case 'clicked':
      return 'text-blue-400 bg-blue-500/10';
    case 'scroll_80':
      return 'text-emerald-400 bg-emerald-500/10';
    case 'status_changed':
      return 'text-emerald-400 bg-emerald-500/10';
    default:
      return 'text-zinc-500 bg-zinc-900';
  }
}

function formatTimeAgo(timestamp: string): string {
  try {
    return formatDistanceToNow(new Date(timestamp), {
      addSuffix: true,
      locale: ko,
    });
  } catch {
    return '알 수 없음';
  }
}

function ActivityItemComponent({
  activity,
  isLast,
}: {
  activity: ActivityItem;
  isLast: boolean;
}) {
  const Icon = getActivityIcon(activity.type);
  const colorStyle = getActivityColor(activity.type);
  const isHighlighted = 
    activity.type === 'opened' || 
    activity.type === 'clicked' || 
    activity.type === 'scroll_80';

  return (
    <div className="flex gap-4 items-start py-3 relative group cursor-pointer rounded-xl hover:bg-white/[0.02] px-2 -mx-2 transition-colors">
      <div
        className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border border-[#333] shrink-0 ${colorStyle}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex flex-col pt-0.5 flex-1">
        <p
          className={`text-sm font-medium ${
            isHighlighted ? 'text-blue-400' : 'text-zinc-300'
          }`}
        >
          {activity.title}
        </p>
        <p className="text-xs text-zinc-500">{formatTimeAgo(activity.timestamp)}</p>
      </div>
      {!isLast && (
        <div className="absolute left-[19px] top-[52px] bottom-0 w-[1px] bg-zinc-800"></div>
      )}
    </div>
  );
}

export function ActivityTimelineCard({ activities }: ActivityTimelineCardProps) {
  const displayActivities = activities?.slice(0, 4) || [];

  return (
    <div className="xl:col-span-2 bg-[#161618] border border-[#333] rounded-[2rem] p-8 shadow-xl relative overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
          Live Feed
        </h3>
        <Link
          href="/app/prospects"
          className="text-xs text-zinc-500 hover:text-white transition-colors flex items-center gap-1"
        >
          전체 보기
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-0 relative">
        {/* 세로 연결선 */}
        {displayActivities.length > 0 && (
          <div className="absolute left-[19px] top-2 bottom-4 w-[1px] bg-zinc-800"></div>
        )}

        {/* Activity Items */}
        {displayActivities.length > 0 ? (
          displayActivities.map((activity, index) => (
            <ActivityItemComponent
              key={activity.id}
              activity={activity}
              isLast={index === displayActivities.length - 1}
            />
          ))
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-zinc-500">최근 활동이 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}

