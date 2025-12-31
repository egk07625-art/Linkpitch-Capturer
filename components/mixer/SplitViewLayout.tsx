'use client';

import { ReactNode } from 'react';
import { Eye, Pencil, Columns } from 'lucide-react';

export type ViewMode = 'split' | 'preview';

interface SplitViewLayoutProps {
  // 콘텐츠
  editorContent: ReactNode;
  previewContent: ReactNode;

  // 상태
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;

  // 툴바 버튼 (오른쪽)
  toolbarButtons?: ReactNode;

  // 헤더
  title: string;
  icon?: ReactNode;

  // 스크롤 refs (외부에서 주입)
  editorScrollRef?: React.RefObject<HTMLDivElement>;
  previewScrollRef?: React.RefObject<HTMLDivElement>;
  onEditorScroll?: () => void;
  onPreviewScroll?: () => void;

  // 스타일 옵션
  editorLabel?: string;
  previewLabel?: string;
  className?: string;
}

export function SplitViewLayout({
  editorContent,
  previewContent,
  viewMode,
  onViewModeChange,
  toolbarButtons,
  title,
  icon,
  editorScrollRef,
  previewScrollRef,
  onEditorScroll,
  onPreviewScroll,
  editorLabel = '편집',
  previewLabel = '프리뷰',
  className = '',
}: SplitViewLayoutProps) {

  return (
    <div className={`flex flex-col h-full overflow-hidden ${className}`}>
      {/* 툴바 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 bg-zinc-50 shrink-0">
        <div className="flex items-center gap-4">
          {/* 타이틀 */}
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
            {icon}
            {title}
          </h3>

          {/* 뷰 모드 토글 */}
          <div className="flex items-center bg-white border border-zinc-200 rounded-lg p-1 shadow-sm">
            <button
              onClick={() => onViewModeChange('split')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'split'
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              <Columns size={14} />
              분할
            </button>
            <button
              onClick={() => onViewModeChange('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'preview'
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              <Eye size={14} />
              프리뷰
            </button>
          </div>
        </div>

        {/* 추가 툴바 버튼 */}
        {toolbarButtons && (
          <div className="flex items-center gap-2">
            {toolbarButtons}
          </div>
        )}
      </div>

      {/* 콘텐츠 영역 */}
      <div className="flex-1 overflow-hidden">
        {/* 프리뷰 모드: 프리뷰만 */}
        {viewMode === 'preview' && (
          <div
            ref={previewScrollRef}
            onScroll={onPreviewScroll}
            className="h-full overflow-y-auto bg-white"
          >
            {previewContent}
          </div>
        )}

        {/* 분할 모드: 에디터 + 프리뷰 (기본) */}
        {viewMode === 'split' && (
          <div className="flex h-full divide-x divide-zinc-200">
            {/* 왼쪽: 에디터 */}
            <div className="flex flex-col flex-1 min-w-0">
              <div className="px-4 py-2 bg-zinc-50 border-b border-zinc-200 shrink-0">
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Pencil className="w-3 h-3" /> {editorLabel}
                </span>
              </div>
              <div
                ref={editorScrollRef}
                onScroll={onEditorScroll}
                className="flex-1 min-h-0 overflow-hidden"
              >
                {editorContent}
              </div>
            </div>

            {/* 오른쪽: 프리뷰 */}
            <div className="flex flex-col flex-1 min-w-0">
              <div className="px-4 py-2 bg-zinc-50 border-b border-zinc-200 shrink-0">
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-3 h-3" /> {previewLabel}
                </span>
              </div>
              <div
                ref={previewScrollRef}
                onScroll={onPreviewScroll}
                className="flex-1 overflow-y-auto bg-white"
              >
                {previewContent}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
