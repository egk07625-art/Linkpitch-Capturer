'use client';

import { ReactNode } from 'react';
import { Eye, Pencil } from 'lucide-react';
import { EditorToolbar, ViewMode, ContentType } from './EditorToolbar';

export type { ViewMode, ContentType };

interface SplitViewLayoutProps {
  // 콘텐츠
  editorContent: ReactNode;
  previewContent: ReactNode;

  // 뷰 모드 상태
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;

  // 콘텐츠 타입 (E/R 토글)
  contentType?: ContentType;
  onContentTypeChange?: (type: ContentType) => void;
  showContentTypeToggle?: boolean;

  // 헤더 (타이틀은 SegmentedControl에 통합됨)
  title?: string;
  icon?: ReactNode;
  emailIcon?: ReactNode;
  reportIcon?: ReactNode;

  // 툴바 버튼 (왼쪽 그룹, SegmentedControl 오른쪽)
  leftButtons?: ReactNode;
  // 툴바 버튼 (오른쪽 그룹)
  toolbarButtons?: ReactNode;

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
  contentType = 'email',
  onContentTypeChange,
  showContentTypeToggle = false,
  leftButtons,
  toolbarButtons,
  title,
  icon,
  emailIcon,
  reportIcon,
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
      {/* 통합 툴바 - 단일 라인 */}
      <EditorToolbar
        title={title}
        icon={icon}
        emailIcon={emailIcon}
        reportIcon={reportIcon}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        contentType={contentType}
        onContentTypeChange={onContentTypeChange}
        showContentTypeToggle={showContentTypeToggle}
        leftButtons={leftButtons}
        rightButtons={toolbarButtons}
      />

      {/* 콘텐츠 영역 - 항상 분할 모드 */}
      <div className="flex-1 overflow-hidden">
        {/* 분할 모드: 에디터 + 프리뷰 */}
          <div className="flex h-full divide-x divide-zinc-200">
            {/* 왼쪽: 에디터 */}
            <div className="flex flex-col flex-1 min-w-0">
              <div className="px-4 py-1.5 bg-zinc-50 border-b border-zinc-200 shrink-0">
                <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                  <Pencil className="w-2.5 h-2.5" /> {editorLabel}
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
              <div className="px-4 py-1.5 bg-zinc-50 border-b border-zinc-200 shrink-0">
                <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                  <Eye className="w-2.5 h-2.5" /> {previewLabel}
                </span>
              </div>
              <div
                ref={previewScrollRef}
                onScroll={onPreviewScroll}
                className="flex-1 overflow-y-auto bg-white will-change-scroll"
                style={{ scrollBehavior: 'auto' }}
              >
                {previewContent}
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}
