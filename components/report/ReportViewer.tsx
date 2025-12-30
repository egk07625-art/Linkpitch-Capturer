/**
 * @file ReportViewer.tsx
 * @description 공개 리포트 뷰어 컴포넌트 (명품 디자인 버전)
 *
 * LuxuryReportLayout + ReportMarkdownRenderer를 사용하여
 * 에디터 프리뷰 모달과 동일한 프리미엄 디자인을 제공합니다.
 */

"use client";

import { useMemo } from "react";
import { useReportTracking } from "@/hooks/use-report-tracking";
import { LuxuryReportLayout } from "./LuxuryReportLayout";
import { ReportMarkdownRenderer } from "./ReportMarkdownRenderer";
import type { ReportData } from "@/types/report-viewer";

interface ReportViewerProps {
  reportData: ReportData;
}

/**
 * 날짜 포맷팅 함수
 */
function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

/**
 * 리포트 뷰어 컴포넌트 (공개 페이지용)
 */
export function ReportViewer({ reportData }: ReportViewerProps) {
  // 리포트 조회 추적 활성화
  useReportTracking({
    prospectId: reportData.prospect_id,
    enabled: true,
  });

  // 마크다운 콘텐츠 검증 및 폴백
  const content = useMemo(() => {
    if (typeof reportData.report_markdown !== "string") {
      console.error(
        "[Report Viewer] Invalid markdown content type:",
        typeof reportData.report_markdown
      );
      return "리포트 데이터를 읽어오는 중 오류가 발생했습니다.";
    }
    return reportData.report_markdown || "리포트 내용이 비어 있습니다.";
  }, [reportData.report_markdown]);

  return (
    <LuxuryReportLayout
      showHeader={true}
      theme={reportData.theme}
      targetType={reportData.target_type}
      issuingCompany={reportData.issuing_company}
      stepNumber={reportData.step_number}
      date={formatDate(reportData.created_at)}
    >
      <ReportMarkdownRenderer content={content} />
    </LuxuryReportLayout>
  );
}
