/**
 * @file types/report-viewer.ts
 * @description 리포트 뷰어 관련 타입 정의
 */

/**
 * 리포트 뷰어 페이지 파라미터
 */
export interface ReportViewerParams {
  prospect_id: string;
  step_number: string;
}

/**
 * 리포트 데이터 (generated_emails 테이블에서 조회)
 */
export interface ReportData {
  id: string;
  prospect_id: string;
  step_number: number;
  report_html: string | null;
  theme: string;
  target_type: string;
  created_at: string;
}

/**
 * 리포트 추적 로그 데이터
 */
export interface ReportTrackingLog {
  prospect_id: string;
  session_id: string;
  user_agent?: string;
  ip_address?: string;
  scroll_depth: number;
  duration_seconds: number;
}

/**
 * 리포트 추적 훅 옵션
 */
export interface UseReportTrackingOptions {
  prospectId: string;
  enabled?: boolean;
}

