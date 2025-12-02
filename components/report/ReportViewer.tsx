/**
 * @file components/report/ReportViewer.tsx
 * @description 리포트 뷰어 컴포넌트
 *
 * HTML 리포트를 렌더링하고 조회 추적을 수행합니다.
 */

"use client";

import { useMemo } from "react";
import DOMPurify from "isomorphic-dompurify";
import { useReportTracking } from "@/hooks/use-report-tracking";
import type { ReportData } from "@/types/report-viewer";

interface ReportViewerProps {
  reportData: ReportData;
}

/**
 * 리포트 뷰어 컴포넌트
 */
export function ReportViewer({ reportData }: ReportViewerProps) {
  // 리포트 조회 추적 활성화
  useReportTracking({
    prospectId: reportData.prospect_id,
    enabled: true,
  });

  // HTML sanitization: XSS 공격 방지
  // n8n에서 생성된 HTML이지만, 데이터 소스가 손상되거나 잘못 구성될 수 있으므로
  // 모든 HTML을 sanitize하여 악성 스크립트 실행을 방지합니다.
  const sanitizedHtml = useMemo(() => {
    if (!reportData.report_html) {
      return null;
    }

    return DOMPurify.sanitize(reportData.report_html, {
      // 리포트에 필요한 HTML 태그와 속성 허용
      ALLOWED_TAGS: [
        "p",
        "div",
        "span",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "strong",
        "em",
        "u",
        "b",
        "i",
        "br",
        "hr",
        "ul",
        "ol",
        "li",
        "a",
        "img",
        "table",
        "thead",
        "tbody",
        "tr",
        "th",
        "td",
        "blockquote",
        "pre",
        "code",
      ],
      ALLOWED_ATTR: [
        "href",
        "target",
        "rel", // 링크
        "src",
        "alt",
        "width",
        "height",
        "style", // 이미지
        "class",
        "id", // 스타일링
        "colspan",
        "rowspan", // 테이블
      ],
      // 스타일 속성 허용 (리포트 디자인을 위해 필요)
      ALLOW_DATA_ATTR: false,
      // JavaScript 실행 방지
      FORBID_TAGS: ["script", "iframe", "object", "embed", "form"],
      FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
    });
  }, [reportData.report_html]);

  if (!reportData.report_html || !sanitizedHtml) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-8">
        <div className="max-w-2xl w-full text-center">
          <h1 className="text-2xl font-semibold text-zinc-50 mb-4">
            리포트를 찾을 수 없습니다
          </h1>
          <p className="text-zinc-400">
            요청하신 리포트가 존재하지 않거나 아직 생성되지 않았습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* 리포트 HTML 렌더링 (Sanitized) */}
      <div
        className="report-content"
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />

      {/* 리포트 스타일링을 위한 글로벌 스타일 */}
      <style jsx global>{`
        .report-content {
          width: 100%;
          max-width: 100%;
        }

        .report-content * {
          max-width: 100%;
        }

        .report-content img {
          height: auto;
        }
      `}</style>
    </div>
  );
}
