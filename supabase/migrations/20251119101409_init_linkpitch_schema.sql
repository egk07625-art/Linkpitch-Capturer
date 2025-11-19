-- ================================================
-- Supabase SQL Editor용 스키마 스크립트
-- ================================================
-- 주의: 이 스크립트는 기존 테이블을 모두 삭제합니다 (개발용)
-- 프로덕션 환경에서는 주의해서 사용하세요
-- ================================================

-- 기존 테이블 삭제 (의존성 역순)
DROP TABLE IF EXISTS user_plans CASCADE;
DROP TABLE IF EXISTS generation_logs CASCADE;
DROP TABLE IF EXISTS report_events CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS step_drafts CASCADE;
DROP TABLE IF EXISTS step CASCADE;
DROP TABLE IF EXISTS sequences CASCADE;
DROP TABLE IF EXISTS prospects CASCADE;
DROP TABLE IF EXISTS plans CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 기존 함수 삭제
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ================================================
-- updated_at 자동 업데이트 함수 및 트리거
-- ================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 테이블 생성
-- ================================================

-- users 테이블
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    clerk_id TEXT NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uq_users_clerk_id UNIQUE (clerk_id),
    CONSTRAINT uq_users_email UNIQUE (email)
);

COMMENT ON TABLE users IS '사용자 정보';
COMMENT ON COLUMN users.id IS '사용자 고유 ID';
COMMENT ON COLUMN users.clerk_id IS 'Clerk 인증 ID';
COMMENT ON COLUMN users.email IS '사용자 이메일';
COMMENT ON COLUMN users.name IS '사용자 이름';
COMMENT ON COLUMN users.created_at IS '가입일시';
COMMENT ON COLUMN users.updated_at IS '수정일시';

-- plans 테이블
CREATE TABLE plans (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    monthly_quota INT NOT NULL,
    price_krw INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT pk_plans PRIMARY KEY (id),
    CONSTRAINT uq_plans_code UNIQUE (code)
);

COMMENT ON TABLE plans IS '요금제 정보';
COMMENT ON COLUMN plans.code IS '플랜 코드';
COMMENT ON COLUMN plans.name IS '플랜명';
COMMENT ON COLUMN plans.description IS '플랜 설명';
COMMENT ON COLUMN plans.monthly_quota IS '월 발송 한도';
COMMENT ON COLUMN plans.price_krw IS '월 가격(원)';
COMMENT ON COLUMN plans.is_active IS '활성화 여부';
COMMENT ON COLUMN plans.created_at IS '생성일시';

-- prospects 테이블
CREATE TABLE prospects (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    contact_email VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    memo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT pk_prospects PRIMARY KEY (id),
    CONSTRAINT fk_prospects_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE
);

COMMENT ON TABLE prospects IS '잠재 고객사 정보';
COMMENT ON COLUMN prospects.id IS '고객사 ID';
COMMENT ON COLUMN prospects.user_id IS '사용자 고유 ID';
COMMENT ON COLUMN prospects.name IS '회사명/스토어명';
COMMENT ON COLUMN prospects.contact_name IS '담당자 이름';
COMMENT ON COLUMN prospects.contact_email IS '담당자 이메일';
COMMENT ON COLUMN prospects.url IS '웹사이트 URL';
COMMENT ON COLUMN prospects.memo IS '메모';
COMMENT ON COLUMN prospects.created_at IS '생성일시';
COMMENT ON COLUMN prospects.updated_at IS '수정일시';

-- sequences 테이블
CREATE TABLE sequences (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    user_id UUID NOT NULL,
    prospect_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    sequence_type VARCHAR(100) NOT NULL,
    total_steps INT,
    current_step INT DEFAULT 0 NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT pk_sequences PRIMARY KEY (id),
    CONSTRAINT fk_sequences_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_sequences_prospect FOREIGN KEY (prospect_id) 
        REFERENCES prospects(id) ON DELETE CASCADE,
    CONSTRAINT chk_sequences_status CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled'))
);

COMMENT ON TABLE sequences IS '이메일 시퀀스(캠페인) 정보';
COMMENT ON COLUMN sequences.id IS '시퀀스 ID';
COMMENT ON COLUMN sequences.user_id IS '사용자 고유 ID';
COMMENT ON COLUMN sequences.prospect_id IS '고객사 ID';
COMMENT ON COLUMN sequences.name IS '캠페인명';
COMMENT ON COLUMN sequences.sequence_type IS '시퀀스 타입';
COMMENT ON COLUMN sequences.total_steps IS '총 스텝 수';
COMMENT ON COLUMN sequences.current_step IS '현재 스텝';
COMMENT ON COLUMN sequences.status IS '상태 (draft, active, paused, completed, cancelled)';
COMMENT ON COLUMN sequences.created_at IS '생성일시';
COMMENT ON COLUMN sequences.updated_at IS '수정일시';

-- step 테이블
CREATE TABLE step (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    user_id UUID NOT NULL,
    sequence_id UUID NOT NULL,
    step_number INT NOT NULL,
    step_type VARCHAR(100),
    email_subject VARCHAR(255),
    email_body TEXT,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL,
    recommended_send_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    is_replied BOOLEAN DEFAULT false NOT NULL,
    replied_at TIMESTAMPTZ,
    has_clicked_report BOOLEAN DEFAULT false NOT NULL,
    report_engagement_level VARCHAR(50) DEFAULT 'none' NOT NULL,
    last_report_view_seconds INT,
    last_report_scroll_depth INT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT pk_step PRIMARY KEY (id),
    CONSTRAINT fk_step_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_step_sequence FOREIGN KEY (sequence_id) 
        REFERENCES sequences(id) ON DELETE CASCADE,
    CONSTRAINT uq_step_sequence_number UNIQUE (sequence_id, step_number),
    CONSTRAINT chk_step_status CHECK (status IN ('pending', 'scheduled', 'sent', 'failed', 'cancelled')),
    CONSTRAINT chk_step_engagement_level CHECK (report_engagement_level IN ('none', 'low', 'medium', 'high'))
);

COMMENT ON TABLE step IS '이메일 발송 스텝 정보';
COMMENT ON COLUMN step.id IS '스텝 ID';
COMMENT ON COLUMN step.user_id IS '사용자 고유 ID';
COMMENT ON COLUMN step.sequence_id IS '시퀀스 ID';
COMMENT ON COLUMN step.step_number IS '스텝 번호';
COMMENT ON COLUMN step.step_type IS '스텝 타입';
COMMENT ON COLUMN step.email_subject IS '이메일 제목';
COMMENT ON COLUMN step.email_body IS '이메일 본문';
COMMENT ON COLUMN step.status IS '상태 (pending, scheduled, sent, failed, cancelled)';
COMMENT ON COLUMN step.recommended_send_at IS '권장 발송시간';
COMMENT ON COLUMN step.sent_at IS '실제 발송시간';
COMMENT ON COLUMN step.is_replied IS '답장 여부';
COMMENT ON COLUMN step.replied_at IS '답장 시간';
COMMENT ON COLUMN step.has_clicked_report IS '리포트 클릭 여부';
COMMENT ON COLUMN step.report_engagement_level IS '참여도 레벨 (none, low, medium, high)';
COMMENT ON COLUMN step.last_report_view_seconds IS '리포트 본 시간(초)';
COMMENT ON COLUMN step.last_report_scroll_depth IS '스크롤 깊이(%)';
COMMENT ON COLUMN step.created_at IS '생성일시';
COMMENT ON COLUMN step.updated_at IS '수정일시';

-- step_drafts 테이블
CREATE TABLE step_drafts (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    user_id UUID NOT NULL,
    sequence_id UUID NOT NULL,
    prospect_id UUID NOT NULL,
    step_number INT NOT NULL,
    step_type VARCHAR(100),
    version_number INT NOT NULL,
    email_subject VARCHAR(255),
    email_body TEXT,
    insights_json JSON,
    report_json JSON,
    is_selected BOOLEAN DEFAULT false NOT NULL,
    selected_at TIMESTAMPTZ,
    generation_log_id UUID,
    input_payload JSON,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT pk_step_drafts PRIMARY KEY (id),
    CONSTRAINT fk_step_drafts_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_step_drafts_sequence FOREIGN KEY (sequence_id) 
        REFERENCES sequences(id) ON DELETE CASCADE,
    CONSTRAINT fk_step_drafts_prospect FOREIGN KEY (prospect_id) 
        REFERENCES prospects(id) ON DELETE CASCADE,
    CONSTRAINT uq_step_drafts_version UNIQUE (sequence_id, step_number, version_number)
);

COMMENT ON TABLE step_drafts IS '스텝 초안 버전 관리';
COMMENT ON COLUMN step_drafts.id IS '초안 ID';
COMMENT ON COLUMN step_drafts.user_id IS '사용자 고유 ID';
COMMENT ON COLUMN step_drafts.sequence_id IS '시퀀스 ID';
COMMENT ON COLUMN step_drafts.prospect_id IS '고객사 ID';
COMMENT ON COLUMN step_drafts.step_number IS '스텝 번호';
COMMENT ON COLUMN step_drafts.step_type IS '스텝 타입';
COMMENT ON COLUMN step_drafts.version_number IS '버전 번호';
COMMENT ON COLUMN step_drafts.email_subject IS '이메일 제목';
COMMENT ON COLUMN step_drafts.email_body IS '이메일 본문';
COMMENT ON COLUMN step_drafts.insights_json IS 'AI 인사이트 데이터';
COMMENT ON COLUMN step_drafts.report_json IS '분석 리포트 데이터';
COMMENT ON COLUMN step_drafts.is_selected IS '선택 여부';
COMMENT ON COLUMN step_drafts.selected_at IS '선택한 시간';
COMMENT ON COLUMN step_drafts.generation_log_id IS '생성 로그 ID';
COMMENT ON COLUMN step_drafts.input_payload IS '생성 입력 데이터';
COMMENT ON COLUMN step_drafts.expires_at IS '만료 시간';
COMMENT ON COLUMN step_drafts.created_at IS '생성일시';
COMMENT ON COLUMN step_drafts.updated_at IS '수정일시';

-- reports 테이블
CREATE TABLE reports (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    user_id UUID NOT NULL,
    step_id UUID NOT NULL,
    report_json JSON NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT pk_reports PRIMARY KEY (id),
    CONSTRAINT fk_reports_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_reports_step FOREIGN KEY (step_id) 
        REFERENCES step(id) ON DELETE CASCADE
);

COMMENT ON TABLE reports IS '분석 리포트';
COMMENT ON COLUMN reports.id IS '리포트 ID';
COMMENT ON COLUMN reports.user_id IS '사용자 고유 ID';
COMMENT ON COLUMN reports.step_id IS '스텝 ID';
COMMENT ON COLUMN reports.report_json IS '리포트 JSON 데이터';
COMMENT ON COLUMN reports.created_at IS '생성일시';
COMMENT ON COLUMN reports.updated_at IS '수정일시';

-- report_events 테이블
CREATE TABLE report_events (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    user_id UUID NOT NULL,
    step_id UUID NOT NULL,
    report_id UUID NOT NULL,
    dwell_seconds INT,
    scroll_depth INT,
    interacted BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT pk_report_events PRIMARY KEY (id),
    CONSTRAINT fk_report_events_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_report_events_step FOREIGN KEY (step_id) 
        REFERENCES step(id) ON DELETE CASCADE,
    CONSTRAINT fk_report_events_report FOREIGN KEY (report_id) 
        REFERENCES reports(id) ON DELETE CASCADE
);

COMMENT ON TABLE report_events IS '리포트 조회 이벤트';
COMMENT ON COLUMN report_events.id IS '이벤트 ID';
COMMENT ON COLUMN report_events.user_id IS '사용자 고유 ID';
COMMENT ON COLUMN report_events.step_id IS '스텝 ID';
COMMENT ON COLUMN report_events.report_id IS '리포트 ID';
COMMENT ON COLUMN report_events.dwell_seconds IS '머문 시간(초)';
COMMENT ON COLUMN report_events.scroll_depth IS '스크롤 깊이(%)';
COMMENT ON COLUMN report_events.interacted IS '상호작용 여부';
COMMENT ON COLUMN report_events.created_at IS '이벤트 발생 시간';

-- generation_logs 테이블
CREATE TABLE generation_logs (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    user_id UUID NOT NULL,
    prospect_id UUID NOT NULL,
    step_id UUID NOT NULL,
    step_type VARCHAR(100),
    input_payload JSON NOT NULL,
    output_insights JSON,
    output_email_subject VARCHAR(255),
    output_email_body TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT pk_generation_logs PRIMARY KEY (id),
    CONSTRAINT fk_generation_logs_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_generation_logs_prospect FOREIGN KEY (prospect_id) 
        REFERENCES prospects(id) ON DELETE CASCADE,
    CONSTRAINT fk_generation_logs_step FOREIGN KEY (step_id) 
        REFERENCES step(id) ON DELETE CASCADE
);

COMMENT ON TABLE generation_logs IS 'AI 생성 로그';
COMMENT ON COLUMN generation_logs.id IS '로그 ID';
COMMENT ON COLUMN generation_logs.user_id IS '사용자 고유 ID';
COMMENT ON COLUMN generation_logs.prospect_id IS '고객사 ID';
COMMENT ON COLUMN generation_logs.step_id IS '스텝 ID';
COMMENT ON COLUMN generation_logs.step_type IS '스텝 타입';
COMMENT ON COLUMN generation_logs.input_payload IS 'AI 입력 데이터';
COMMENT ON COLUMN generation_logs.output_insights IS 'AI 출력 인사이트';
COMMENT ON COLUMN generation_logs.output_email_subject IS '생성된 이메일 제목';
COMMENT ON COLUMN generation_logs.output_email_body IS '생성된 이메일 본문';
COMMENT ON COLUMN generation_logs.created_at IS '생성일시';

-- user_plans 테이블
CREATE TABLE user_plans (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    user_id UUID NOT NULL,
    plan_id UUID NOT NULL,
    is_current BOOLEAN DEFAULT true NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    ended_at TIMESTAMPTZ,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT pk_user_plans PRIMARY KEY (id),
    CONSTRAINT fk_user_plans_user FOREIGN KEY (user_id) 
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_plans_plan FOREIGN KEY (plan_id) 
        REFERENCES plans(id) ON DELETE RESTRICT
);

COMMENT ON TABLE user_plans IS '사용자 구독 이력';
COMMENT ON COLUMN user_plans.id IS '구독 기록 ID';
COMMENT ON COLUMN user_plans.user_id IS '사용자 고유 ID';
COMMENT ON COLUMN user_plans.plan_id IS '플랜 ID';
COMMENT ON COLUMN user_plans.is_current IS '현재 활성 플랜 여부';
COMMENT ON COLUMN user_plans.started_at IS '구독 시작일';
COMMENT ON COLUMN user_plans.ended_at IS '구독 종료일';
COMMENT ON COLUMN user_plans.note IS '비고';
COMMENT ON COLUMN user_plans.created_at IS '생성일시';
COMMENT ON COLUMN user_plans.updated_at IS '수정일시';

-- ================================================
-- 인덱스 생성
-- ================================================

-- users 테이블 인덱스
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_created_at ON users(created_at);

-- prospects 테이블 인덱스
CREATE INDEX idx_prospects_user_id ON prospects(user_id);
CREATE INDEX idx_prospects_contact_email ON prospects(contact_email);
CREATE INDEX idx_prospects_user_created ON prospects(user_id, created_at);

-- sequences 테이블 인덱스
CREATE INDEX idx_sequences_user_id ON sequences(user_id);
CREATE INDEX idx_sequences_prospect_id ON sequences(prospect_id);
CREATE INDEX idx_sequences_status ON sequences(status);
CREATE INDEX idx_sequences_user_status ON sequences(user_id, status);
CREATE INDEX idx_sequences_created_at ON sequences(created_at);

-- step 테이블 인덱스
CREATE INDEX idx_step_user_id ON step(user_id);
CREATE INDEX idx_step_sequence_id ON step(sequence_id);
CREATE INDEX idx_step_status ON step(status);
CREATE INDEX idx_step_sent_at ON step(sent_at);
CREATE INDEX idx_step_recommended_send_at ON step(recommended_send_at);
CREATE INDEX idx_step_sequence_number ON step(sequence_id, step_number);
CREATE INDEX idx_step_replied ON step(is_replied, replied_at);

-- step_drafts 테이블 인덱스
CREATE INDEX idx_step_drafts_user_id ON step_drafts(user_id);
CREATE INDEX idx_step_drafts_sequence_id ON step_drafts(sequence_id);
CREATE INDEX idx_step_drafts_prospect_id ON step_drafts(prospect_id);
CREATE INDEX idx_step_drafts_is_selected ON step_drafts(is_selected);
CREATE INDEX idx_step_drafts_expires_at ON step_drafts(expires_at);
CREATE INDEX idx_step_drafts_sequence_step ON step_drafts(sequence_id, step_number);

-- reports 테이블 인덱스
CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_step_id ON reports(step_id);
CREATE INDEX idx_reports_created_at ON reports(created_at);

-- report_events 테이블 인덱스
CREATE INDEX idx_report_events_user_id ON report_events(user_id);
CREATE INDEX idx_report_events_step_id ON report_events(step_id);
CREATE INDEX idx_report_events_report_id ON report_events(report_id);
CREATE INDEX idx_report_events_created_at ON report_events(created_at);

-- generation_logs 테이블 인덱스
CREATE INDEX idx_generation_logs_user_id ON generation_logs(user_id);
CREATE INDEX idx_generation_logs_prospect_id ON generation_logs(prospect_id);
CREATE INDEX idx_generation_logs_step_id ON generation_logs(step_id);
CREATE INDEX idx_generation_logs_created_at ON generation_logs(created_at);

-- user_plans 테이블 인덱스
CREATE INDEX idx_user_plans_user_id ON user_plans(user_id);
CREATE INDEX idx_user_plans_plan_id ON user_plans(plan_id);
CREATE INDEX idx_user_plans_is_current ON user_plans(user_id, is_current);
CREATE INDEX idx_user_plans_started_at ON user_plans(started_at);

-- plans 테이블 인덱스
CREATE INDEX idx_plans_code ON plans(code);
CREATE INDEX idx_plans_is_active ON plans(is_active);

-- ================================================
-- updated_at 트리거 적용
-- ================================================

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_prospects_updated_at
    BEFORE UPDATE ON prospects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_sequences_updated_at
    BEFORE UPDATE ON sequences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_step_updated_at
    BEFORE UPDATE ON step
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_step_drafts_updated_at
    BEFORE UPDATE ON step_drafts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_user_plans_updated_at
    BEFORE UPDATE ON user_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
