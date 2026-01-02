'use client';

import Link from 'next/link';
import { Save, Send, Clock, Check, ChevronRight, Users } from 'lucide-react';

interface WorkspaceHeaderProps {
  prospectName?: string;
  currentStep: number;
  isSaving?: boolean;
  onSave?: () => void;
  onSend?: () => void;
  onHistoryToggle?: () => void;
  isHistoryOpen?: boolean;
}

const STEP_LABELS: Record<number, string> = {
  1: '진단',
  2: '설계',
  3: '확정',
};

export function WorkspaceHeader({
  prospectName,
  currentStep,
  isSaving = false,
  onSave,
  onSend,
  onHistoryToggle,
  isHistoryOpen = false,
}: WorkspaceHeaderProps) {
  return (
    <header className="flex-shrink-0 h-14 px-6 flex items-center justify-between border-b border-zinc-800/50 bg-zinc-950">
      {/* 좌측: 로고 + Breadcrumb */}
      <div className="flex items-center gap-4">
        {/* 홈 링크 (로고) - 순수 화이트 */}
        <Link
          href="/prospects"
          className="w-9 h-9 rounded-xl bg-white/[0.08] border border-white/[0.1]
                    flex items-center justify-center text-white font-bold text-sm
                    hover:bg-white/[0.12] transition-all"
        >
          LP
        </Link>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-base">
          <Link
            href="/prospects"
            className="text-zinc-300 hover:text-zinc-100 transition-colors flex items-center gap-1.5"
          >
            <Users size={16} />
            <span className="hidden sm:inline">클라이언트 관리</span>
          </Link>
          <ChevronRight size={16} className="text-zinc-500" />
          <span className="text-zinc-200 font-medium">
            {prospectName || '고객사'}
          </span>
          <ChevronRight size={16} className="text-zinc-500" />
          <span className="text-zinc-50 font-semibold">
            Step {currentStep}: {STEP_LABELS[currentStep] || '편집'}
          </span>
        </nav>
      </div>

      {/* 우측 액션 */}
      <div className="flex items-center gap-2">
        {/* 자동 저장 상태 */}
        <span className="text-sm text-zinc-300 flex items-center gap-1.5 px-2">
          {isSaving ? (
            <>
              <div className="w-2.5 h-2.5 border-2 border-zinc-500 border-t-zinc-200 rounded-full animate-spin" />
              <span className="hidden sm:inline">저장 중...</span>
            </>
          ) : (
            <>
              <Check size={14} className="text-zinc-300" />
              <span className="hidden sm:inline text-zinc-300">자동 저장됨</span>
            </>
          )}
        </span>

        {/* 구분선 */}
        <div className="w-px h-5 bg-zinc-800 mx-1" />

        {/* 히스토리 토글 */}
        {onHistoryToggle && (
          <button
            onClick={onHistoryToggle}
            className={`h-8 px-3 rounded-lg border transition-all flex items-center gap-1.5 text-sm font-medium ${
              isHistoryOpen
                ? 'bg-zinc-800/60 text-zinc-50 border-zinc-700'
                : 'border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900/50'
            }`}
          >
            <Clock size={16} />
            <span className="hidden sm:inline">히스토리</span>
          </button>
        )}

        {/* 임시 저장 버튼 */}
        {onSave && (
          <button
            onClick={onSave}
            disabled={isSaving}
            className="h-8 px-3 rounded-lg border border-zinc-800 text-sm font-medium text-zinc-300
                       hover:bg-zinc-900/50 hover:text-zinc-100 transition-colors flex items-center gap-1.5
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            <span className="hidden sm:inline">저장</span>
          </button>
        )}

        {/* 발송 버튼 - 순수 화이트 */}
        {onSend && (
          <button
            onClick={onSend}
            className="h-8 px-4 rounded-lg bg-white text-black text-sm font-bold
                       hover:bg-white/90 transition-all flex items-center gap-1.5"
          >
            <Send size={16} />
            <span>발송</span>
          </button>
        )}
      </div>
    </header>
  );
}
