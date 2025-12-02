# LinkPitch MVP v5.1 – 개발 TODO

> 📋 **참고 문서**: [PRD.md](./PRD.md) | [DEV_GUIDE.md](./DEV_GUIDE.md) | [DESIGN_PLAN.md](./DESIGN_PLAN.md)

---

## Week 1 – 프로젝트 기반 세팅 & 큰 뼈대 잡기

> 🎯 Goal: LinkPitch용 Next.js + Clerk + Supabase 기본 뼈대를 올리고, 디자인 시스템을 적용한다.

### 프로젝트 초기 설정

- [x] Next.js 보일러플레이트 클린업

  - [x] 불필요한 샘플 페이지/컴포넌트 삭제
  - [x] `app/` 구조를 PRD와 맞게 정리 (`/`, `/dashboard`, `/prospects/new`, `/prospects/[id]/mix`, `/r/[id]` 등)

- [x] 공통 레이아웃/폴더 구조 설계 (모듈화)
  - [x] `app/app/layout.tsx`에 **App Shell** 구성 (`AppShell` 컴포넌트 사용)
  - [x] `components/layout/` 폴더 구조 확인 (`app-header.tsx`, `app-sidebar.tsx`, `app-shell.tsx` 등)
  - [x] `components/ui/`에 버튼/카드 등 shadcn 기본 셋업

### 디자인 시스템 적용 (DESIGN_PLAN.md 기준)

- [x] 스타일 시스템 세팅
  - [x] Tailwind CSS v4 설정 확인 (`app/globals.css`만 사용, `tailwind.config` 없음)
  - [x] **DESIGN_PLAN.md** 컬러 시스템 적용 (zinc-950/900/800, indigo-500, rose-500 등)
  - [x] **DESIGN_PLAN.md** 타이포그래피 설정 (Inter 폰트, 모노스페이스 폰트)
  - [x] **DESIGN_PLAN.md** 애니메이션 타이밍 변수 설정 (150ms, 200ms, cubic-bezier)

### 인증 및 데이터베이스

- [x] Clerk 기본 연동

  - [x] `@clerk/nextjs` 설치 및 `.env`에 키 세팅
  - [x] `app/layout.tsx`에 `<ClerkProvider>` 래핑
  - [x] Clerk → Supabase 사용자 동기화 구현
    - [x] `components/providers/sync-user-provider.tsx` 구현
    - [x] `hooks/use-sync-user.ts` 구현 (사용자 동기화 훅)
    - [x] `app/api/sync-user/route.ts` 구현 (동기화 API 라우트)
    - [x] `app/layout.tsx`에 `<SyncUserProvider>` 래핑
  - [x] `middleware.ts`에서 보호된 라우트 설정 완료 (공개 라우트 외 모든 경로 보호)

- [x] Supabase 클라이언트 기본 셋업

  - [x] `lib/supabase/` 폴더 구조 설정
    - `clerk-client.ts`: Client Component용 (useClerkSupabaseClient hook)
    - `server.ts`: Server Component/Server Action용 (createClerkSupabaseClient)
    - `service-role.ts`: 관리자 권한 작업용 (RLS 우회)
    - `client.ts`: 인증 불필요한 공개 데이터용
  - [x] `.env.example`에 Supabase 관련 키 정의 (N8N_WEBHOOK_URL, OPENAI_API_KEY 포함)
  - [x] RLS 비활성화 (개발 편의성, 출시 전 활성화 예정)

- [x] Supabase 모델 레이어 구현
  - [x] `lib/server/prospects.ts` – `createProspect`, `listProspectsByUser`
  - [x] `lib/server/sequences.ts` – `createSequence`, `updateCurrentStep`
  - [x] `lib/server/steps.ts` – `createStep`, `updateStepStatus` 등
  - [x] Supabase 스키마 마이그레이션 파일 생성 (`supabase/migrations/`)
    - [x] `20251119101409_init_linkpitch_schema.sql` - 전체 테이블 스키마 정의
    - [x] `20251119101708_create_storage_bucket.sql` - Storage 버킷 생성
  - [x] 테스트 데이터 시딩 스크립트 구현 (`scripts/seed-test-data.ts`)

---

## Week 2 – 랜딩 페이지 + 대시보드 기본 골격

> 🎯 Goal: 외부 노출용 랜딩 페이지와, 로그인 후 `/dashboard` 기본 레이아웃을 완성한다.

### 랜딩 페이지

- [x] 랜딩 페이지 `/` 구현
  - [x] Hero 섹션: 문제 정의 + 핵심 가치 한 줄 + CTA 버튼
  - [x] "어떻게 동작하나" 3단계 섹션 (입력 → 생성 → 관리)
- [x] 파운더스 플랜/가격 섹션 기본 틀 (추후 카피만 교체 가능하게 컴포넌트화)
  - MVP 룰: 단일 Founders 플랜만 노출, CTA는 대기 리스트/문의 폼으로 연결, 최초 스크롤 내에서 가볍게 노출
  - 구성 요소: 섹션 헤더(타이틀/설명/뱃지), 카드(가격, 월간/연별 라벨, 핵심 혜택, 보너스 태그), CTA 버튼, FAQ 진입 안내 문구
  - 데이터 필드: `id`, `name`, `tagline`, `price`, `period`, `ctaLabel`, `ctaHref`, `benefits[]`, `badge`, `note`, `logEvent`
  - 상호작용 로깅: CTA/FAQ 클릭 시 `console.log('pricing-cta-click',{ planId })` 형태로 단일 헬퍼에서 추적

### 대시보드 기본 구조

- [x] `/dashboard` 대시보드 기본 골격
  - [x] `app/dashboard/page.tsx`에서 기본 카드 레이아웃 구현
  - [x] 대시보드용 공통 카드 컴포넌트 분리 (`DashboardCard` 등)
    - KPI variant/타입 정의 (`types/dashboard.ts`, `lib/dashboard-card-variants.ts`) 및 `/app` 카드에 적용
  - [x] KPI 카드 카피 vA 적용 (관리 중인 타겟, 당장 연락할 곳🔥 등)

### 인증 UX

- [x] Auth UX
  - [x] `/signin`, `/signup` 라우트(Clerk 컴포넌트) 연결
  - [x] 랜딩 CTA에서 로그인 상태에 따라 `/signin` or `/dashboard`로 라우팅
  - [x] `/dashboard` 접근 시 미로그인 → 로그인 페이지로 리다이렉트 되는지 확인

### 네비게이션/레이아웃

- [x] 네비게이션/레이아웃 안정화
  - [x] 사이드바 메뉴 항목 구성: Dashboard / Prospects / Sequences / (Settings)
  - [x] 현재 페이지에 따라 Active 스타일 적용
    - `/app` 루트와 하위 경로 분리 로직으로 대시보드 버튼 상시 활성화 문제 해결
  - [ ] 모바일/작은 화면에서 최소한의 대응 (사이드바 접힘 정도)

---

## Week 3 – Vision 분석 및 Prospect 등록

> 🎯 Goal: URL 입력 → Vision AI 분석 → Prospect 등록 플로우를 완성한다. (PRD 3.1)

### 타입 정의 (DEV_GUIDE.md 2장 기준)

- [x] 타입 정의 완료
  - [x] `types/prospect.ts` – `Prospect`, `VisionData`, `CRMStatus`
  - [x] `types/sequence.ts` – `Sequence`, `SequenceStatus`
  - [x] `types/step.ts` – `Step`, `StepStatus`
  - [x] `types/report-event.ts` – `ReportEvent`, `ReportEventType`

### Vision 분석 페이지 (`/prospects/new`)

- [ ] Vision 분석 UI 구현
  - [ ] URL 입력 필드 (DESIGN_PLAN.md 스타일: border-bottom 스타일)
  - [ ] **AnalysisTerminal 컴포넌트** 구현 (`components/mixer/AnalysisTerminal.tsx`)
    - [ ] 터미널 스타일 로딩 UI (검은 배경, 모노스페이스 폰트)
    - [ ] Framer Motion으로 로그 순차 출력 애니메이션
    - [ ] 로그 시나리오: Connecting... → Capturing screenshot... → Uploading to Gemini... → Extracting USP... → Building report...

### Server Actions (DEV_GUIDE.md 4장 기준)

- [ ] `app/actions/analyze-url.ts` 구현
  - [ ] n8n `/webhook/analyze-url` 호출 로직
  - [ ] `prospects` 테이블에 `vision_data` 저장
  - [ ] 분석 완료 후 `/prospects/[id]/mix`로 자동 리다이렉트

### 에러 핸들링

- [ ] 에러 핸들링/로딩 상태
  - [ ] 생성 중 로딩 스피너/상태 표시 (터미널 뷰)
  - [ ] API 에러 시 사용자 친화적인 메시지 + 재시도 버튼

---

## Week 4 – 인사이트 믹서 (Insight Mixer) 핵심 UI

> 🎯 Goal: `/prospects/[id]/mix` 페이지의 핵심 기능을 구현한다. (PRD 3.3, DEV_GUIDE.md 3.2)

### 상태 관리 (Zustand)

- [ ] `store/mixer-store.ts` 구현
  - [ ] `customContext` 상태 관리
  - [ ] `isDragging` 상태 관리
  - [ ] `setCustomContext`, `setIsDragging` 액션

### 좌측 사이드바: Strategy Console

- [ ] `components/mixer/StrategyConsole.tsx` 구현
  - [ ] **Vision Fact 카드**: `vision_data`에서 추출한 USP, Mood 등을 카드 형태로 표시 (읽기 전용)
  - [ ] **Custom Context Input**: Textarea (DESIGN_PLAN.md 스타일: border-bottom)
    - [ ] Placeholder: "당신의 강점을 입력하세요. 예: 지난 3개월간 뷰티 브랜드 5곳의 ROAS를 평균 280% 개선..."
    - [ ] `sequences.custom_context`에 저장 로직
  - [ ] **Strategy Chips**: 드래그 가능한 Badge 리스트
    - [ ] 일반 텍스트 칩: "🎯 경쟁사 분석", "📈 데이터 근거"
    - [ ] 이미지 칩: "📷 성과 그래프", "📂 포트폴리오"
    - [ ] `components/mixer/StrategyChip.tsx` 구현 (dnd-kit `useDraggable`)

### 우측 메인: Sequence Playlist

- [ ] `components/mixer/SequencePlaylist.tsx` 구현

  - [ ] DndContext 설정 (`@dnd-kit/core`)
  - [ ] 9개 Step 카드 렌더링
  - [ ] 드래그 앤 드롭 핸들러 (`handleDragEnd`)
    - [ ] Chip 드롭 시 `regenerateStepAction` 호출
    - [ ] Loading 상태 관리 (`loadingStepId`)

- [ ] `components/mixer/StepCard.tsx` 구현
  - [ ] Droppable 영역 설정 (`useDroppable`)
  - [ ] Step 헤더 (Step Number + Type, Core Step 강조)
  - [ ] **Dual-View 탭 구조**:
    - [ ] Tab 1: ✉️ 예고편 (Email Editor)
      - [ ] `email_subject` 입력 필드
      - [ ] `email_body` Textarea
      - [ ] [Copy & Log] 버튼 (Optimistic UI)
    - [ ] Tab 2: 🖥️ 본편 (Web Report Preview)
      - [ ] 리포트 미리보기 (실제 `/r/[prospect_id]`와 동일한 렌더링)

### Server Actions

- [ ] `app/actions/generate-sequence.ts` 구현

  - [ ] n8n `/webhook/generate-sequence` 호출
  - [ ] `sequences` 테이블에 INSERT
  - [ ] `step` 테이블에 9개 Step 일괄 INSERT

- [ ] `app/actions/regenerate-step.ts` 구현

  - [ ] Step 데이터 조회 (sequence, prospect 포함)
  - [ ] n8n `/webhook/regenerate-step` 호출
  - [ ] `step.email_body` 업데이트
  - [ ] 이미지 칩 처리: `[ 📷 여기에 (성과 그래프) 이미지를 붙여넣으세요 ]` 마커 삽입

- [ ] `app/actions/update-step-status.ts` 구현
  - [ ] `step.status = 'sent'` 업데이트
  - [ ] `sent_at` 타임스탬프 기록

### Optimistic UI

- [ ] `components/mixer/CopyButton.tsx` 구현
  - [ ] 즉시 UI 업데이트 (체크 표시 + Dimmed)
  - [ ] `navigator.clipboard.writeText()` 실행
  - [ ] Sonner toast 알림
  - [ ] 백그라운드 DB 업데이트

---

## Week 5 – 미니 CRM 대시보드

> 🎯 Goal: `/dashboard`에 고밀도 테이블로 Prospects를 관리하는 CRM UI를 구현한다. (PRD 3.2)

### CRM 테이블 UI (DESIGN_PLAN.md 고밀도 테이블 스타일)

- [ ] `components/dashboard/ProspectsTable.tsx` 구현
  - [ ] 컬럼: 회사명 | URL | CRM 상태 | 재방문 | 마지막 조회 | 등록일
  - [ ] **CRM 상태 Badge** (DESIGN_PLAN.md 스타일):
    - [ ] 🔥 Hot: `bg-rose-500/10 text-rose-500`
    - [ ] 🔶 Warm: `bg-amber-500/10 text-amber-500`
    - [ ] ❄️ Cold: `bg-zinc-700 text-zinc-400`
  - [ ] 정렬 로직:
    1. 🔥 Hot + 🔄 Re-visit (재접속자)
    2. 🔥 Hot (정독한 사람)
    3. Recent (최근 등록)
  - [ ] 필터: Cold/Warm/Hot 토글

### 데이터 페칭

- [ ] `lib/server/prospects.ts` 확장
  - [ ] `listProspectsByUserWithStatus` (CRM 상태별 필터링)
  - [ ] 정렬 로직 구현 (Hot + Re-visit 우선)

---

## Week 6 – 리포트 페이지 및 행동 추적

> 🎯 Goal: `/r/[prospect_id]` 리포트 페이지를 구현하고, 행동 추적 로직을 완성한다. (PRD 3.4, DEV_GUIDE.md 3.3)

### 리포트 페이지 UI

- [ ] `app/r/[id]/page.tsx` 구현

  - [ ] Server Component로 Prospect 데이터 페칭
  - [ ] `components/report/ReportViewer.tsx` 렌더링

- [ ] `components/report/ReportViewer.tsx` 구현
  - [ ] **Hero Section**: `report_title` (H1)
  - [ ] **Deep Dive (Analysis)**: `visual_analysis_text`, `visual_usp` 리스트
  - [ ] **Opportunity Section**: `opportunity_text`
  - [ ] **Solution (Your Strength)**: `custom_context` (마케터 강점)
  - [ ] **Floating CTA**: "미팅 신청하기" 버튼
  - [ ] PC 업무 환경에 최적화된 전문 제안서 스타일

### 행동 추적 로직

- [ ] `hooks/use-report-tracking.ts` 구현 (DEV_GUIDE.md 3.3.B 기준)

  - [ ] **View Logging**: 페이지 접속 즉시 기록
  - [ ] **Dwell Timer**: 10초, 30초 체류 감지
  - [ ] **Scroll Tracking**: 50%, 80% 스크롤 감지 (Debounce 300ms)

- [ ] `app/actions/log-report-event.ts` 구현 (DEV_GUIDE.md 4.4 기준)
  - [ ] `report_events` 테이블에 INSERT
  - [ ] **CRM 상태 승격 규칙**:
    - [ ] Warm: `scroll_50` AND `dwell_10s`
    - [ ] Hot: `scroll_80` AND `dwell_30s`
  - [ ] **재방문 감지**: 1시간 경과 시 `visit_count++`

---

## Week 7 – 시퀀스 관리 및 발송 기록

> 🎯 Goal: 시퀀스 리스트와 발송 기록 관리 기능을 완성한다.

### 시퀀스 리스트

- [ ] `/app/sequences` – 시퀀스 리스트 뷰

  - [ ] 한 행 = 하나의 Sequence(타겟)
  - [ ] 컬럼: Prospect명, 시퀀스 타입(9통), 진행 단계, 보낸 메일 수, 마지막 보낸 시각, 다음 발송 예정일
  - [ ] 정렬: 기본 `다음 발송 예정일` 오름차순

- [ ] `/app/sequences/[id]` – 타겟 상세 & 히스토리
  - [ ] 상단: Prospect/Sequence 요약 (브랜드명, 담당자, 현재 단계 등)
  - [ ] 하단: Step별 카드 리스트
    - [ ] Step 번호/라벨
    - [ ] 보낸 시각, 읽음/회신 상태
    - [ ] [본문 펼치기]로 email_body 전체 보기

### 발송 기록

- [ ] 수동 발송 기록 UI
  - [ ] Step 카드에서 `status = 'sent'` 수동 토글 가능
  - [ ] 토글 시 Supabase `steps` 상태 필드 업데이트

---

## Week 8 – 폴리싱 & 베타 준비

> 🎯 Goal: 전체 코드 구조를 정리하고 베타 테스트 가능한 상태로 만든다.

### 리팩토링 & 모듈화 점검

- [ ] `components/` 구조 정리

  - [ ] `layout/` – 레이아웃 컴포넌트
  - [ ] `ui/` – shadcn 컴포넌트
  - [ ] `providers/` – React Context 프로바이더
  - [ ] `dashboard/` – 대시보드 관련
  - [ ] `mixer/` – 인사이트 믹서 관련
  - [ ] `report/` – 리포트 관련

- [ ] 서버 로직 정리

  - [ ] `lib/server/*` 정리, 중복 쿼리/유틸 함수 통합
  - [ ] `actions/` 폴더 활용 검토 (Server Actions 우선 사용)

- [ ] 타입 정의 정리
  - [ ] `types/*` 정리 – API 응답/DB 모델/프론트 모델 분리

### 성능 최적화

- [ ] 리포트 페이지 스크롤 이벤트 Debounce 처리 확인
- [ ] 이미지 최적화 (리포트 이미지 lazy loading)
- [ ] 코드 스플리팅 (필요 시)

### 안정성 체크 & 베타 준비

- [ ] 주요 경로에 대한 수동 테스트:
  - [ ] Vision 분석 → Prospect 등록 → 인사이트 믹서 → 리포트 생성 → 행동 추적
- [ ] 에러 화면/빈 상태(Empty state) 처리
- [ ] .env, README/PRD/TODO/DEV_GUIDE/DESIGN_PLAN.md 최신 상태로 정리
- [ ] Supabase 마이그레이션 파일 정리 (`supabase/migrations/` 형식 확인)

### 디자인 시스템 최종 점검

- [ ] DESIGN_PLAN.md의 모든 컴포넌트 패턴 적용 확인
- [ ] 애니메이션 타이밍 (150ms, 200ms) 일관성 확인
- [ ] 컬러 시스템 일관성 확인 (zinc, indigo, rose)

---

## 추가 체크리스트 (DEV_GUIDE.md 5장 기준)

### 필수 패키지 설치 확인

- [ ] framer-motion
- [x] lucide-react
- [ ] clsx, tailwind-merge
- [ ] @dnd-kit/core, @dnd-kit/utilities, @dnd-kit/sortable
- [ ] zustand
- [ ] date-fns
- [ ] sonner
- [ ] @clerk/nextjs

### 환경 변수 설정

- [ ] `.env.local`에 Clerk 키 설정
- [ ] `.env.local`에 Supabase 키 설정
- [ ] `.env.local`에 n8n Webhook URL 설정
  - [ ] `N8N_WEBHOOK_ANALYZE_URL`
  - [ ] `N8N_WEBHOOK_GENERATE_SEQUENCE`
  - [ ] `N8N_WEBHOOK_REGENERATE_STEP`

---

## 성공 지표 (PRD 8장 기준)

### MVP 검증

- [ ] 1명의 마케터가 3개 Prospect 등록 완료
- [ ] 9개 Step 생성 및 5개 이상 Copy & Log
- [ ] 1개 이상의 Hot Lead 전환 (80% 스크롤 + 30초 체류)

### 제품 완성도

- [ ] Vision 분석 완료율 95% 이상 (에러율 5% 이하)
- [ ] 드래그 앤 드롭 성공률 100%
- [ ] 리포트 페이지 로딩 속도 2초 이하
