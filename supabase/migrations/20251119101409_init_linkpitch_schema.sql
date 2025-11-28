-- ================================================================
-- LinkPitch MVP v6.3.1 Database Schema (Fixed)
-- Fix: 'prospect_id' column added to 'step' table for Timeline Index
-- ================================================================

-- [1] 초기화 (기존 테이블 안전하게 삭제)
DROP TABLE IF EXISTS report_tracking_logs CASCADE;
DROP TABLE IF EXISTS step CASCADE;
DROP TABLE IF EXISTS step_templates CASCADE;
DROP TABLE IF EXISTS sequences CASCADE;
DROP TABLE IF EXISTS user_assets CASCADE;
DROP TABLE IF EXISTS prospects CASCADE;
DROP TABLE IF EXISTS site_analysis_cache CASCADE;
DROP TABLE IF EXISTS user_plans CASCADE;
DROP TABLE IF EXISTS plans CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- [2] 유틸리티 함수 (자동 시간 갱신)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- [3] 기본 인프라 테이블 (유저, 결제, 캐시, 자산)
-- ================================================================

-- 👤 Users
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    clerk_id TEXT NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uq_users_clerk_id UNIQUE (clerk_id)
);

-- 💳 Plans
CREATE TABLE plans (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    monthly_quota INT NOT NULL,
    price_krw INT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    CONSTRAINT pk_plans PRIMARY KEY (id)
);

CREATE TABLE user_plans (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    user_id UUID NOT NULL,
    plan_id UUID NOT NULL,
    is_current BOOLEAN DEFAULT true,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    CONSTRAINT pk_user_plans PRIMARY KEY (id),
    CONSTRAINT fk_user_plans_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_plans_plan FOREIGN KEY (plan_id) REFERENCES plans(id)
);

-- 🧠 Site Analysis Cache
CREATE TABLE site_analysis_cache (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    url_hash TEXT NOT NULL,
    url TEXT NOT NULL,
    full_screenshot_url TEXT NOT NULL,
    vision_data JSONB NOT NULL,
    analyzed_at TIMESTAMPTZ DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    access_count INT DEFAULT 1,
    CONSTRAINT pk_site_analysis_cache PRIMARY KEY (id),
    CONSTRAINT uq_site_analysis_url_hash UNIQUE (url_hash)
);

-- 🗂 User Assets
CREATE TABLE user_assets (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    user_id UUID NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT pk_user_assets PRIMARY KEY (id),
    CONSTRAINT fk_user_assets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ================================================================
-- [4] 핵심 비즈니스 테이블 (고객사, 시퀀스, 스텝)
-- ================================================================

-- 🏢 Prospects (고객사 CRM)
CREATE TABLE prospects (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    user_id UUID NOT NULL,
    cache_id UUID NOT NULL, 
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    contact_email VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    memo TEXT,
    crm_status VARCHAR(50) DEFAULT 'cold' NOT NULL, 
    max_scroll_depth INT DEFAULT 0, 
    max_duration_seconds INT DEFAULT 0,
    visit_count INT DEFAULT 0,
    last_activity_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT pk_prospects PRIMARY KEY (id),
    CONSTRAINT fk_prospects_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_prospects_cache FOREIGN KEY (cache_id) REFERENCES site_analysis_cache(id) ON DELETE RESTRICT,
    CONSTRAINT chk_prospects_crm_status CHECK (crm_status IN ('cold', 'warm', 'hot'))
);

-- 🔄 Sequences
CREATE TABLE sequences (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    user_id UUID NOT NULL,
    prospect_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    persona_type VARCHAR(50) DEFAULT 'researcher' NOT NULL,
    sequence_type VARCHAR(100) DEFAULT '5_steps' NOT NULL,
    total_steps INT DEFAULT 5 NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT pk_sequences PRIMARY KEY (id),
    CONSTRAINT fk_sequences_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_sequences_prospect FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE CASCADE
);

-- 📧 Step (수정된 부분: prospect_id 추가됨)
CREATE TABLE step (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    user_id UUID NOT NULL,
    sequence_id UUID NOT NULL,
    
    -- 🚨 [FIXED] 에러 원인 해결: prospect_id 컬럼 추가
    prospect_id UUID NOT NULL, 
    
    step_number INT NOT NULL,
    
    -- 콘텐츠
    email_subject VARCHAR(255), 
    email_body TEXT, 
    report_data JSONB, 
    
    -- 첨부파일
    attachments JSONB DEFAULT '[]'::jsonb, 
    
    -- 상태
    status VARCHAR(50) DEFAULT 'pending' NOT NULL,
    sent_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT pk_step PRIMARY KEY (id),
    CONSTRAINT fk_step_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_step_sequence FOREIGN KEY (sequence_id) REFERENCES sequences(id) ON DELETE CASCADE,
    
    -- 🚨 [FIXED] FK 연결 추가
    CONSTRAINT fk_step_prospect FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE CASCADE,
    
    CONSTRAINT uq_step_sequence_number UNIQUE (sequence_id, step_number),
    CONSTRAINT chk_step_number CHECK (step_number BETWEEN 1 AND 5),
    CONSTRAINT chk_step_status CHECK (status IN ('pending', 'sent'))
);

-- 🚀 [타임라인 인덱스] 이제 prospect_id가 있어서 에러 안 남
CREATE INDEX idx_step_timeline ON step(prospect_id, status, sent_at DESC);

-- ================================================================
-- [5] 템플릿 및 로그
-- ================================================================

-- 📋 Step Templates
CREATE TABLE step_templates (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    step_number INT NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    description TEXT,
    timeline_day INT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT pk_step_templates PRIMARY KEY (id),
    CONSTRAINT uq_step_templates_number UNIQUE (step_number)
);

INSERT INTO step_templates (step_number, step_name, description, timeline_day) VALUES
(1, 'Diagnosis', '약점 지적 및 주의 환기 (Hook)', 1),
(2, 'Cost Saving', '비용 낭비 공포 자극 (Pain)', 3),
(3, 'Visual', '썸네일/상세페이지 개선 제안 (Solution)', 6),
(4, 'FOMO', '시즌 이슈 및 경쟁사 선점 경고 (Fear)', 10),
(5, 'Summary', '마무리 및 통합 리포트 제공 (Close)', 14);

-- 📊 Report Tracking Logs
CREATE TABLE report_tracking_logs (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    prospect_id UUID NOT NULL,
    session_id UUID NOT NULL,
    scroll_depth INT DEFAULT 0,
    duration_seconds INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT pk_report_tracking_logs PRIMARY KEY (id),
    CONSTRAINT fk_report_logs_prospect FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE CASCADE
);

-- ================================================================
-- [6] 자동화 트리거
-- ================================================================

-- 🔥 CRM 상태 자동 판별 함수
CREATE OR REPLACE FUNCTION update_prospect_status()
RETURNS TRIGGER AS $$
DECLARE
    current_scroll INT;
    current_duration INT;
    new_status VARCHAR(50);
BEGIN
    SELECT GREATEST(max_scroll_depth, NEW.scroll_depth), 
           GREATEST(max_duration_seconds, NEW.duration_seconds)
    INTO current_scroll, current_duration
    FROM prospects
    WHERE id = NEW.prospect_id;

    IF current_scroll >= 80 AND current_duration >= 30 THEN
        new_status := 'hot';
    ELSIF current_scroll >= 50 OR current_duration >= 15 THEN
        new_status := 'warm';
    ELSE
        new_status := 'cold';
    END IF;

    UPDATE prospects
    SET 
        max_scroll_depth = current_scroll,
        max_duration_seconds = current_duration,
        last_activity_at = NOW(),
        crm_status = CASE 
            WHEN crm_status = 'hot' THEN 'hot'
            WHEN new_status = 'hot' THEN 'hot' 
            WHEN crm_status = 'warm' AND new_status = 'cold' THEN 'warm'
            ELSE new_status
        END
    WHERE id = NEW.prospect_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_update_status AFTER INSERT ON report_tracking_logs FOR EACH ROW EXECUTE FUNCTION update_prospect_status();

-- Updated At 자동 갱신
CREATE TRIGGER trg_users_update BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_prospects_update BEFORE UPDATE ON prospects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_sequences_update BEFORE UPDATE ON sequences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_step_update BEFORE UPDATE ON step FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 캐시 갱신
CREATE OR REPLACE FUNCTION update_cache_access()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE site_analysis_cache SET last_accessed_at = NOW(), access_count = access_count + 1 WHERE id = NEW.cache_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_prospects_cache_access AFTER INSERT ON prospects FOR EACH ROW EXECUTE FUNCTION update_cache_access();

-- [7] 초기 데이터
INSERT INTO plans (code, name, monthly_quota, price_krw) VALUES
('free', 'Free', 3, 0), ('starter', 'Starter', 30, 49000), ('pro', 'Pro', 100, 149000);

DO $$ BEGIN RAISE NOTICE '✅ LinkPitch MVP v6.3.1 (Fixed) Schema Loaded successfully!'; END $$;