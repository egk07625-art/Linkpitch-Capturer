-- ================================================
-- LinkPitch MVP v5.1 Database Schema
-- Supabase SQL Editor용 완전한 스크립트
-- ================================================

-- 1. 기존 테이블 삭제 (안전한 순서)
DROP TABLE IF EXISTS generation_logs CASCADE;
DROP TABLE IF EXISTS report_events CASCADE;
DROP TABLE IF EXISTS step CASCADE;
DROP TABLE IF EXISTS step_templates CASCADE;
DROP TABLE IF EXISTS sequences CASCADE;
DROP TABLE IF EXISTS prospects CASCADE;
DROP TABLE IF EXISTS user_plans CASCADE;
DROP TABLE IF EXISTS plans CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. 유틸리티 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 3. 테이블 생성
-- ================================================

-- 📦 users (사용자)
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

COMMENT ON TABLE users IS '사용자';
COMMENT ON COLUMN users.id IS '사용자 고유ID';
COMMENT ON COLUMN users.clerk_id IS 'Clerk 인증 ID';
COMMENT ON COLUMN users.email IS '사용자 이메일';
COMMENT ON COLUMN users.name IS '사용자 이름';
COMMENT ON COLUMN users.created_at IS '가입일시';
COMMENT ON COLUMN users.updated_at IS '수정일시';

-- 💳 plans (요금제)
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
    CONSTRAINT uq_plans_code UNIQUE (code),
    CONSTRAINT chk_plans_monthly_quota CHECK (monthly_quota > 0),
    CONSTRAINT chk_plans_price_krw CHECK (price_krw >= 0)
);

COMMENT ON TABLE plans IS '요금제';
COMMENT ON COLUMN plans.id IS '플랜 고유ID';
COMMENT ON COLUMN plans.code IS '플랜 코드 (free/starter/pro)';
COMMENT ON COLUMN plans.name IS '플랜 이름';
COMMENT ON COLUMN plans.description IS '플랜 설명';
COMMENT ON COLUMN plans.monthly_quota IS '월간 생성 가능 횟수';
COMMENT ON COLUMN plans.price_krw IS '월 구독료 (원)';
COMMENT ON COLUMN plans.is_active IS '플랜 활성 상태';
COMMENT ON COLUMN plans.created_at IS '생성일시';

-- 🔄 user_plans (구독정보)
CREATE TABLE user_plans (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    user_id UUID NOT NULL,
    plan_id UUID NOT NULL,
    is_current BOOLEAN DEFAULT true NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT pk_user_plans PRIMARY KEY (id),
    CONSTRAINT fk_user_plans_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_plans_plan FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
);

COMMENT ON TABLE user_plans IS '구독정보';
COMMENT ON COLUMN user_plans.id IS '구독 고유ID';
COMMENT ON COLUMN user_plans.user_id IS '사용자 외래키';
COMMENT ON COLUMN user_plans.plan_id IS '플랜 외래키';
COMMENT ON COLUMN user_plans.is_current IS '현재 구독 중인지 여부';
COMMENT ON COLUMN user_plans.started_at IS '구독 시작일';
COMMENT ON COLUMN user_plans.ended_at IS '구독 종료일';
COMMENT ON COLUMN user_plans.created_at IS '생성일시';
COMMENT ON COLUMN user_plans.updated_at IS '수정일시';

-- 🏢 prospects (고객사)
CREATE TABLE prospects (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    contact_email VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    memo TEXT,
    vision_data JSONB,
    crm_status VARCHAR(50) DEFAULT 'cold' NOT NULL,
    visit_count INT DEFAULT 0 NOT NULL,
    last_viewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT pk_prospects PRIMARY KEY (id),
    CONSTRAINT fk_prospects_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_prospects_crm_status CHECK (crm_status IN ('cold', 'warm', 'hot')),
    CONSTRAINT chk_prospects_visit_count CHECK (visit_count >= 0)
);

COMMENT ON TABLE prospects IS '고객사';
COMMENT ON COLUMN prospects.id IS '고객사 고유ID';
COMMENT ON COLUMN prospects.user_id IS '사용자 외래키';
COMMENT ON COLUMN prospects.name IS '고객사 이름';
COMMENT ON COLUMN prospects.contact_name IS '담당자 이름';
COMMENT ON COLUMN prospects.contact_email IS '담당자 이메일';
COMMENT ON COLUMN prospects.url IS '분석 대상 URL';
COMMENT ON COLUMN prospects.memo IS '고객사 메모';
COMMENT ON COLUMN prospects.vision_data IS 'Vision AI 분석 데이터 (mood, visual_usp, colors 등)';
COMMENT ON COLUMN prospects.crm_status IS 'CRM 상태 (cold/warm/hot)';
COMMENT ON COLUMN prospects.visit_count IS '리포트 재방문 횟수';
COMMENT ON COLUMN prospects.last_viewed_at IS '마지막 리포트 조회일시';
COMMENT ON COLUMN prospects.created_at IS '생성일시';
COMMENT ON COLUMN prospects.updated_at IS '수정일시';

-- 📧 sequences (시퀀스)
CREATE TABLE sequences (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    user_id UUID NOT NULL,
    prospect_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    sequence_type VARCHAR(100) DEFAULT '9_steps' NOT NULL,
    total_steps INT DEFAULT 9 NOT NULL,
    current_step INT DEFAULT 0 NOT NULL,
    status VARCHAR(50) DEFAULT 'draft' NOT NULL,
    custom_context TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT pk_sequences PRIMARY KEY (id),
    CONSTRAINT fk_sequences_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_sequences_prospect FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE CASCADE,
    CONSTRAINT chk_sequences_status CHECK (status IN ('draft', 'active', 'completed', 'paused'))
);

COMMENT ON TABLE sequences IS '시퀀스';
COMMENT ON COLUMN sequences.id IS '시퀀스 고유ID';
COMMENT ON COLUMN sequences.user_id IS '사용자 외래키';
COMMENT ON COLUMN sequences.prospect_id IS '고객사 외래키';
COMMENT ON COLUMN sequences.name IS '시퀀스 이름';
COMMENT ON COLUMN sequences.sequence_type IS '시퀀스 유형 (9_steps 고정)';
COMMENT ON COLUMN sequences.total_steps IS '전체 스텝 개수';
COMMENT ON COLUMN sequences.current_step IS '현재 진행 스텝';
COMMENT ON COLUMN sequences.status IS '시퀀스 상태 (draft/active/completed/paused)';
COMMENT ON COLUMN sequences.custom_context IS '마케터 강점 (나만의 무기)';
COMMENT ON COLUMN sequences.created_at IS '생성일시';
COMMENT ON COLUMN sequences.updated_at IS '수정일시';

-- 📨 step (이메일 스텝)
CREATE TABLE step (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    user_id UUID NOT NULL,
    sequence_id UUID NOT NULL,
    step_number INT NOT NULL,
    step_type VARCHAR(100),
    email_subject VARCHAR(255),
    email_body TEXT,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL,
    sent_at TIMESTAMPTZ,
    is_core_step BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT pk_step PRIMARY KEY (id),
    CONSTRAINT fk_step_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_step_sequence FOREIGN KEY (sequence_id) REFERENCES sequences(id) ON DELETE CASCADE,
    CONSTRAINT uq_step_sequence_number UNIQUE (sequence_id, step_number),
    CONSTRAINT chk_step_status CHECK (status IN ('pending', 'sent')),
    CONSTRAINT chk_step_number CHECK (step_number BETWEEN 1 AND 9)
);

COMMENT ON TABLE step IS '이메일 스텝';
COMMENT ON COLUMN step.id IS '스텝 고유ID';
COMMENT ON COLUMN step.user_id IS '사용자 외래키';
COMMENT ON COLUMN step.sequence_id IS '시퀀스 외래키';
COMMENT ON COLUMN step.step_number IS '스텝 순서 (1-9)';
COMMENT ON COLUMN step.step_type IS '스텝 유형';
COMMENT ON COLUMN step.email_subject IS '이메일 제목';
COMMENT ON COLUMN step.email_body IS '이메일 본문';
COMMENT ON COLUMN step.status IS '발송 상태 (pending/sent)';
COMMENT ON COLUMN step.sent_at IS '실제 발송일시';
COMMENT ON COLUMN step.is_core_step IS '1,3,6,9번 강조 표시';
COMMENT ON COLUMN step.created_at IS '생성일시';
COMMENT ON COLUMN step.updated_at IS '수정일시';

-- 📋 step_templates (스텝 템플릿)
CREATE TABLE step_templates (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    step_number INT NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    subject_template TEXT NOT NULL,
    body_template TEXT NOT NULL,
    description TEXT,
    variables JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT pk_step_templates PRIMARY KEY (id),
    CONSTRAINT uq_step_templates_number UNIQUE (step_number)
);

COMMENT ON TABLE step_templates IS '스텝 템플릿';
COMMENT ON COLUMN step_templates.id IS '템플릿 고유ID';
COMMENT ON COLUMN step_templates.step_number IS '스텝 순서 (1-9)';
COMMENT ON COLUMN step_templates.step_name IS '스텝 이름 (Hook, Problem, Value 등)';
COMMENT ON COLUMN step_templates.subject_template IS '이메일 제목 템플릿';
COMMENT ON COLUMN step_templates.body_template IS '이메일 본문 템플릿';
COMMENT ON COLUMN step_templates.description IS '템플릿 설명';
COMMENT ON COLUMN step_templates.variables IS 'AI가 채울 변수 목록';
COMMENT ON COLUMN step_templates.created_at IS '생성일시';

-- 📊 report_events (리포트 추적)
CREATE TABLE report_events (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    user_id UUID NOT NULL,
    prospect_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT pk_report_events PRIMARY KEY (id),
    CONSTRAINT fk_report_events_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_report_events_prospect FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE CASCADE,
    CONSTRAINT chk_report_events_type CHECK (event_type IN ('view', 'scroll_50', 'scroll_80', 'dwell_10s', 'dwell_30s'))
);

COMMENT ON TABLE report_events IS '리포트 추적';
COMMENT ON COLUMN report_events.id IS '이벤트 고유ID';
COMMENT ON COLUMN report_events.user_id IS '사용자 외래키';
COMMENT ON COLUMN report_events.prospect_id IS '고객사 외래키';
COMMENT ON COLUMN report_events.event_type IS '이벤트 종류 (view/scroll_50/scroll_80/dwell_10s/dwell_30s)';
COMMENT ON COLUMN report_events.metadata IS '이벤트 상세 정보 (스크롤 깊이, 체류시간 등)';
COMMENT ON COLUMN report_events.created_at IS '이벤트 발생일시';

-- 🤖 generation_logs (AI 생성 로그)
CREATE TABLE generation_logs (
    id UUID DEFAULT gen_random_uuid() NOT NULL,
    user_id UUID NOT NULL,
    prospect_id UUID NOT NULL,
    step_number INT,
    step_type VARCHAR(100),
    model_name VARCHAR(100),
    input_tokens INT,
    output_tokens INT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT pk_generation_logs PRIMARY KEY (id),
    CONSTRAINT fk_generation_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_generation_logs_prospect FOREIGN KEY (prospect_id) REFERENCES prospects(id) ON DELETE CASCADE
);

COMMENT ON TABLE generation_logs IS 'AI 생성 로그';
COMMENT ON COLUMN generation_logs.id IS '로그 고유ID';
COMMENT ON COLUMN generation_logs.user_id IS '사용자 외래키';
COMMENT ON COLUMN generation_logs.prospect_id IS '고객사 외래키';
COMMENT ON COLUMN generation_logs.step_number IS '생성된 스텝 번호';
COMMENT ON COLUMN generation_logs.step_type IS '스텝 유형';
COMMENT ON COLUMN generation_logs.model_name IS '사용된 AI 모델 (gemini-3.0-pro 등)';
COMMENT ON COLUMN generation_logs.input_tokens IS '입력 토큰 수';
COMMENT ON COLUMN generation_logs.output_tokens IS '출력 토큰 수';
COMMENT ON COLUMN generation_logs.created_at IS '로그 생성일시';

-- ================================================
-- 4. 인덱스 (성능 최적화)
-- ================================================
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_prospects_user_crm ON prospects(user_id, crm_status);
CREATE INDEX idx_prospects_url ON prospects(url);
CREATE INDEX idx_sequences_user_status ON sequences(user_id, status);
CREATE INDEX idx_step_sequence_num ON step(sequence_id, step_number);
CREATE INDEX idx_step_status ON step(status);
CREATE INDEX idx_report_events_prospect ON report_events(prospect_id, event_type);
CREATE INDEX idx_generation_logs_user ON generation_logs(user_id, created_at);

-- ================================================
-- 5. 트리거 (자동 updated_at 갱신)
-- ================================================
CREATE TRIGGER trg_users_update 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_prospects_update 
    BEFORE UPDATE ON prospects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_sequences_update 
    BEFORE UPDATE ON sequences 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_step_update 
    BEFORE UPDATE ON step 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_user_plans_update 
    BEFORE UPDATE ON user_plans 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 6. 초기 데이터 삽입
-- ================================================

-- 💳 요금제 초기 데이터
INSERT INTO plans (code, name, description, monthly_quota, price_krw, is_active) VALUES
('free', 'Free', '무료 체험 플랜 - 3개 분석 가능', 3, 0, true),
('starter', 'Starter', '개인 마케터용 - 월 30개', 30, 49000, true),
('pro', 'Pro', '에이전시용 - 월 100개', 100, 149000, true);

-- 📋 9단계 템플릿 초기 데이터
INSERT INTO step_templates (step_number, step_name, subject_template, body_template, description, variables) VALUES
(1, 'Hook', '[회사명] 상세페이지 본 마케터의 관찰', 
'안녕하세요, {{contact_name}} 대표님.

저는 {{brand_name}}의 상세페이지를 자세히 봤습니다.
특히 {{visual_usp}} 부분이 정말 인상적이었거든요.

다만 한 가지 아쉬운 점이 보여서 연락드렸습니다.
{{key_improvement}}

궁금하신 분석을 위해 간단한 분석 리포트를 준비했습니다.
{{report_link}}

감사합니다.
{{sender_name}}',
'첫 접촉 - 시각적 강점을 언급하며 후킹',
'["contact_name", "brand_name", "visual_usp", "key_improvement", "report_link", "sender_name"]'::jsonb),

(2, 'Problem', '요즘 {{category}} 카테고리의 공통적인 고민',
'안녕하세요 {{contact_name}} 대표님.

저는 지난 1년간 {{category}} 브랜드 50곳을 분석했는데,
거의 모두가 같은 고민을 가지고 있었습니다.

"광고비는 자꾸 올라가는데, 매출은 정체됐다"

특히 요즘 같은 시즌에는 {{seasonal_challenge}}
때문에 고객 이탈이 심한 상황이죠.

저희 클라이언트들도 다 그랬습니다.
그런데 {{insight_point}}를 개선하니까 달라졌어요.

혹시 {{brand_name}}도 비슷한 상황이신가요?

{{sender_name}}',
'업계 공통 문제점 제시',
'["contact_name", "category", "seasonal_challenge", "insight_point", "brand_name", "sender_name"]'::jsonb),

(3, 'Value', '{{brand_name}} 상세페이지 개선 분석 리포트',
'안녕하세요 {{contact_name}} 대표님.

{{brand_name}}의 상세페이지에서 발견한 3가지 기회:

1️⃣ {{improvement_1}}
{{detail_1}}

2️⃣ {{improvement_2}}
{{detail_2}}

3️⃣ {{improvement_3}}
{{detail_3}}

이 분석을 정리한 리포트를 준비했습니다.
{{report_link}}

{{sender_name}}',
'구체적 개선점 제시 (코어 스텝)',
'["contact_name", "brand_name", "improvement_1", "detail_1", "improvement_2", "detail_2", "improvement_3", "detail_3", "report_link", "sender_name"]'::jsonb),

(4, 'Check-in', '리포트 어떠셨나요?',
'안녕하세요 {{contact_name}} 대표님.

어제 보내드린 리포트 봐주셨나요?
혹시 어떤 부분이 가장 관심 가셨는지 궁금합니다.

편하실 때 한 줄만 남겨주세요.

{{sender_name}}',
'가벼운 체크인',
'["contact_name", "sender_name"]'::jsonb),

(5, 'Education', '{{category}} 상세페이지 "잘 팔리는" 3가지 특징',
'안녕하세요 {{contact_name}} 대표님.

저희가 분석한 {{category}} 브랜드 중
"올해 신규 고객 100만 명 이상 확보한" 회사들의
공통점을 정리했습니다.

📌 특징 1: {{feature_1}}
{{detail_1}}

📌 특징 2: {{feature_2}}
{{detail_2}}

📌 특징 3: {{feature_3}}
{{detail_3}}

혹시 {{brand_name}}도 이 중 하나라도 적용 고려 중이신가요?

{{sender_name}}',
'업계 성공 사례 교육',
'["contact_name", "category", "feature_1", "detail_1", "feature_2", "detail_2", "feature_3", "detail_3", "brand_name", "sender_name"]'::jsonb),

(6, 'Proof', '{{similar_brand}} 사례 - 3개월만에 신규 고객 2배',
'안녕하세요 {{contact_name}} 대표님.

실제로 개선을 적용한 클라이언트 사례를 공유합니다.

📊 {{similar_brand}} - {{category}} 브랜드

Before:
- 월 신규 고객: {{before_customers}}
- CAC: {{before_cac}}

After:
- 월 신규 고객: {{after_customers}}
- CAC: {{after_cac}}

핵심은 {{key_change}}: {{change_detail}}

{{brand_name}}도 비슷한 포지셔닝이라
같은 효과를 기대해볼 수 있을 것 같습니다.

{{sender_name}}',
'구체적 수치로 증명 (코어 스텝)',
'["contact_name", "similar_brand", "category", "before_customers", "before_cac", "after_customers", "after_cac", "key_change", "change_detail", "brand_name", "sender_name"]'::jsonb),

(7, 'Objection', '흔한 오해 3가지 vs 현실',
'안녕하세요 {{contact_name}} 대표님.

지난 주 여러 분께서 비슷한 의문을 주셔서,
정리해서 공유합니다.

❌ 오해 1: {{objection_1}}
✅ 현실: {{reality_1}}

❌ 오해 2: {{objection_2}}
✅ 현실: {{reality_2}}

❌ 오해 3: {{objection_3}}
✅ 현실: {{reality_3}}

혹시 다른 궁금한 점이 있으신가요?
편하게 연락 주세요.

{{sender_name}}',
'예상 반론 해소',
'["contact_name", "objection_1", "reality_1", "objection_2", "reality_2", "objection_3", "reality_3", "sender_name"]'::jsonb),

(8, 'Bump', '마지막 리마인드',
'안녕하세요 {{contact_name}} 대표님.

저희 이번 달 TO가 거의 찼습니다.
혹시 이전 분석 기억하시나요?

다시 한 번 리포트 링크 남깁니다.
{{report_link}}

{{sender_name}}',
'부드러운 재촉',
'["contact_name", "report_link", "sender_name"]'::jsonb),

(9, 'Last Call', '감사합니다. 그리고...',
'안녕하세요 {{contact_name}} 대표님.

지난 3주간 여러 번 연락드렸는데,
이번이 마지막 메일이 될 것 같습니다.

바쁘신 와중에도 시간 내주신 것,
정말 감사합니다.

한 가지 남기고 싶은 말은:

"필요하실 때 언제든 연락 주세요.
저희는 항상 이 자리에 있을 겁니다."

화이팅하세요.

{{sender_name}}
{{contact_info}}',
'정중한 마무리 (코어 스텝)',
'["contact_name", "sender_name", "contact_info"]'::jsonb);

-- ================================================
-- 완료 메시지
-- ================================================
DO $$
BEGIN
    RAISE NOTICE '✅ LinkPitch MVP v5.1 데이터베이스 설정 완료!';
    RAISE NOTICE '📋 테이블: users, plans, user_plans, prospects, sequences, step, step_templates, report_events, generation_logs';
    RAISE NOTICE '📊 초기 데이터: 3개 요금제, 9개 이메일 템플릿';
    RAISE NOTICE '🔍 인덱스: 8개 성능 최적화 인덱스';
    RAISE NOTICE '🔔 트리거: 5개 자동 updated_at 갱신';
END $$;