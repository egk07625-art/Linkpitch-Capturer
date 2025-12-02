-- ================================================================
-- LinkPitch MVP v7.6 - PART 1/2: 테이블 생성
-- ================================================================

-- [1] 초기화 (순서대로 삭제)
DROP TABLE IF EXISTS generated_emails CASCADE;
DROP TABLE IF EXISTS generated_proposals CASCADE;
DROP TABLE IF EXISTS report_tracking_logs CASCADE;
DROP TABLE IF EXISTS step_generations CASCADE;
DROP TABLE IF EXISTS step CASCADE;
DROP TABLE IF EXISTS step_templates CASCADE;
DROP TABLE IF EXISTS sequences CASCADE;
DROP TABLE IF EXISTS user_assets CASCADE;
DROP TABLE IF EXISTS prospects CASCADE;
DROP TABLE IF EXISTS site_analysis_cache CASCADE;
DROP TABLE IF EXISTS user_plans CASCADE;
DROP TABLE IF EXISTS plans CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- [2] 유틸리티 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- [3] 기본 인프라
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
    CONSTRAINT fk_user_plans_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

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

-- [4] 핵심 비즈니스 테이블
CREATE TABLE prospects (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    user_id UUID NOT NULL,
    cache_id UUID, 
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    contact_email VARCHAR(255), 
    url VARCHAR(500),
    memo TEXT,
    crm_status VARCHAR(50) DEFAULT 'cold' NOT NULL, 
    max_scroll_depth INT DEFAULT 0, 
    max_duration_seconds INT DEFAULT 0,
    visit_count INT DEFAULT 0,
    store_name VARCHAR(255),
    category VARCHAR(100),
    tier VARCHAR(20),
    raw_ocr_text TEXT,
    last_activity_at TIMESTAMPTZ, 
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT pk_prospects PRIMARY KEY (id),
    CONSTRAINT fk_prospects_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_prospects_crm_status CHECK (crm_status IN ('cold', 'warm', 'hot'))
);

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

CREATE TABLE step (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    user_id UUID NOT NULL,
    sequence_id UUID NOT NULL,
    step_number INT NOT NULL,
    selected_generation_id UUID, 
    status VARCHAR(50) DEFAULT 'pending' NOT NULL,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT pk_step PRIMARY KEY (id),
    CONSTRAINT fk_step_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_step_sequence FOREIGN KEY (sequence_id) REFERENCES sequences(id) ON DELETE CASCADE,
    CONSTRAINT uq_step_sequence_number UNIQUE (sequence_id, step_number)
);

CREATE TABLE step_generations (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    step_id UUID NOT NULL,
    user_id UUID NOT NULL,
    version_number INT NOT NULL DEFAULT 1,
    email_subject VARCHAR(255), 
    email_body TEXT, 
    report_data JSONB, 
    report_materials JSONB DEFAULT '[]'::jsonb, 
    status VARCHAR(50) DEFAULT 'processing' NOT NULL,
    cost_krw INT DEFAULT 400, 
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT pk_step_generations PRIMARY KEY (id),
    CONSTRAINT fk_generations_step FOREIGN KEY (step_id) REFERENCES step(id) ON DELETE CASCADE,
    CONSTRAINT fk_generations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

ALTER TABLE step ADD CONSTRAINT fk_step_selected_generation 
FOREIGN KEY (selected_generation_id) REFERENCES step_generations(id) ON DELETE SET NULL;

-- [5] generated_emails 테이블 (n8n 연동)
CREATE TABLE generated_emails (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    prospect_id UUID,
    user_id UUID,
    step_number INT NOT NULL,
    theme VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    report_html TEXT,
    email_body_solopreneur TEXT,
    email_body_corporate TEXT,
    email_subjects JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(20) DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT pk_generated_emails PRIMARY KEY (id)
);

-- [6] 템플릿 & 로그
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

CREATE TABLE report_tracking_logs (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    prospect_id UUID NOT NULL,
    session_id UUID NOT NULL,
    user_agent TEXT,
    ip_address VARCHAR(45),
    scroll_depth INT DEFAULT 0,
    duration_seconds INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT pk_report_tracking_logs PRIMARY KEY (id),
    CONSTRAINT fk_report_logs_prospect FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE CASCADE
);

-- ================================================================
-- LinkPitch MVP v7.6 - PART 2/2: 인덱스, 제약조건, 트리거
-- ================================================================

-- [7] 인덱스 최적화
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_plans_code ON plans(code);
CREATE INDEX idx_plans_active ON plans(is_active) WHERE is_active = true;
CREATE INDEX idx_user_plans_user_current ON user_plans(user_id, is_current) WHERE is_current = true;
CREATE INDEX idx_user_plans_dates ON user_plans(started_at, ended_at);
CREATE INDEX idx_user_plans_plan ON user_plans(plan_id);
CREATE INDEX idx_cache_url_hash ON site_analysis_cache(url_hash);
CREATE INDEX idx_cache_last_accessed ON site_analysis_cache(last_accessed_at DESC);
CREATE INDEX idx_cache_access_count ON site_analysis_cache(access_count DESC);
CREATE INDEX idx_cache_analyzed ON site_analysis_cache(analyzed_at DESC);
CREATE INDEX idx_assets_user_type ON user_assets(user_id, file_type);
CREATE INDEX idx_assets_created ON user_assets(created_at DESC);
CREATE INDEX idx_assets_user_created ON user_assets(user_id, created_at DESC);
CREATE INDEX idx_prospects_user_id ON prospects(user_id);
CREATE INDEX idx_prospects_crm_status ON prospects(user_id, crm_status);
CREATE INDEX idx_prospects_activity ON prospects(last_activity_at DESC NULLS LAST);
CREATE INDEX idx_prospects_created ON prospects(created_at DESC);
CREATE INDEX idx_prospects_user_created ON prospects(user_id, created_at DESC);
CREATE INDEX idx_prospects_email ON prospects(contact_email) WHERE contact_email IS NOT NULL;
CREATE INDEX idx_prospects_tier ON prospects(tier) WHERE tier IS NOT NULL;
CREATE INDEX idx_prospects_category ON prospects(category) WHERE category IS NOT NULL;
CREATE INDEX idx_prospects_store_name ON prospects(store_name) WHERE store_name IS NOT NULL;
CREATE INDEX idx_sequences_user_id ON sequences(user_id);
CREATE INDEX idx_sequences_prospect ON sequences(prospect_id);
CREATE INDEX idx_sequences_status ON sequences(user_id, status);
CREATE INDEX idx_sequences_created ON sequences(created_at DESC);
CREATE INDEX idx_sequences_user_created ON sequences(user_id, created_at DESC);
CREATE INDEX idx_step_user_id ON step(user_id);
CREATE INDEX idx_step_sequence ON step(sequence_id, step_number);
CREATE INDEX idx_step_status ON step(status, sent_at);
CREATE INDEX idx_step_selected_gen ON step(selected_generation_id) WHERE selected_generation_id IS NOT NULL;
CREATE INDEX idx_step_sent ON step(sent_at DESC) WHERE sent_at IS NOT NULL;
CREATE INDEX idx_generations_step ON step_generations(step_id, version_number DESC);
CREATE INDEX idx_generations_user ON step_generations(user_id, created_at DESC);
CREATE INDEX idx_generations_status ON step_generations(status);
CREATE INDEX idx_generations_cost ON step_generations(user_id, cost_krw) WHERE cost_krw > 0;
CREATE INDEX idx_generations_step_status ON step_generations(step_id, status);
CREATE INDEX idx_emails_prospect ON generated_emails(prospect_id);
CREATE INDEX idx_emails_user ON generated_emails(user_id, created_at DESC);
CREATE INDEX idx_emails_status ON generated_emails(status, created_at DESC);
CREATE INDEX idx_emails_step ON generated_emails(step_number);
CREATE INDEX idx_emails_type ON generated_emails(target_type);
CREATE INDEX idx_emails_created ON generated_emails(created_at DESC);
CREATE INDEX idx_emails_user_status ON generated_emails(user_id, status);
CREATE INDEX idx_tracking_prospect ON report_tracking_logs(prospect_id, created_at DESC);
CREATE INDEX idx_tracking_session ON report_tracking_logs(session_id);
CREATE INDEX idx_tracking_created ON report_tracking_logs(created_at DESC);
CREATE INDEX idx_tracking_engagement ON report_tracking_logs(prospect_id, scroll_depth, duration_seconds);
CREATE INDEX idx_tracking_ip ON report_tracking_logs(ip_address) WHERE ip_address IS NOT NULL;

-- [8] 데이터 무결성 제약조건
ALTER TABLE users ADD CONSTRAINT chk_users_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
ALTER TABLE plans ADD CONSTRAINT uq_plans_code UNIQUE (code);
ALTER TABLE plans ADD CONSTRAINT chk_plans_quota CHECK (monthly_quota >= 0);
ALTER TABLE plans ADD CONSTRAINT chk_plans_price CHECK (price_krw >= 0);
ALTER TABLE prospects ADD CONSTRAINT chk_prospects_scroll_depth CHECK (max_scroll_depth BETWEEN 0 AND 100);
ALTER TABLE prospects ADD CONSTRAINT chk_prospects_duration CHECK (max_duration_seconds >= 0);
ALTER TABLE prospects ADD CONSTRAINT chk_prospects_visits CHECK (visit_count >= 0);
ALTER TABLE prospects ADD CONSTRAINT chk_prospects_tier CHECK (tier IS NULL OR tier IN ('High', 'Middle', 'Low'));
ALTER TABLE sequences ADD CONSTRAINT chk_sequences_total_steps CHECK (total_steps > 0 AND total_steps <= 10);
ALTER TABLE sequences ADD CONSTRAINT chk_sequences_status CHECK (status IN ('draft', 'active', 'completed'));
ALTER TABLE step ADD CONSTRAINT chk_step_number CHECK (step_number > 0);
ALTER TABLE step ADD CONSTRAINT chk_step_status CHECK (status IN ('pending', 'sent'));
ALTER TABLE step_generations ADD CONSTRAINT chk_generations_version CHECK (version_number > 0);
ALTER TABLE step_generations ADD CONSTRAINT chk_generations_status CHECK (status IN ('processing', 'completed', 'failed'));
ALTER TABLE step_generations ADD CONSTRAINT chk_generations_cost CHECK (cost_krw >= 0);
ALTER TABLE report_tracking_logs ADD CONSTRAINT chk_tracking_scroll CHECK (scroll_depth BETWEEN 0 AND 100);
ALTER TABLE report_tracking_logs ADD CONSTRAINT chk_tracking_duration CHECK (duration_seconds >= 0);

-- [9] 초기 데이터 삽입
INSERT INTO step_templates (step_number, step_name, description, timeline_day) VALUES
(1, 'Diagnosis', '약점 진단', 1),
(2, 'Cost Saving', '비용 효율', 3),
(3, 'Visual', '시각적 설득', 6),
(4, 'FOMO', '트렌드 & 긴급성', 10),
(5, 'Authority', '신뢰 & 통합 솔루션', 14);

INSERT INTO plans (code, name, monthly_quota, price_krw) VALUES
('free', 'Free', 3, 0), 
('starter', 'Starter', 30, 49000), 
('pro', 'Pro', 100, 149000);

INSERT INTO public.users (id, email, clerk_id, name)
VALUES (
  '17303ec6-7da7-4268-a3ed-da2826f9d589', 
  'admin@linkpitch.io',                   
  'admin_master_id',                      
  'Master Admin'
)
ON CONFLICT (id) DO NOTHING;

-- [10] 트리거
CREATE OR REPLACE FUNCTION update_prospect_status()
RETURNS TRIGGER AS $$
DECLARE
    current_scroll INT;
    current_duration INT;
    current_visits INT;
    new_status VARCHAR(50);
BEGIN
    SELECT GREATEST(max_scroll_depth, NEW.scroll_depth), 
           GREATEST(max_duration_seconds, NEW.duration_seconds)
    INTO current_scroll, current_duration
    FROM prospects
    WHERE id = NEW.prospect_id;

    SELECT COUNT(DISTINCT session_id) INTO current_visits
    FROM report_tracking_logs WHERE prospect_id = NEW.prospect_id;

    IF (current_scroll >= 80 AND current_duration >= 30) OR (current_visits >= 3) THEN
        new_status := 'hot';
    ELSIF (current_scroll >= 50 OR current_duration >= 15) OR (current_visits >= 2) THEN
        new_status := 'warm';
    ELSE
        new_status := 'cold';
    END IF;

    UPDATE prospects
    SET 
        max_scroll_depth = current_scroll,
        max_duration_seconds = current_duration,
        visit_count = current_visits,
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
CREATE TRIGGER trg_users_update BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_prospects_update BEFORE UPDATE ON prospects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_sequences_update BEFORE UPDATE ON sequences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_step_update BEFORE UPDATE ON step FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_emails_update BEFORE UPDATE ON generated_emails FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION update_cache_access()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE site_analysis_cache SET last_accessed_at = NOW(), access_count = access_count + 1 WHERE id = NEW.cache_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- [11] 통계 수집
ANALYZE users;
ANALYZE plans;
ANALYZE user_plans;
ANALYZE site_analysis_cache;
ANALYZE user_assets;
ANALYZE prospects;
ANALYZE sequences;
ANALYZE step;
ANALYZE step_generations;
ANALYZE generated_emails;
ANALYZE report_tracking_logs;

DO $$ BEGIN RAISE NOTICE '✅ LinkPitch MVP v7.6 Complete!'; END $$;