# Linkpitch – 8주 웹 프로젝트 TODO
---
## Week 1 – 프로젝트 기반 세팅 & 큰 뼈대 잡기

> 🎯 Goal: Linkpitch용 Next.js + Clerk + Supabase 기본 뼈대를 올리고, `/`·`/app` 구조를 잡는다.

- [x] Next.js 보일러플레이트 클린업  
  - [x] 불필요한 샘플 페이지/컴포넌트 삭제  
  - [x] `app/` 구조를 PRD와 맞게 정리 (`/`, `/app`, `/r/[id]` 등)

- [x] 공통 레이아웃/폴더 구조 설계 (모듈화)
  - [x] `app/app/layout.tsx`에 **App Shell** 구성  
        (`AppShell` 컴포넌트 사용)
  - [x] `components/layout/` 폴더 구조 확인
        (`app-header.tsx`, `app-sidebar.tsx`, `app-shell.tsx` 등 재사용 가능하게 나누기)
  - [x] `components/ui/`에 버튼/카드 등 shadcn 기본 셋업

- [x] 스타일 시스템 세팅
  - [x] Tailwind CSS v4 설정 확인 (`app/globals.css`만 사용, `tailwind.config` 없음)  
  - [ ] 폰트/컬러 토큰 기본값 정리 (나중에 브랜드 확장 고려)

- [x] Clerk 기본 연동
  - [x] `@clerk/nextjs` 설치 및 `.env`에 키 세팅  
  - [x] `app/layout.tsx`에 `<ClerkProvider>` 래핑  
  - [x] `components/providers/sync-user-provider.tsx` 구현 (Clerk → Supabase 사용자 동기화)
  - [x] `hooks/use-sync-user.ts` 구현 (사용자 동기화 훅)
  - [x] `middleware.ts`에서 `/app/**`, `/api/**` 보호 설정 완료

- [x] Supabase 클라이언트 기본 셋업
  - [x] `lib/supabase/` 폴더 구조 설정
    - `clerk-client.ts`: Client Component용 (useClerkSupabaseClient hook)
    - `server.ts`: Server Component/Server Action용 (createClerkSupabaseClient)
    - `service-role.ts`: 관리자 권한 작업용 (RLS 우회)
    - `client.ts`: 인증 불필요한 공개 데이터용
  - [x] `.env.example`에 Supabase 관련 키 정의 (N8N_WEBHOOK_URL, OPENAI_API_KEY 포함)
  - [ ] 로컬에서 단순 health-check용 쿼리 코드 초안 작성 (나중에 사용)
  - [x] RLS 비활성화 (개발 편의성, 출시 전 활성화 예정)

---

## Week 2 – 랜딩 페이지 + /app 골격 + Auth UX

> 🎯 Goal: 외부 노출용 랜딩 페이지와, 로그인 후 `/app` 기본 레이아웃을 완성한다.

- [x] 랜딩 페이지 `/` 구현
  - [x] Hero 섹션: 문제 정의 + 핵심 가치 한 줄 + CTA 버튼  
  - [x] "어떻게 동작하나" 3단계 섹션 (입력 → 생성 → 관리)  
  - [ ] 파운더스 플랜/가격 섹션 기본 틀 (추후 카피만 교체 가능하게 컴포넌트화)

- [x] `/app` 대시보드 기본 골격
  - [x] `app/app/page.tsx`에서 기본 카드 레이아웃 구현  
        (예: "오늘 보낼 메일", "최근 생성 이력" 더미 데이터로)
  - [ ] 대시보드용 공통 카드 컴포넌트 분리  
        (`DashboardCard` 등, 추후 데이터만 바꿔끼울 수 있게)

- [x] Auth UX
  - [x] `/signin`, `/signup` 라우트(Clerk 컴포넌트) 연결  
  - [x] 랜딩 CTA에서 로그인 상태에 따라 `/signin` or `/app`로 라우팅  
  - [x] `/app` 접근 시 미로그인 → 로그인 페이지로 리다이렉트 되는지 확인

- [x] 네비게이션/레이아웃 안정화
  - [x] 사이드바 메뉴 항목 구성: Dashboard / Sequences / Sent / (Settings)  
  - [x] 현재 페이지에 따라 Active 스타일 적용  
  - [ ] 모바일/작은 화면에서 최소한의 대응 (사이드바 접힘 정도)

---

## Week 3 – 생성 플로우 UI + API 골격 (LLM + n8n 연결 입구)

> 🎯 Goal: 유저가 URL/Prospect 정보를 입력해서 “생성 버튼”을 누르고,  
> 서버(API)가 n8n을 호출하는 기본 파이프라인을 만든다. (UI + API 골격 위주)

- [ ] 생성 폼 UI (`/app` 또는 `/app/create`)
  - [ ] Prospect 정보 입력 필드 구현  
        (`브랜드명`, `담당자(선택)`, `이메일(선택)`, `URL`, `메모`)  
  - [ ] Step 타입/시퀀스 타입 선택 필드 (`4통/9통`, Step 템플릿)  
  - [ ] 시각 자료 입력 필드(옵션) – `VIS-01` 대응 텍스트 필드

- [x] API Route 골격 (`app/api/generate-step/route.ts`)
  - [x] Request body 스키마 정의 (입력 값 검증용 타입/interface)  
  - [ ] n8n Webhook URL로 POST 호출하는 함수 분리 (`lib/` 또는 `actions/` 폴더에 분리)  
  - [ ] 성공/실패 응답 형식 통일 (성공: 인사이트 + 이메일 + 리포트 outline)

- [x] 생성 결과 데이터 타입 정의
  - [x] `types/` 폴더에 `generation.ts` 등으로 결과 JSON 타입 분리  
        (`insights`, `email_subject`, `email_body`, `report_outline` 등)

- [ ] 에러 핸들링/로딩 상태
  - [ ] 생성 중 로딩 스피너/상태 표시  
  - [ ] API 에러 시 사용자 친화적인 메시지 + 재시도 버튼

---

## Week 4 – 결과 UI + 로그 저장 훅 + 사용량 카운트 기초

> 🎯 Goal: “인사이트 + 이메일 초안” 결과 화면을 만들고,  
> 생성 결과를 Supabase에 저장하는 흐름의 기초를 만든다.

- [ ] 결과 화면 UI (`MVP-06`)
  - [ ] 상단: 생성된 인사이트 리스트/요약 카드  
  - [ ] 하단: 이메일 제목/본문 (`<textarea>` 또는 코드블럭 스타일)  
  - [ ] “복사하기” 버튼 구현 (제목/본문 각각 or 전체)

- [x] 생성 결과 → Supabase 저장
  - [x] `generation_logs`에 INSERT 하는 함수 구현 (`lib/server/generation-logs.ts` 등)  
  - [ ] API Route에서 n8n 응답 후, Clerk `userId`와 함께 저장 호출  
  - [ ] 저장 실패 시에도 사용자에게는 결과는 보여주되, 콘솔/로그에서 에러 확인 가능하게

- [ ] 월 사용량 카운트 기초 (`MVP-08`)
  - [ ] 현재 유저의 이번 달 `generation_logs` 카운트 쿼리 함수 구현  
  - [ ] 대시보드 카드에 “이번 달 생성: X건” 더미 UI 연결  
  - [ ] 플랜 한도(하드코딩)와 비교 로직 자리만 만들어두기 (추후 실제 플랜 연결)

- [ ] 컴포넌트/로직 모듈화
  - [ ] 생성 요청/응답을 담당하는 훅 또는 util로 분리  
        (예: `useGenerateStep`, `callGenerateStepApi`)  
  - [ ] 페이지 컴포넌트에서는 비즈니스 로직 최소화 (확장성 고려)

---

## Week 5 – 시퀀스/CRM DB 연결 & 기본 흐름

> 🎯 Goal: Prospect/Sequence/Step 테이블을 Supabase와 연결하고,  
> “생성 시 자동으로 Prospect + Sequence + Step 1개가 생기는” 기본 플로우를 만든다.

- [x] Supabase 모델 레이어 구현
  - [x] `lib/server/prospects.ts` – `createProspect`, `listProspectsByUser`  
  - [x] `lib/server/sequences.ts` – `createSequence`, `updateCurrentStep`  
  - [x] `lib/server/steps.ts` – `createStep`, `updateStepStatus` 등
  - [x] Supabase 스키마 마이그레이션 파일 생성 (`supabase/migrations/`)
    - [x] `20251119101409_init_linkpitch_schema.sql` - 전체 테이블 스키마 정의
    - [x] `20251119101708_create_storage_bucket.sql` - Storage 버킷 생성
  - [x] 테스트 데이터 시딩 스크립트 구현 (`scripts/seed-test-data.ts`)
    - [x] 모든 테이블에 대한 테스트 데이터 삽입
    - [x] 외래키 관계를 고려한 삽입 순서 구현
    - [x] 데이터 검증 및 외래키 관계 확인 로직

- [ ] 생성 플로우 ↔ CRM 연결
  - [ ] 생성 폼 제출 시:
        1) `prospects`에 upsert (동일 URL/브랜드면 재사용 여부 결정)
        2) `sequences` 생성 (4/9통, total_steps 등)
        3) `steps`에 1번 Step 기록 (email_subject/body, status=pending)
  - [ ] 에러 발생 시 롤백 전략 간단히 정의 (순차 실행 + 실패 시 안내)

- [ ] 간단한 리스트 UI (Prospects)
  - [ ] `/app/sequences`에 들어갈 간단한 Prospect/Sequence 리스트 기본 형태 만들기  
        (실제 데이터는 Week 6에서 마무리)

- [ ] RLS 검증
  - [ ] 동일 프로젝트에 테스트용 계정 2개로 로그인해서  
        서로의 Prospect/Sequence/Step이 절대 보이지 않는지 확인
  - [ ] RLS 정책이 `auth.jwt()->>'sub'`로 Clerk user ID 확인하는지 검증

---

## Week 6 – 시퀀스 대시보드(리스트) + 타겟 상세 히스토리

> 🎯 Goal: SEQ-03/04 카드에 해당하는 화면을 Next.js에서 완성한다.

- [ ] `/app/sequences` – 시퀀스 리스트 뷰
  - [ ] 한 행 = 하나의 Sequence(타겟)  
  - [ ] 컬럼: Prospect명, 시퀀스 타입(4/9통), 진행 단계, 보낸 메일 수,  
        마지막 보낸 시각, 다음 발송 예정일, 최근 메일 읽음/회신 여부
  - [ ] 정렬: 기본 `다음 발송 예정일` 오름차순

- [ ] `/app/sequences/[id]` – 타겟 상세 & 히스토리
  - [ ] 상단: Prospect/Sequence 요약 (브랜드명, 담당자, 현재 단계 등)  
  - [ ] 하단: Step별 카드 리스트
        - Step 번호/라벨
        - 보낸 시각, 읽음/회신 상태
        - [본문 펼치기]로 email_body 전체 보기

- [ ] 상태 업데이트 UI
  - [ ] Step 카드에서 `읽음/안읽음`, `회신 O/미회신` 수동 토글 가능  
  - [ ] 토글 시 Supabase `steps` 상태 필드 업데이트

- [ ] 레이아웃/컴포넌트 재사용성 확보
  - [ ] 시퀀스 리스트/보낸 메일 리스트에서 공유할 수 있는 테이블 컴포넌트 분리  
        (`DataTable`, `EmptyState`, `StatusBadge` 등)

---

## Week 7 – 보낸 메일 전체보기 + 수동 발송 기록 + 추천 발송일 로직

> 🎯 Goal: SEQ-05/06/07 카드의 핵심 UI를 완성하고, “오늘 보낼 메일” 섹션까지 연결한다.

- [ ] `/app/sent` – 보낸 메일 요약 페이지
  - [ ] 각 행 = “보낸 메일이 하나 이상 있는 Sequence”  
  - [ ] 컬럼: 마지막 보낸 날짜/시간, Prospect명, 시퀀스 타입, 진행 단계,  
        보낸 메일 수, 최근 메일 읽음/회신 상태
  - [ ] 행 클릭 시 Step별 상세 목록이 아래로 펼쳐지도록 구현
        - Step 번호/라벨
        - 보낸 시간
        - 읽음/회신 상태
        - [본문 보기] 토글

- [ ] 수동 발송 기록 UI (`SEQ-05`)
  - [ ] Step 카드에 “보낸 것으로 기록” 버튼 추가  
  - [ ] 클릭 시 모달:
        - 실제 보낸 날짜/시간
        - 읽음 여부, 회신 여부 초기값 선택  
  - [ ] 저장 시:
        - `status = sent`, `sent_at`, `recommended_send_at` 업데이트

- [ ] 추천 발송일 & “오늘 보낼 메일” 섹션 (`SEQ-07`)
  - [ ] Step 간 간격 규칙(예: +3일, +5일 등) 하드코딩 로직 구현  
  - [ ] `recommended_send_at <= 오늘` & `status = 'pending'` Step 조회 쿼리 작성  
  - [ ] `/app` 대시보드에 “오늘 보낼 메일 N건” 카드 + 리스트 연결

- [ ] UX 안정화
  - [ ] 시퀀스 리스트 ↔ 보낸 메일 ↔ 상세 페이지 간 네비게이션 자연스럽게 연결  
  - [ ] 브라우저 뒤로가기/직접 URL 입력 시에도 깨지지 않게 로딩/에러 상태 처리

---

## Week 8 – 리포트 관여도 표시 + 리팩토링 & 베타 준비

> 🎯 Goal: 리포트 행동 데이터(ENG-01/02)를 UI에 반영하고,  
> 전체 코드 구조를 정리해서 베타 테스트 가능한 상태로 만든다.

- [ ] `/r/[id]` 리포트 페이지 기본 완성
  - [ ] `reports`에서 리포트 JSON을 불러와 렌더링  
  - [ ] 페이지 진입/스크롤/인터랙션 시 `report_events`에 이벤트 기록  
  - [ ] 최소: `view` + `dwell_time` + `scroll_depth` 기록 로직 구현

- [ ] Step 관여도 계산 반영 (`ENG-02`)
  - [ ] `report_events`를 집계해서 Step별 `report_engagement_level` 업데이트하는 서버 로직  
        (단순 규칙: 머문 시간/스크롤/인터랙션 기준으로 cold/warm/hot)
  - [ ] `/app/sequences`, `/app/sent`에서 각 Step/Sequence에 관여도 뱃지 표시

- [ ] 리팩토링 & 모듈화 점검
  - [ ] `components/` 구조 정리 (layout/ui/providers/domain별 디렉토리)  
  - [ ] 서버 로직: `lib/server/*` 정리, 중복 쿼리/유틸 함수 통합  
  - [ ] 타입 정의(`types/*`) 정리 – API 응답/DB 모델/프론트 모델 분리
  - [ ] `actions/` 폴더 활용 검토 (Server Actions 우선 사용)

- [ ] 안정성 체크 & 베타 준비
  - [ ] 주요 경로에 대한 수동 테스트:  
        생성 → 로그 저장 → 시퀀스 생성 → 수동 발송 기록 → 리포트 뷰  
  - [ ] 에러 화면/빈 상태(Empty state) 처리 (데이터 없을 때 UI 점검)  
  - [ ] .env, README/PRD/TODO/AGENTS.md 최신 상태로 정리 (외부 공유 가능한 수준)
  - [ ] Supabase 마이그레이션 파일 정리 (`supabase/migrations/` 형식 확인)


