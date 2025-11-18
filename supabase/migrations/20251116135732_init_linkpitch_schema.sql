-- Linkpitch Supabase 초기 스키마 (MVP용 안정 버전)
-- --------------------------------------------------
-- 전제:
--  - user_id = Clerk userId (text)
--  - JWT의 sub(또는 설정한 claim) == user_id 로 RLS에서 매칭 (출시 전 활성화 예정)
--  - gen_random_uuid() 사용 (Supabase는 기본 지원, 그래도 안전하게 pgcrypto 활성화)
--
-- ⚠️ RLS 상태:
--  - 현재 RLS는 비활성화되어 있음 (개발 편의성)
--  - 출시 전에 반드시 RLS 활성화 및 정책 적용 필요
--  - RLS 활성화 방법은 하단 주석 참고

create extension if not exists "pgcrypto";

--------------------------------------------------
-- 1. Prospects (타겟 브랜드/담당자)
--------------------------------------------------

create table if not exists public.prospects (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,              -- Clerk userId
  name text not null,                 -- 브랜드명
  contact_name text,                  -- 담당자명 (optional)
  contact_email text,                 -- 담당자 이메일 (optional)
  url text not null,                  -- 스토어/사이트 URL
  memo text,
  created_at timestamptz not null default now()
);

-- 같은 유저가 동일 URL로 Prospect를 여러 번 만들지 않게 (원하면 주석 처리해도 됨)
create unique index if not exists idx_prospects_user_url
  on public.prospects(user_id, url);

create index if not exists idx_prospects_user_created
  on public.prospects(user_id, created_at desc);

--------------------------------------------------
-- 2. Sequences (시퀀스 메타: 4통 / 9통, 진행상태)
--------------------------------------------------

create table if not exists public.sequences (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  sequence_type text not null,   -- '4_step' / '9_step'
  total_steps int not null check (total_steps > 0),
  current_step int not null default 1 check (current_step >= 1),
  created_at timestamptz not null default now()
);

create index if not exists idx_sequences_user
  on public.sequences(user_id, created_at desc);

create index if not exists idx_sequences_prospect
  on public.sequences(prospect_id);

--------------------------------------------------
-- 3. Steps (시퀀스 내 개별 메일 Step)
--------------------------------------------------

create table if not exists public.steps (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  sequence_id uuid not null references public.sequences(id) on delete cascade,
  step_number int not null check (step_number >= 1),
  step_type text not null,              -- 템플릿 타입 / 라벨 (예: 문제정의, 소프트 CTA 등)

  email_subject text,
  email_body text,

  status text not null default 'pending'
    check (status in ('pending','sent','replied','skipped')),

  sent_at timestamptz,
  recommended_send_at timestamptz,

  is_opened bool not null default false,
  opened_at timestamptz,
  is_replied bool not null default false,
  replied_at timestamptz,

  has_clicked_report bool not null default false,
  report_engagement_level text not null default 'none'
    check (report_engagement_level in ('none','cold','warm','hot')),
  last_report_view_seconds int,
  last_report_scroll_depth int,

  created_at timestamptz not null default now()
);

-- 한 시퀀스 내에서 step_number는 1,2,3.. 하나씩만 존재하도록 (데이터 안정성)
create unique index if not exists idx_steps_sequence_step_number
  on public.steps(sequence_id, step_number);

create index if not exists idx_steps_user
  on public.steps(user_id, created_at desc);

create index if not exists idx_steps_sequence
  on public.steps(sequence_id);

create index if not exists idx_steps_status_recommended
  on public.steps(user_id, status, recommended_send_at);

--------------------------------------------------
-- 4. Generation Logs (생성 요청/응답 로그)
--------------------------------------------------

create table if not exists public.generation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  prospect_id uuid references public.prospects(id) on delete set null,
  step_id uuid references public.steps(id) on delete set null,

  step_type text,                  -- 어떤 Step 타입을 생성했는지 (optional)
  input_payload jsonb,             -- n8n/LLM에 넘긴 전체 입력
  output_insights jsonb,           -- 생성된 인사이트(구조화)
  output_email_subject text,       -- 생성된 제목
  output_email_body text,          -- 생성된 본문

  created_at timestamptz not null default now()
);

create index if not exists idx_generation_logs_user_created
  on public.generation_logs(user_id, created_at desc);

--------------------------------------------------
-- 5. Reports (Step별 리포트 콘텐츠)
--------------------------------------------------

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  step_id uuid not null references public.steps(id) on delete cascade,

  report_json jsonb not null,      -- 리포트 전체 내용 (텍스트/블록 구조)
  created_at timestamptz not null default now()
);

create index if not exists idx_reports_user_step
  on public.reports(user_id, step_id);

--------------------------------------------------
-- 6. Report Events (리포트 행동 로그: view/dwell/scroll 등)
--------------------------------------------------

create table if not exists public.report_events (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  report_id uuid not null references public.reports(id) on delete cascade,
  step_id uuid not null references public.steps(id) on delete cascade,

  dwell_seconds int,              -- 머문 시간(초)
  scroll_depth int,               -- 스크롤 깊이(%)
  interacted bool not null default false, -- 탭/클릭 등

  created_at timestamptz not null default now()
);

create index if not exists idx_report_events_user_created
  on public.report_events(user_id, created_at desc);

create index if not exists idx_report_events_report
  on public.report_events(report_id);

--------------------------------------------------
-- 7. (선택) Plan & User Plan – Basic/Standard/Pro 대비용
--    → 나중에 결제 붙일 때 쓰기 위한 기초 스키마
--------------------------------------------------

create table if not exists public.plans (
  code text primary key,          -- 'basic', 'standard', 'pro' 등
  name text not null,             -- 표시용 이름
  monthly_quota int not null,     -- 월 생성 한도 (건수)
  price_krw int not null,         -- 가격 (원)
  is_active bool not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.user_plans (
  user_id text primary key,       -- Clerk userId
  plan_code text not null references public.plans(code),
  started_at timestamptz not null default now(),
  renews_at timestamptz,          -- 갱신일 (옵션, 결제 붙일 때 사용)
  is_free_trial bool not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_plans_plan
  on public.user_plans(plan_code);

--------------------------------------------------
-- 8. RLS (Row Level Security) 설정
--    JWT의 sub(또는 세팅한 claim) = user_id 라는 전제
--
-- ⚠️ 중요: 현재는 RLS가 비활성화되어 있습니다.
--    출시 전에 반드시 RLS를 활성화하고 정책을 적용해야 합니다.
--
-- RLS 활성화 방법:
--   1. 아래 주석 처리된 구문들의 주석을 해제
--   2. Supabase Dashboard에서 Clerk JWT를 External JWT로 설정
--      (Authentication → Providers → External JWT)
--   3. JWT claim mapping: sub → user_id
--
-- TODO: 출시 전 RLS 활성화 필수
--------------------------------------------------

-- 테이블별 RLS 활성화 (출시 전 활성화 예정)
-- alter table public.prospects       enable row level security;
-- alter table public.sequences       enable row level security;
-- alter table public.steps           enable row level security;
-- alter table public.generation_logs enable row level security;
-- alter table public.reports         enable row level security;
-- alter table public.report_events   enable row level security;
-- alter table public.user_plans      enable row level security;
-- alter table public.plans           enable row level security;

-- Helper: 현재 JWT의 sub를 user_id로 쓴다고 가정
-- (Clerk 외부 JWT 연동 시, Supabase 설정에서 이 claim을 맞춰줘야 함)

-- RLS 정책 생성 (출시 전 활성화 예정)
-- 아래 정책들은 RLS 활성화 후 주석을 해제하여 적용해야 합니다.

-- Prospects
-- create policy "select_own_prospects"
--   on public.prospects
--   for select
--   using (request.jwt.claims.sub = user_id);
--
-- create policy "modify_own_prospects"
--   on public.prospects
--   for all
--   using (request.jwt.claims.sub = user_id)
--   with check (request.jwt.claims.sub = user_id);

-- Sequences
-- create policy "select_own_sequences"
--   on public.sequences
--   for select
--   using (request.jwt.claims.sub = user_id);
--
-- create policy "modify_own_sequences"
--   on public.sequences
--   for all
--   using (request.jwt.claims.sub = user_id)
--   with check (request.jwt.claims.sub = user_id);

-- Steps
-- create policy "select_own_steps"
--   on public.steps
--   for select
--   using (request.jwt.claims.sub = user_id);
--
-- create policy "modify_own_steps"
--   on public.steps
--   for all
--   using (request.jwt.claims.sub = user_id)
--   with check (request.jwt.claims.sub = user_id);

-- Generation Logs (읽기/추가만 필요)
-- create policy "select_own_generation_logs"
--   on public.generation_logs
--   for select
--   using (request.jwt.claims.sub = user_id);
--
-- create policy "insert_own_generation_logs"
--   on public.generation_logs
--   for insert
--   with check (request.jwt.claims.sub = user_id);

-- Reports
-- create policy "select_own_reports"
--   on public.reports
--   for select
--   using (request.jwt.claims.sub = user_id);
--
-- create policy "modify_own_reports"
--   on public.reports
--   for all
--   using (request.jwt.claims.sub = user_id)
--   with check (request.jwt.claims.sub = user_id);

-- Report Events (insert + select)
-- create policy "select_own_report_events"
--   on public.report_events
--   for select
--   using (request.jwt.claims.sub = user_id);
--
-- create policy "insert_own_report_events"
--   on public.report_events
--   for insert
--   with check (request.jwt.claims.sub = user_id);

-- User Plans: 본인만 조회/수정
-- create policy "select_own_user_plans"
--   on public.user_plans
--   for select
--   using (request.jwt.claims.sub = user_id);
--
-- create policy "modify_own_user_plans"
--   on public.user_plans
--   for all
--   using (request.jwt.claims.sub = user_id)
--   with check (request.jwt.claims.sub = user_id);

-- Plans: 모든 유저가 읽을 수 있다고 가정 (price/limit 정보 공개)
-- create policy "select_plans_public"
--   on public.plans
--   for select
--   using (true);

-- plans는 앱 내부에서만 수정하므로, 별도 modify 정책은 만들지 않고
-- service_role 또는 관리용 SQL에서만 변경한다.
