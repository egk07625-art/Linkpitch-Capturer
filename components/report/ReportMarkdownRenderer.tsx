/**
 * @file ReportMarkdownRenderer.tsx
 * @description 리포트용 마크다운 렌더러 컴포넌트
 *
 * globals.css의 .report-prose 스타일을 활용하여
 * 일관된 타이포그래피를 제공합니다.
 */

'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ReportMarkdownRendererProps {
  /** 마크다운 콘텐츠 */
  content: string;
  /** 추가 CSS 클래스 */
  className?: string;
}

export function ReportMarkdownRenderer({
  content,
  className = ''
}: ReportMarkdownRendererProps) {
  // 콘텐츠 유효성 검사
  if (!content || typeof content !== 'string') {
    return (
      <div className="text-gray-500 text-center py-8">
        리포트 내용이 비어 있습니다.
      </div>
    );
  }

  return (
    <article className={`report-prose max-w-none ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </article>
  );
}
