/**
 * @file sequence.ts
 * @description Sequence 관련 타입 정의
 *
 * 시퀀스(메일 발송 시퀀스) 관련 타입 정의
 */

/**
 * 시퀀스 타입
 * PRD 기준: '9_steps'로 고정
 */
export type SequenceType = "9_steps";

/**
 * 시퀀스 상태 타입
 */
export type SequenceStatus = "draft" | "active" | "completed" | "paused";

/**
 * Sequence 타입
 * PRD.md의 sequences 테이블 스키마를 기반으로 작성
 */
export interface Sequence {
  /** 고유 ID (UUID) */
  id: string;
  /** 사용자 ID (users 테이블 참조) */
  user_id: string;
  /** Prospect ID (prospects 테이블 참조) */
  prospect_id: string;
  /** 시퀀스명 */
  name: string;
  /** 시퀀스 타입 (PRD 기준: '9_steps') */
  sequence_type: SequenceType;
  /** 총 스텝 수 */
  total_steps: number;
  /** 현재 스텝 */
  current_step: number;
  /** 나만의 무기 (Custom Context) */
  custom_context?: string;
  /** 상태 */
  status: SequenceStatus;
  /** 생성 일시 */
  created_at: string;
  /** 수정 일시 */
  updated_at: string;
}

/**
 * Sequence 생성 요청 타입
 */
export interface CreateSequenceInput {
  prospect_id: string;
  name?: string;
  sequence_type?: SequenceType;
  total_steps?: number;
  custom_context?: string;
}

/**
 * Sequence 업데이트 요청 타입
 */
export interface UpdateSequenceInput {
  name?: string;
  current_step?: number;
  status?: SequenceStatus;
  custom_context?: string;
}
















