/**
 * @file app/report/[prospect_id]/page.tsx
 * @description 리포트 뷰어 페이지 (Query Parameter 방식)
 *
 * URL 구조: /report/{prospect_id}?step=1
 * step 파라미터가 없으면 기본값 1 사용
 */

import { notFound } from 'next/navigation';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { ReportViewer } from '@/components/report/ReportViewer';
import ReportNotFound from '@/components/report/ReportNotFound';
import type { ReportData } from '@/types/report-viewer';
import type { Metadata } from 'next';

interface ReportPageProps {
  params: Promise<{
    prospect_id: string;
  }>;
  searchParams: Promise<{
    step?: string;
  }>;
}

/**
 * Step 파라미터 파싱 및 유효성 검증
 */
function parseStepNumber(stepParam: string | undefined): number {
  if (!stepParam) return 1; // 기본값

  const parsed = parseInt(stepParam, 10);

  // 유효한 범위 체크 (1~10만 허용)
  if (isNaN(parsed) || parsed < 1 || parsed > 10) {
    console.warn(`[Report Page] Invalid step param: ${stepParam}, falling back to 1`);
    return 1;
  }

  return parsed;
}

/**
 * 리포트 데이터 조회 (Server Side)
 */
async function getReportData(
  prospectId: string,
  stepNumber: number
): Promise<ReportData | null> {
  try {
    const supabase = createClerkSupabaseClient();
    console.log(`[Report Page] Fetching report: prospect=${prospectId}, step=${stepNumber}`);

    const { data, error } = await supabase
      .from('generated_emails')
      .select('id, prospect_id, step_number, report_markdown, theme, target_type, issuing_company, created_at')
      .eq('prospect_id', prospectId)
      .eq('step_number', stepNumber)
      .single();

    if (error) {
      console.error('[Report Page] Supabase error:', error.message);
      return null;
    }

    if (!data) {
      console.warn('[Report Page] No data found');
      return null;
    }

    console.log(`[Report Page] Report found: ${data.id}, theme: ${data.theme}`);
    return data as ReportData;
  } catch (err) {
    console.error('[Report Page] Unexpected error:', err);
    return null;
  }
}

/**
 * 리포트 뷰어 페이지
 */
export default async function ReportPage({ params, searchParams }: ReportPageProps) {
  const { prospect_id } = await params;
  const { step } = await searchParams;

  // Step 파라미터 파싱
  const stepNumber = parseStepNumber(step);

  console.log(`[Report Page] Loading: prospect_id=${prospect_id}, step=${stepNumber}`);

  // 리포트 데이터 조회
  const reportData = await getReportData(prospect_id, stepNumber);

  // 데이터가 없으면 에러 페이지 표시
  if (!reportData) {
    return <ReportNotFound prospectId={prospect_id} stepNumber={stepNumber} />;
  }

  return <ReportViewer reportData={reportData} />;
}

/**
 * 메타데이터 생성 (SEO 및 공유 최적화)
 */
export async function generateMetadata({ params, searchParams }: ReportPageProps): Promise<Metadata> {
  const { prospect_id } = await params;
  const { step } = await searchParams;

  const stepNumber = parseStepNumber(step);
  const reportData = await getReportData(prospect_id, stepNumber);

  if (!reportData) {
    return {
      title: '리포트를 찾을 수 없습니다 | LinkPitch',
      description: '요청하신 리포트가 존재하지 않습니다.',
    };
  }

  return {
    title: `Step ${reportData.step_number} 리포트: ${reportData.theme} | LinkPitch`,
    description: `${reportData.target_type} 타겟 - LinkPitch AI 분석 리포트`,
    openGraph: {
      title: `Step ${reportData.step_number} 리포트: ${reportData.theme}`,
      description: `${reportData.target_type} 타겟 - LinkPitch AI 분석 리포트`,
      type: 'article',
    },
  };
}
