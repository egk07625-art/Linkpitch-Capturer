/**
 * @file reports.ts
 * @description Report 관련 Server Actions
 *
 * 리포트 이벤트 로깅을 위한 Server Actions
 * PRD.md의 report_events 테이블과 연동
 */

'use server';

import type { ReportEvent, CreateReportEventInput } from '@/types/report';

/**
 * 리포트 이벤트 생성 및 CRM 상태 업데이트
 * 
 * PRD.md에 따르면:
 * - 'dwell_10s' 이벤트 발생 시 prospect의 crm_status를 'warm'으로 업데이트
 * - 'scroll_60' 이벤트 발생 시 prospect의 crm_status를 'hot'으로 업데이트
 */
export async function createReportEvent(
  _input: CreateReportEventInput
): Promise<ReportEvent> {
  // const supabase = await createClerkSupabaseClient();
  
  // TODO: report_events 테이블에 이벤트 기록
  // TODO: 이벤트 타입에 따라 prospect의 crm_status 업데이트
  // if (_input.event_type === 'dwell_10s') {
  //   await updateProspect(_input.prospect_id, { crm_status: 'warm' });
  // } else if (_input.event_type === 'scroll_60') {
  //   await updateProspect(_input.prospect_id, { crm_status: 'hot' });
  // }
  
  throw new Error('Not implemented');
}
