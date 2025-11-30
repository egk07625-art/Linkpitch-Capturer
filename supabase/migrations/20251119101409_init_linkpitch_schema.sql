-- ================================================================
-- LinkPitch MVP v7.0 (Paid Regeneration Edition)
-- Focus: Multi-Version Management for AI Reports
-- ================================================================

-- [1] 초기화 (순서대로 삭제)
DROP TABLE IF EXISTS report_tracking_logs CASCADE;
DROP TABLE IF EXISTS step_generations CASCADE; -- 새로 추가된 테이블
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

-- ================================================================
-- [3] 기본 인프라 (유저, 플랜, 캐시, 에셋)
-- ================================================================

CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    clerk_id TEXT NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uq_users_clerk_id UNIQUE (clerk_id),
    CONSTRAINT chk_users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE TABLE plans (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    monthly_quota INT NOT NULL,
    price_krw INT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    CONSTRAINT pk_plans PRIMARY KEY (id),
    CONSTRAINT uq_plans_code UNIQUE (code),
    CONSTRAINT chk_plans_quota CHECK (monthly_quota >= 0),
    CONSTRAINT chk_plans_price CHECK (price_krw >= 0)
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

-- ================================================================
-- [4] 핵심 비즈니스 테이블
-- ================================================================

-- 🏢 Prospects (리드 관리)
CREATE TABLE prospects (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    user_id UUID NOT NULL,
    cache_id UUID NOT NULL, 
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    -- [변경 1] 이메일 없어도 등록 가능하도록 NULL 허용
    contact_email VARCHAR(255), 
    url VARCHAR(500) NOT NULL,
    memo TEXT,
    
    -- CRM 상태
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
    CONSTRAINT chk_prospects_crm_status CHECK (crm_status IN ('cold', 'warm', 'hot')),
    CONSTRAINT chk_prospects_email_format CHECK (contact_email IS NULL OR contact_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_prospects_url_format CHECK (url ~* '^https?://'),
    CONSTRAINT chk_prospects_scroll_depth CHECK (max_scroll_depth BETWEEN 0 AND 100),
    CONSTRAINT chk_prospects_duration CHECK (max_duration_seconds >= 0),
    CONSTRAINT chk_prospects_visits CHECK (visit_count >= 0)
);

-- 🔄 Sequences (시퀀스 관리)
CREATE TABLE sequences (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    user_id UUID NOT NULL,
    prospect_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    persona_type VARCHAR(50) DEFAULT 'researcher' NOT NULL,
    sequence_type VARCHAR(100) DEFAULT '5_steps' NOT NULL,
    total_steps INT DEFAULT 5 NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' NOT NULL, -- draft, active, completed
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT pk_sequences PRIMARY KEY (id),
    CONSTRAINT fk_sequences_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_sequences_prospect FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE CASCADE
);

-- 📧 Step (단계 껍데기)
-- "이 시퀀스의 1단계는 '진단'이다" 라는 정의만 가집니다. 실제 내용은 Generations에 있습니다.
CREATE TABLE step (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    user_id UUID NOT NULL,
    sequence_id UUID NOT NULL,
    step_number INT NOT NULL,
    
    -- 현재 사용자가 '선택(Pick)'한 생성 버전의 ID (발송 예정인 버전)
    selected_generation_id UUID, 
    
    status VARCHAR(50) DEFAULT 'pending' NOT NULL, -- pending, sent
    sent_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT pk_step PRIMARY KEY (id),
    CONSTRAINT fk_step_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_step_sequence FOREIGN KEY (sequence_id) REFERENCES sequences(id) ON DELETE CASCADE,
    CONSTRAINT uq_step_sequence_number UNIQUE (sequence_id, step_number)
);

-- 🧬 [신규] Step Generations (생성 이력 & 버전 관리)
-- 유료 생성(Regeneration)을 할 때마다 여기에 쌓입니다.
CREATE TABLE step_generations (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    step_id UUID NOT NULL,
    user_id UUID NOT NULL,
    
    -- 버전 관리 (1차 생성, 2차 생성...)
    version_number INT NOT NULL DEFAULT 1,
    
    -- 생성 결과물
    email_subject VARCHAR(255), 
    email_body TEXT, 
    report_data JSONB, 
    
    -- 투입된 재료 (당시 어떤 데이터를 넣어서 만들었는지 기록)
    report_materials JSONB DEFAULT '[]'::jsonb, 
    
    -- 생성 상태 (AI가 작성 중인지, 완료됐는지)
    status VARCHAR(50) DEFAULT 'processing' NOT NULL, -- processing, completed, failed
    
    -- 과금 정보 (나중에 정산할 때 근거 자료)
    cost_krw INT DEFAULT 400, 
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT pk_step_generations PRIMARY KEY (id),
    CONSTRAINT fk_generations_step FOREIGN KEY (step_id) REFERENCES step(id) ON DELETE CASCADE,
    CONSTRAINT fk_generations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Step에 FK 연결 (순환 참조 방지를 위해 테이블 생성 후 추가)
ALTER TABLE step ADD CONSTRAINT fk_step_selected_generation 
FOREIGN KEY (selected_generation_id) REFERENCES step_generations(id) ON DELETE SET NULL;

-- ================================================================
-- [5] 인덱스 최적화 (Performance Indexes)
-- ================================================================

-- 🔍 Users 테이블 인덱스
CREATE INDEX idx_users_clerk_id ON users(clerk_id); -- 로그인 조회 최적화
CREATE INDEX idx_users_email ON users(email); -- 이메일 검색 최적화

-- 🔍 User Plans 테이블 인덱스
CREATE INDEX idx_user_plans_user_current ON user_plans(user_id, is_current) WHERE is_current = true; -- 현재 플랜 조회
CREATE INDEX idx_user_plans_dates ON user_plans(started_at, ended_at); -- 플랜 기간 조회

-- 🔍 Site Analysis Cache 인덱스
CREATE INDEX idx_cache_url_hash ON site_analysis_cache(url_hash); -- URL 중복 체크 (이미 UNIQUE이지만 명시적 인덱스)
CREATE INDEX idx_cache_last_accessed ON site_analysis_cache(last_accessed_at DESC); -- 캐시 정리용
CREATE INDEX idx_cache_access_count ON site_analysis_cache(access_count DESC); -- 인기 사이트 분석

-- 🔍 User Assets 인덱스
CREATE INDEX idx_assets_user_type ON user_assets(user_id, file_type); -- 유저별 파일 타입 필터링
CREATE INDEX idx_assets_created ON user_assets(created_at DESC); -- 최신 에셋 조회

-- 🔍 Prospects 테이블 인덱스 (가장 중요!)
CREATE INDEX idx_prospects_user_id ON prospects(user_id); -- 유저별 리드 목록
CREATE INDEX idx_prospects_cache_id ON prospects(cache_id); -- 캐시 연결 조회
CREATE INDEX idx_prospects_crm_status ON prospects(user_id, crm_status); -- CRM 상태별 필터링
CREATE INDEX idx_prospects_activity ON prospects(last_activity_at DESC NULLS LAST); -- 최근 활동 정렬
CREATE INDEX idx_prospects_created ON prospects(created_at DESC); -- 최신 리드 조회
CREATE INDEX idx_prospects_email ON prospects(contact_email) WHERE contact_email IS NOT NULL; -- 이메일 검색

-- 🔍 Sequences 테이블 인덱스
CREATE INDEX idx_sequences_user_id ON sequences(user_id); -- 유저별 시퀀스
CREATE INDEX idx_sequences_prospect ON sequences(prospect_id); -- 리드별 시퀀스
CREATE INDEX idx_sequences_status ON sequences(user_id, status); -- 상태별 필터링
CREATE INDEX idx_sequences_created ON sequences(created_at DESC); -- 최신 시퀀스

-- 🔍 Step 테이블 인덱스
CREATE INDEX idx_step_user_id ON step(user_id); -- 유저별 스텝
CREATE INDEX idx_step_sequence ON step(sequence_id, step_number); -- 시퀀스 내 스텝 정렬
CREATE INDEX idx_step_status ON step(status, sent_at); -- 발송 상태 조회
CREATE INDEX idx_step_selected_gen ON step(selected_generation_id) WHERE selected_generation_id IS NOT NULL; -- 선택된 버전 조회

-- 🔍 Step Generations 인덱스 (유료 재생성 추적)
CREATE INDEX idx_generations_step ON step_generations(step_id, version_number DESC); -- 스텝별 버전 이력
CREATE INDEX idx_generations_user ON step_generations(user_id, created_at DESC); -- 유저별 생성 이력
CREATE INDEX idx_generations_status ON step_generations(status); -- 생성 상태 필터링
CREATE INDEX idx_generations_cost ON step_generations(user_id, cost_krw) WHERE cost_krw > 0; -- 과금 집계용

-- 🔍 Report Tracking Logs 인덱스 (대용량 로그 테이블)
CREATE INDEX idx_tracking_prospect ON report_tracking_logs(prospect_id, created_at DESC); -- 리드별 활동 로그
CREATE INDEX idx_tracking_session ON report_tracking_logs(session_id); -- 세션별 추적
CREATE INDEX idx_tracking_created ON report_tracking_logs(created_at DESC); -- 시간순 정렬
CREATE INDEX idx_tracking_engagement ON report_tracking_logs(prospect_id, scroll_depth, duration_seconds); -- 참여도 분석
CREATE INDEX idx_tracking_ip ON report_tracking_logs(ip_address) WHERE ip_address IS NOT NULL; -- 봇 필터링용

-- ================================================================
-- [6] 템플릿 & 로그
-- ================================================================

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
(1, 'Diagnosis', '약점 진단', 1),
(2, 'Cost Saving', '비용 효율', 3),
(3, 'Visual', '시각적 설득', 6),
(4, 'FOMO', '트렌드 & 긴급성', 10),
(5, 'Authority', '신뢰 & 통합 솔루션', 14);

CREATE TABLE report_tracking_logs (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    -- [변경 2] 특정 '생성 버전'에 대한 로그여야 하므로 step_generations를 참조하는 게 더 정확할 수 있으나,
    -- 일단 Prospect(고객) 기준으로 통합 관리
    prospect_id UUID NOT NULL,
    session_id UUID NOT NULL,
    
    -- [변경 3] 봇 필터링 등을 위한 최소한의 장치
    user_agent TEXT,
    ip_address VARCHAR(45),
    
    scroll_depth INT DEFAULT 0,
    duration_seconds INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT pk_report_tracking_logs PRIMARY KEY (id),
    CONSTRAINT fk_report_logs_prospect FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE CASCADE
);

-- ================================================================
-- [6] 트리거 (기존 로직 유지)
-- ================================================================

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

CREATE OR REPLACE FUNCTION update_cache_access()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE site_analysis_cache SET last_accessed_at = NOW(), access_count = access_count + 1 WHERE id = NEW.cache_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_prospects_cache_access AFTER INSERT ON prospects FOR EACH ROW EXECUTE FUNCTION update_cache_access();

-- 초기 플랜 데이터
INSERT INTO plans (code, name, monthly_quota, price_krw) VALUES
('free', 'Free', 3, 0), ('starter', 'Starter', 30, 49000), ('pro', 'Pro', 100, 149000);

-- ================================================================
-- [7] 통계 정보 수집 (Query Planner 최적화)
-- ================================================================

-- 주요 테이블의 통계 정보를 수집하여 쿼리 플래너가 최적의 실행 계획을 세울 수 있도록 함
ANALYZE users;
ANALYZE prospects;
ANALYZE sequences;
ANALYZE step;
ANALYZE step_generations;
ANALYZE report_tracking_logs;
ANALYZE site_analysis_cache;

DO $$ BEGIN RAISE NOTICE '✅ LinkPitch MVP v7.0 (Optimized & Production-Ready) Loaded!'; END $$;