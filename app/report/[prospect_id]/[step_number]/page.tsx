/**
 * @file app/report/[prospect_id]/[step_number]/page.tsx
 * @description 리포트 뷰어 페이지
 *
 * n8n에서 생성된 HTML 리포트를 공개 링크로 제공합니다.
 * URL: /report/[prospect_id]/[step_number]
 */

import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { ReportViewer } from '@/components/report/ReportViewer';
import type { ReportData } from '@/types/report-viewer';

interface ReportPageProps {
  params: Promise<{
    prospect_id: string;
    step_number: string;
  }>;
}

/**
 * 리포트 데이터 조회
 */
async function getReportData(
  prospectId: string,
  stepNumber: string
): Promise<ReportData | null> {
  try {
    const stepNum = parseInt(stepNumber, 10);
    
    if (isNaN(stepNum) || stepNum < 1) {
      return null;
    }

    const { data, error } = await supabase
      .from('generated_emails')
      .select('id, prospect_id, step_number, report_html, theme, target_type, created_at')
      .eq('prospect_id', prospectId)
      .eq('step_number', stepNum)
      .single();

    if (error || !data) {
      console.error('리포트 조회 실패:', error);
      return null;
    }

    return data as ReportData;
  } catch (err) {
    console.error('리포트 조회 중 예외 발생:', err);
    return null;
  }
}

/**
 * 리포트 뷰어 페이지
 */
export default async function ReportPage({ params }: ReportPageProps) {
  const { prospect_id, step_number } = await params;

  const reportData = await getReportData(prospect_id, step_number);

  if (!reportData) {
    notFound();
  }

  return <ReportViewer reportData={reportData} />;
}

/**
 * 메타데이터 생성 (SEO 및 공유 최적화)
 */
export async function generateMetadata({ params }: ReportPageProps) {
  const { prospect_id, step_number } = await params;
  
  const reportData = await getReportData(prospect_id, step_number);

  return {
    title: reportData 
      ? `리포트 - Step ${reportData.step_number}: ${reportData.theme}`
      : '리포트를 찾을 수 없습니다',
    description: reportData?.target_type 
      ? `${reportData.target_type} 타겟 리포트`
      : 'LinkPitch 리포트 뷰어',
  };
}

