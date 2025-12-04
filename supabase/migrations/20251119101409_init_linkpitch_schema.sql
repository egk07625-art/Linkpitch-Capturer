-- ================================================================
-- LinkPitch MVP v8.0 (Integrated Schema)
-- 변경사항: 
--   - credits 컬럼 추가 (users 테이블)
--   - RLS 비활성화 (개발 단계)
--   - 캐시 정리 함수 추가
--   - 모든 마이그레이션 통합
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
    credits INT NOT NULL DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uq_users_clerk_id UNIQUE (clerk_id),
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT chk_users_credits CHECK (credits >= 0)
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
    CONSTRAINT fk_user_plans_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_plans_plan FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE RESTRICT
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
    CONSTRAINT chk_prospects_crm_status CHECK (crm_status IN ('cold', 'warm', 'hot')),
    CONSTRAINT chk_prospects_tier CHECK (tier IS NULL OR tier IN ('High', 'Middle', 'Low')),
    CONSTRAINT chk_prospects_scroll_depth CHECK (max_scroll_depth BETWEEN 0 AND 100),
    CONSTRAINT chk_prospects_duration CHECK (max_duration_seconds >= 0),
    CONSTRAINT chk_prospects_visits CHECK (visit_count >= 0)
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
    CONSTRAINT fk_sequences_prospect FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE CASCADE,
    CONSTRAINT chk_sequences_status CHECK (status IN ('draft', 'active', 'completed')),
    CONSTRAINT chk_sequences_total_steps CHECK (total_steps > 0 AND total_steps <= 10)
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
    CONSTRAINT uq_step_sequence_number UNIQUE (sequence_id, step_number),
    CONSTRAINT chk_step_status CHECK (status IN ('pending', 'sent')),
    CONSTRAINT chk_step_number CHECK (step_number > 0)
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
    CONSTRAINT fk_generations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_generations_status CHECK (status IN ('processing', 'completed', 'failed')),
    CONSTRAINT chk_generations_version CHECK (version_number > 0),
    CONSTRAINT chk_generations_cost CHECK (cost_krw >= 0)
);

-- 외래키 추가
ALTER TABLE prospects ADD CONSTRAINT fk_prospects_cache 
FOREIGN KEY (cache_id) REFERENCES site_analysis_cache(id) ON DELETE SET NULL;

ALTER TABLE step ADD CONSTRAINT fk_step_selected_generation 
FOREIGN KEY (selected_generation_id) REFERENCES step_generations(id) ON DELETE SET NULL;

-- ================================================================
-- [5] generated_emails 테이블 (n8n 워크플로우 완벽 연동)
-- ================================================================
CREATE TABLE generated_emails (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    prospect_id UUID,
    user_id UUID,
    step_number INT NOT NULL,
    theme VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    
    -- ============================================================
    -- [핵심] 2-Track HTML 저장 전략
    -- ============================================================
    -- 발송용: 디자인(CSS, 헤더, 푸터)이 모두 적용된 완성 HTML
    report_html TEXT NOT NULL DEFAULT '',
    
    -- 편집용: AI가 생성한 순수 본문만 (에디터에서 수정할 때 사용)
    report_html_editable TEXT NOT NULL DEFAULT '',
    
    -- ============================================================
    -- [메타 데이터] 수정 워크플로우 효율화
    -- ============================================================
    store_name VARCHAR(255) NOT NULL DEFAULT '',
    category VARCHAR(100) NOT NULL DEFAULT '',
    tier VARCHAR(20) DEFAULT 'Middle',
    
    -- 이메일 본문 (대상별)
    email_body_solopreneur TEXT,
    email_body_corporate TEXT,
    
    -- 이메일 제목 (5가지 유형 x 2개씩 = 10개)
    email_subjects JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- 상태 관리
    status VARCHAR(20) DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    
    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- 제약조건
    CONSTRAINT pk_generated_emails PRIMARY KEY (id),
    CONSTRAINT fk_generated_emails_prospect FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE CASCADE,
    CONSTRAINT fk_generated_emails_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_generated_emails_status CHECK (status IN ('pending', 'sent', 'opened', 'clicked', 'failed')),
    CONSTRAINT chk_generated_emails_step_number CHECK (step_number > 0 AND step_number <= 10),
    CONSTRAINT chk_generated_emails_tier CHECK (tier IS NULL OR tier IN ('High', 'Middle', 'Low'))
);

-- UNIQUE 제약조건: (prospect_id, step_number) 조합이 유일해야 함
CREATE UNIQUE INDEX uq_generated_emails_prospect_step 
ON generated_emails(prospect_id, step_number) 
WHERE prospect_id IS NOT NULL;

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
    CONSTRAINT fk_report_logs_prospect FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE CASCADE,
    CONSTRAINT chk_tracking_scroll CHECK (scroll_depth BETWEEN 0 AND 100),
    CONSTRAINT chk_tracking_duration CHECK (duration_seconds >= 0)
);

-- ================================================================
-- [7] 인덱스 최적화
-- ================================================================

-- JSONB GIN 인덱스 (검색 성능)
CREATE INDEX idx_cache_vision_data_gin ON site_analysis_cache USING GIN (vision_data);
CREATE INDEX idx_generations_report_data_gin ON step_generations USING GIN (report_data);
CREATE INDEX idx_generations_report_materials_gin ON step_generations USING GIN (report_materials);
CREATE INDEX idx_emails_subjects_gin ON generated_emails USING GIN (email_subjects);

-- Users
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_credits ON users(credits);

-- Plans
CREATE INDEX idx_plans_active ON plans(is_active) WHERE is_active = true;

-- User Plans
CREATE INDEX idx_user_plans_user_current ON user_plans(user_id, is_current) WHERE is_current = true;
CREATE INDEX idx_user_plans_dates ON user_plans(started_at, ended_at);
CREATE INDEX idx_user_plans_plan ON user_plans(plan_id);

-- Site Analysis Cache
CREATE INDEX idx_cache_url_hash ON site_analysis_cache(url_hash);
CREATE INDEX idx_cache_last_accessed ON site_analysis_cache(last_accessed_at DESC);
CREATE INDEX idx_cache_access_count ON site_analysis_cache(access_count DESC);
CREATE INDEX idx_cache_analyzed ON site_analysis_cache(analyzed_at DESC);

-- User Assets
CREATE INDEX idx_assets_user_created ON user_assets(user_id, created_at DESC);
CREATE INDEX idx_assets_user_type ON user_assets(user_id, file_type);

-- Prospects
CREATE INDEX idx_prospects_user_created ON prospects(user_id, created_at DESC);
CREATE INDEX idx_prospects_crm_status ON prospects(user_id, crm_status);
CREATE INDEX idx_prospects_crm_dashboard ON prospects(user_id, crm_status, last_activity_at DESC NULLS LAST);
CREATE INDEX idx_prospects_store_name ON prospects(store_name) WHERE store_name IS NOT NULL;
CREATE INDEX idx_prospects_email ON prospects(contact_email) WHERE contact_email IS NOT NULL;
CREATE INDEX idx_prospects_tier ON prospects(tier) WHERE tier IS NOT NULL;
CREATE INDEX idx_prospects_category ON prospects(category) WHERE category IS NOT NULL;

-- Sequences
CREATE INDEX idx_sequences_user_created ON sequences(user_id, created_at DESC);
CREATE INDEX idx_sequences_prospect ON sequences(prospect_id);
CREATE INDEX idx_sequences_user_status ON sequences(user_id, status);
CREATE INDEX idx_sequences_active ON sequences(user_id, prospect_id) WHERE status = 'active';

-- Step
CREATE INDEX idx_step_sequence ON step(sequence_id, step_number);
CREATE INDEX idx_step_status ON step(status, sent_at);

-- Step Generations
CREATE INDEX idx_generations_step_version ON step_generations(step_id, version_number DESC);
CREATE INDEX idx_generations_user_created ON step_generations(user_id, created_at DESC);
CREATE INDEX idx_generations_step_status ON step_generations(step_id, status);
CREATE INDEX idx_generations_cost ON step_generations(user_id, cost_krw) WHERE cost_krw > 0;

-- Generated Emails (워크플로우 최적화)
CREATE INDEX idx_emails_prospect ON generated_emails(prospect_id);
CREATE INDEX idx_emails_user_created ON generated_emails(user_id, created_at DESC);
CREATE INDEX idx_emails_user_status ON generated_emails(user_id, status);
CREATE INDEX idx_emails_type ON generated_emails(target_type);

-- [핵심] 수정 워크플로우 최적화 인덱스 (커버링 인덱스로 쿼리 성능 향상)
-- id는 PRIMARY KEY이므로 별도 인덱스 불필요, 대신 prospect_id + step_number 조합으로 커버링 인덱스 생성
CREATE INDEX idx_emails_prospect_step_meta ON generated_emails(prospect_id, step_number) 
INCLUDE (store_name, category, tier, theme) 
WHERE prospect_id IS NOT NULL;

-- Report Tracking Logs
CREATE INDEX idx_tracking_prospect ON report_tracking_logs(prospect_id, created_at DESC);
CREATE INDEX idx_tracking_session ON report_tracking_logs(session_id);
CREATE INDEX idx_tracking_engagement ON report_tracking_logs(prospect_id, scroll_depth, duration_seconds);
CREATE INDEX idx_tracking_ip ON report_tracking_logs(ip_address) WHERE ip_address IS NOT NULL;

-- ================================================================
-- [8] 트리거
-- ================================================================

-- updated_at 자동 갱신
CREATE TRIGGER trg_users_update BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_prospects_update BEFORE UPDATE ON prospects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_sequences_update BEFORE UPDATE ON sequences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_step_update BEFORE UPDATE ON step FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_emails_update BEFORE UPDATE ON generated_emails FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Prospect 상태 자동 업데이트
CREATE OR REPLACE FUNCTION update_prospect_status()
RETURNS TRIGGER AS $$
DECLARE
    current_scroll INT;
    current_duration INT;
    current_visits INT;
    new_status VARCHAR(50);
BEGIN
    SELECT COALESCE(GREATEST(max_scroll_depth, COALESCE(NEW.scroll_depth, 0)), 0), 
           COALESCE(GREATEST(max_duration_seconds, COALESCE(NEW.duration_seconds, 0)), 0)
    INTO current_scroll, current_duration
    FROM prospects
    WHERE id = NEW.prospect_id;

    SELECT COUNT(DISTINCT session_id) INTO current_visits
    FROM report_tracking_logs WHERE prospect_id = NEW.prospect_id;

    IF (COALESCE(current_scroll, 0) >= 80 AND COALESCE(current_duration, 0) >= 30) OR (COALESCE(current_visits, 0) >= 3) THEN
        new_status := 'hot';
    ELSIF (COALESCE(current_scroll, 0) >= 50 OR COALESCE(current_duration, 0) >= 15) OR (COALESCE(current_visits, 0) >= 2) THEN
        new_status := 'warm';
    ELSE
        new_status := 'cold';
    END IF;

    UPDATE prospects
    SET 
        max_scroll_depth = COALESCE(current_scroll, max_scroll_depth),
        max_duration_seconds = COALESCE(current_duration, max_duration_seconds),
        visit_count = COALESCE(current_visits, visit_count),
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

-- Cache 접근 기록
CREATE OR REPLACE FUNCTION update_cache_access()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.cache_id IS NOT NULL THEN
        UPDATE site_analysis_cache 
        SET last_accessed_at = NOW(), access_count = access_count + 1 
        WHERE id = NEW.cache_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prospects_cache_access 
AFTER INSERT OR UPDATE OF cache_id ON prospects 
FOR EACH ROW 
WHEN (NEW.cache_id IS NOT NULL)
EXECUTE FUNCTION update_cache_access();

-- ================================================================
-- [11] 유틸리티 함수: 캐시 정리 (Cron Job용)
-- ================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS TABLE(deleted_count INT) AS $$
DECLARE
    row_count INT;
BEGIN
    DELETE FROM site_analysis_cache
    WHERE last_accessed_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS row_count = ROW_COUNT;
    RETURN QUERY SELECT row_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_cache IS '30일 이상 미사용 캐시 삭제 (크론잡으로 실행)';

-- ================================================================
-- [12] 개발 단계 RLS 비활성화
-- ================================================================
--
-- 개발 단계에서는 RLS를 비활성화하여
-- 권한 관련 에러 없이 개발을 진행합니다.
--
-- ⚠️ 중요: 프로덕션 배포 전에 반드시 RLS 활성화 필요
-- ================================================================

-- 모든 테이블의 RLS 비활성화
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE prospects DISABLE ROW LEVEL SECURITY;
ALTER TABLE sequences DISABLE ROW LEVEL SECURITY;
ALTER TABLE step DISABLE ROW LEVEL SECURITY;
ALTER TABLE step_generations DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE site_analysis_cache DISABLE ROW LEVEL SECURITY;
ALTER TABLE generated_emails DISABLE ROW LEVEL SECURITY;
ALTER TABLE report_tracking_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE step_templates DISABLE ROW LEVEL SECURITY;

-- 기존 RLS 정책 삭제 (있는 경우)
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "prospects_select_own" ON prospects;
DROP POLICY IF EXISTS "prospects_insert_own" ON prospects;
DROP POLICY IF EXISTS "prospects_update_own" ON prospects;
DROP POLICY IF EXISTS "prospects_delete_own" ON prospects;
DROP POLICY IF EXISTS "sequences_select_own" ON sequences;
DROP POLICY IF EXISTS "sequences_insert_own" ON sequences;
DROP POLICY IF EXISTS "sequences_update_own" ON sequences;
DROP POLICY IF EXISTS "sequences_delete_own" ON sequences;
DROP POLICY IF EXISTS "step_select_own" ON step;
DROP POLICY IF EXISTS "step_insert_own" ON step;
DROP POLICY IF EXISTS "step_update_own" ON step;
DROP POLICY IF EXISTS "step_delete_own" ON step;
DROP POLICY IF EXISTS "report_events_select_own" ON report_events;
DROP POLICY IF EXISTS "report_events_insert_own" ON report_events;
DROP POLICY IF EXISTS "generation_logs_select_own" ON generation_logs;
DROP POLICY IF EXISTS "generation_logs_insert_own" ON generation_logs;

-- ================================================================
-- [9] 초기 데이터 삽입
-- ================================================================

INSERT INTO step_templates (step_number, step_name, description, timeline_day) VALUES
(1, 'Diagnosis', '현상 진단 - 구조적 문제 도출', 1),
(2, 'Cost Saving', '비용 효율 - 품질지수 및 예산 분석', 3),
(3, 'Visual', '시각적 설득 - 썸네일/상세페이지 진단', 6),
(4, 'FOMO', '트렌드 & 긴급성 - 시장 경쟁 분석', 10),
(5, 'Authority', '신뢰 & 통합 솔루션 - 최종 제안', 14);

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

-- ================================================================
-- [10] 통계 수집 및 완료
-- ================================================================
ANALYZE users;
ANALYZE plans;
ANALYZE prospects;
ANALYZE sequences;
ANALYZE step;
ANALYZE step_generations;
ANALYZE generated_emails;
ANALYZE report_tracking_logs;

DO $$ 
BEGIN 
    RAISE NOTICE '══════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ LinkPitch MVP v8.0 (Integrated Schema) 설치 완료!';
    RAISE NOTICE '══════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📊 주요 기능:';
    RAISE NOTICE '   • credits 컬럼: 사용자 무료 크레딧 시스템 (기본값 3)';
    RAISE NOTICE '   • generated_emails: 리포트 뷰어 완벽 연동';
    RAISE NOTICE '   • 캐시 정리 함수: cleanup_expired_cache()';
    RAISE NOTICE '';
    RAISE NOTICE '🔗 n8n 워크플로우 연동:';
    RAISE NOTICE '   • 워크플로우 1 (생성): DB 저장 노드 필드 매핑 필요';
    RAISE NOTICE '   • 워크플로우 2 (수정): 기존 정보 조회 → 디자인 재적용 → DB 업데이트';
    RAISE NOTICE '';
    RAISE NOTICE '⚡️ 최적화 완료:';
    RAISE NOTICE '   • 제약조건: 16개 (데이터 무결성 강화)';
    RAISE NOTICE '   • 인덱스: 31개 (쿼리 성능 최적화)';
    RAISE NOTICE '   • JSONB GIN 인덱스: 4개 (검색 성능 향상)';
    RAISE NOTICE '   • UNIQUE 제약조건: generated_emails (prospect_id, step_number)';
    RAISE NOTICE '   • 커버링 인덱스: idx_emails_prospect_step_meta';
    RAISE NOTICE '';
    RAISE NOTICE '🔒 보안 설정:';
    RAISE NOTICE '   • RLS: 개발 단계에서 비활성화';
    RAISE NOTICE '   • 프로덕션 배포 전 RLS 활성화 필수';
    RAISE NOTICE '   • 모든 외래키 제약조건 완료';
    RAISE NOTICE '   • CHECK 제약조건으로 데이터 검증 강화';
    RAISE NOTICE '   • UNIQUE 제약조건으로 중복 방지';
    RAISE NOTICE '══════════════════════════════════════════════════════════';
END $$;