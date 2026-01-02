'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SegmentedControl } from './SegmentedControl';

// 공통 버튼 스타일 토큰 (SegmentedControl과 동일한 디자인)
export const toolbarButtonStyles = {
  // 기본 버튼 (SegmentedControl과 동일)
  base: 'relative px-5 py-1.5 rounded-lg text-sm font-medium tracking-tight transition-all duration-200 active:scale-[0.98] flex items-center gap-1.5',
  // 비활성 상태 (SegmentedControl과 동일)
  inactive: 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50',
  // 활성 상태 (SegmentedControl과 동일한 스타일)
  active: 'text-zinc-900',
  // 활성 컬러 (SegmentedControl과 동일)
  activeColor: {
    default: {
      bg: 'bg-zinc-100',
      text: 'text-zinc-900',
      border: 'border-zinc-200'
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200'
    },
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200'
    },
  },
};

export type ViewMode = 'split' | 'preview';
export type ContentType = 'email' | 'report';

interface EditorToolbarProps {
  // 필수 props (타이틀은 SegmentedControl에 통합됨)
  title?: string;
  icon?: ReactNode;
  emailIcon?: ReactNode;
  reportIcon?: ReactNode;

  // 뷰 모드
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;

  // 콘텐츠 타입 (이메일/리포트 토글)
  contentType?: ContentType;
  onContentTypeChange?: (type: ContentType) => void;
  showContentTypeToggle?: boolean;

  // 추가 버튼들 (왼쪽 그룹에 추가)
  leftButtons?: ReactNode;

  // 추가 버튼들 (오른쪽 그룹)
  rightButtons?: ReactNode;

  // 스타일
  className?: string;
}

export function EditorToolbar({
  title,
  icon,
  emailIcon,
  reportIcon,
  viewMode,
  onViewModeChange,
  contentType = 'email',
  onContentTypeChange,
  showContentTypeToggle = true,
  leftButtons,
  rightButtons,
  className = '',
}: EditorToolbarProps) {
  return (
    <div className={cn(
      'flex items-center justify-between w-full px-4 py-2.5',
      'border-b border-zinc-200 bg-gray-50 shrink-0',
      className
    )}>
      {/* 왼쪽 그룹: 모드 토글 + 뷰 모드 */}
      <div className="flex items-center gap-4">
        {/* Email/Report 세그먼트 토글 (타이틀 통합) */}
        {showContentTypeToggle && onContentTypeChange && (
          <SegmentedControl
            segments={[
              { 
                id: 'email', 
                label: 'Email', 
                icon: emailIcon || (contentType === 'email' ? icon : undefined)
              },
              { 
                id: 'report', 
                label: 'REPORT', 
                icon: reportIcon || (contentType === 'report' ? icon : undefined)
              },
            ]}
            value={contentType}
            onChange={(v) => onContentTypeChange(v as ContentType)}
          />
        )}

        {/* 구분선 */}
        {showContentTypeToggle && (
          <div className="w-px h-5 bg-zinc-200" />
        )}

        {/* 추가 왼쪽 버튼들 (SegmentedControl 스타일 컨테이너) */}
        {leftButtons && (
          <div className="inline-flex p-1 bg-white rounded-xl border border-zinc-200 shadow-sm">
            {leftButtons}
          </div>
        )}
      </div>

      {/* 오른쪽 그룹: 추가 버튼 (SegmentedControl 스타일 컨테이너) */}
      {rightButtons && (
        <div className="inline-flex p-1 bg-white rounded-xl border border-zinc-200 shadow-sm">
        {rightButtons}
      </div>
      )}
    </div>
  );
}

// 유틸리티: 툴바 버튼 컴포넌트
interface ToolbarButtonProps {
  onClick: () => void;
  icon: ReactNode;
  label: string;
  isActive?: boolean;
  variant?: 'default' | 'primary';
  disabled?: boolean;
  className?: string;
}

export function ToolbarButton({
  onClick,
  icon,
  label,
  isActive = false,
  variant = 'default',
  disabled = false,
  className = '',
}: ToolbarButtonProps) {
  const getButtonClass = () => {
    if (disabled) {
      return cn(toolbarButtonStyles.base, 'text-zinc-300 cursor-not-allowed');
    }
    if (variant === 'primary') {
      const primaryStyles = toolbarButtonStyles.activeColor.blue;
      return cn(toolbarButtonStyles.base, primaryStyles.text);
    }
    if (isActive) {
      const activeStyles = toolbarButtonStyles.activeColor.emerald;
      return cn(toolbarButtonStyles.base, activeStyles.text);
    }
    return cn(toolbarButtonStyles.base, toolbarButtonStyles.inactive);
  };

  const getActiveIndicatorClass = () => {
    if (disabled) return '';
    if (variant === 'primary') {
      return toolbarButtonStyles.activeColor.blue;
    }
    if (isActive) {
      return toolbarButtonStyles.activeColor.emerald;
    }
    return null;
  };

  const activeIndicatorStyles = getActiveIndicatorClass();

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(getButtonClass(), className)}
    >
      {activeIndicatorStyles && (
        <motion.div
          layoutId={`toolbar-button-${label}`}
          className={cn('absolute inset-0 rounded-lg shadow-sm', activeIndicatorStyles.bg, activeIndicatorStyles.border)}
          transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
        />
      )}
      <span className="relative z-10 flex items-center gap-1.5">
      {icon}
      {label}
      </span>
    </button>
  );
}
