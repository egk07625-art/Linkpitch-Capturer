/**
 * @file step-template.ts
 * @description Step Template 관련 타입 정의
 *
 * 이메일 스텝 템플릿 관련 타입 정의
 * PRD.md의 step_templates 테이블 스키마를 기반으로 작성됨
 */

/**
 * Step Template 타입
 * Supabase step_templates 테이블 스키마를 기반으로 작성
 */
export interface StepTemplate {
  /** 고유 ID (UUID) */
  id: string;
  /** 스텝 순서 (1 이상) */
  step_number: number;
  /** 스텝 이름 */
  step_name: string;
  /** 템플릿 설명 */
  description?: string;
  /** 타임라인 일수 */
  timeline_day?: number;
  /** 생성 일시 */
  created_at: string;
}

/**
 * Step Template 조회 요청 타입
 */
export interface GetStepTemplateInput {
  step_number: number;
}

/**
 * 모든 Step Template 조회 결과 타입
 */
export type StepTemplates = StepTemplate[];






