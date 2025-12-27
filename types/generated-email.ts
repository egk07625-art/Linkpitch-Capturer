/**
 * @file generated-email.ts
 * @description Generated Email 관련 타입 정의
 *
 * 생성된 이메일 및 리포트를 나타내는 타입 정의
 * Supabase generated_emails 테이블 스키마를 기반으로 작성됨
 */

import type { Tier } from './prospect';

/**
 * Generated Email 상태 타입
 * DB CHECK 제약조건: 'pending', 'sent', 'opened', 'clicked', 'failed'만 허용
 */
export type GeneratedEmailStatus = 'pending' | 'sent' | 'opened' | 'clicked' | 'failed';

/**
 * Target Type 타입
 */
export type TargetType = 'solopreneur' | 'corporate' | string;

/**
 * Email Subjects JSONB 구조
 * 5가지 유형 x 2개씩 = 10개의 제목
 */
export interface EmailSubjects {
  [key: string]: string;
}

/**
 * Generated Email 타입
 * Supabase generated_emails 테이블 스키마를 기반으로 작성
 */
export interface GeneratedEmail {
  /** 고유 ID (UUID) */
  id: string;
  /** Prospect ID (prospects 테이블 참조) */
  prospect_id?: string;
  /** 사용자 ID (users 테이블 참조) */
  user_id?: string;
  /** Step 번호 (1-10) */
  step_number: number;
  /** 테마 */
  theme: string;
  /** 대상 타입 */
  target_type: TargetType;
  /** 리포트 HTML (발송용 - 디자인 적용) */
  report_html: string;
  /** 리포트 HTML (편집용 - 순수 본문) */
  report_html_editable: string;
  /** 리포트 마크다운 (편집용) */
  report_markdown?: string;
  /** 스토어명 */
  store_name: string;
  /** 카테고리 */
  category: string;
  /** 티어 */
  tier?: Tier;
  /** 이메일 본문 (솔로프레너용) */
  email_body_solopreneur?: string;
  /** 이메일 본문 (기업용) */
  email_body_corporate?: string;
  /** 이메일 제목들 (JSONB) */
  email_subjects: EmailSubjects;
  /** 상태 */
  status: GeneratedEmailStatus;
  /** 발송 시간 */
  sent_at?: string;
  /** 열람 시간 */
  opened_at?: string;
  /** 클릭 시간 */
  clicked_at?: string;
  /** 생성 일시 */
  created_at: string;
  /** 수정 일시 */
  updated_at: string;
}

/**
 * Generated Email 생성 요청 타입
 */
export interface CreateGeneratedEmailInput {
  prospect_id?: string;
  user_id?: string;
  step_number: number;
  theme: string;
  target_type: TargetType;
  report_html?: string;
  report_html_editable?: string;
  store_name?: string;
  category?: string;
  tier?: Tier;
  email_body_solopreneur?: string;
  email_body_corporate?: string;
  email_subjects?: EmailSubjects;
  status?: GeneratedEmailStatus;
}

/**
 * Generated Email 업데이트 요청 타입
 */
export interface UpdateGeneratedEmailInput {
  report_html?: string;
  report_html_editable?: string;
  report_markdown?: string;
  store_name?: string;
  category?: string;
  tier?: Tier;
  email_body_solopreneur?: string;
  email_body_corporate?: string;
  email_subjects?: EmailSubjects;
  status?: GeneratedEmailStatus;
  sent_at?: string;
  opened_at?: string;
  clicked_at?: string;
}

