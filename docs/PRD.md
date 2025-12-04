제품 요구사항 정의서 (PRD): LinkPitch MVP v5.1

## 프로젝트 개요

**프로젝트 명**: LinkPitch (링크피치)

**한 줄 소개**: 6가지 퍼포먼스 마케팅 방법론이 적용된 **"스나이퍼" 네이버 스마트스토어 제안서 생성기 & 자동화 CRM** (추후 다른 플랫폼 확장)

**타겟 사용자**: 3~5년 차 퍼포먼스 마케터 (자신만의 포트폴리오/성공 사례가 있는 전문가)

**핵심 가치**: "Clean Scan & Hybrid Injection"
- 잡음 없는 순수 분석 후, AI의 논리적 요청과 마케터의 직관(자료)이 결합되는 협업 툴

**사용자 니즈**:
- "내 시간을 아껴주면서도, 내가 쓴 것처럼 퀄리티 높은 제안서를 만들고 싶다."
- "누가 내 제안서에 찐하게 반응했는지(HOT 리드) 알고 싶다."

### 기획 배경

- **스팸 취급**: 분석 없는 대량 발송 메일은 차단당하거나 무시됨
- **분석의 비효율**: 제대로 된 제안서를 쓰려면 스토어 분석에만 건당 3~4시간 소요
- **데이터 오염**: 리뷰, 푸터, Q&A 등 불필요한 정보가 AI의 분석 품질을 떨어뜨림
- **깜깜이 영업**: 메일 발송 후 고객이 읽었는지, 어디에 관심이 있는지 알 방법이 없음

### 핵심 가치 (Core Value)

**Clean Scan**: Chrome Extension을 통한 정밀 수집
- `.se-viewer` 또는 `.se-main-container` 내부의 순수 HTML만 추출 (리뷰, 푸터 제거)
- AI 할루시네이션 방지 및 토큰 비용 절감
- 완독률 데이터(Scroll Depth)의 정확도 100% 확보

**Hybrid Injection**: AI의 속도에 '내 필살기'를 더하는 통제권
- AI가 판(Draft)을 깔아주면, 마케터가 자신의 강력한 무기(성공 사례 GIF, 포트폴리오)를 **드래그 앤 드롭으로 꽂아 넣는 경험**
- "내가 기획하고 AI가 작성했다"는 효능감과 함께 타사 대비 압도적인 퀄리티 보장

**6가지 방법론 기반 Vision AI**: 단순 요약이 아닌, 설득 논리가 담긴 제안서 초안 작성
- 6가지 퍼포먼스 마케팅 방법론이 n8n 프롬프트에 구현됨
- "증거 자료가 필요한 논리적 공백"을 찾아내어 마케터에게 명확한 가이드라인 제공

**Actionable CRM**: '감'이 아닌 '데이터'로 낚아채는 세일즈 타이밍
- **"지금 보고 있습니다"**, **"80%까지 정독했습니다"**라는 시그널을 실시간으로 제공
- 고객이 가장 관심 있어 하는 '골든타임'에 컨택하게 하여 미팅 성사율 극대화

**멀티유저 & 요금제**: Clerk 인증 기반으로 여러 사용자가 독립적으로 작업하며, 월 생성 쿼터를 관리합니다.

1.2 기술 스택

Frontend: Next.js 14, Tailwind CSS (Linear Dark), Shadcn/UI, Framer Motion
Backend: Supabase (PostgreSQL)
Auth: Clerk
AI Logic: n8n Webhook (ScreenshotOne + Gemini 3.0 Pro)


2. 데이터베이스 스키마 (Supabase)
2.1 핵심 테이블 구조
users (사용자)

Clerk 인증 기반 멀티유저 관리
clerk_id, email, name

plans & user_plans (요금제)

Free/Starter/Pro 플랜별 월 생성 쿼터
과금 및 사용량 추적 기반

prospects (고객사 - CRM 통합)
typescript{
  id: UUID
  user_id: UUID (FK → users)
  name: string // 회사명
  url: string
  vision_data: JSONB // AI 분석 결과
  
  // Clean Scan 데이터 (Chrome Extension 수집)
  clean_html?: string // .se-viewer 내부 순수 HTML
  main_images?: string[] // 본문 내 주요 이미지 URL 리스트
  text_length?: number // 본문 텍스트 길이 (완독률 분모용)
  
  // CRM 상태 (통합 관리)
  crm_status: 'cold' | 'warm' | 'hot'
  visit_count: number // 재방문 횟수
  last_viewed_at: timestamp
}
vision_data 구조:
json{
  "mood": "luxury",
  "visual_usp": ["고급스러운 제품 사진", "직관적 레이아웃"],
  "price_offer": "30% 할인",
  "report_title": "글로우업 매출 20% 상승 제안",
  "visual_analysis_text": "귀사의 상세페이지는...",
  "opportunity_text": "다음 3가지를 개선하면..."
}
sequences (5개 Step 묶음)
typescript{
  id: UUID
  prospect_id: UUID (FK → prospects)
  custom_context: string // "나만의 무기" (마케터 강점)
  status: 'draft' | 'active' | 'completed'
  total_steps: 5
}
step (각 단계 이메일)
typescript{
  id: UUID
  sequence_id: UUID (FK → sequences)
  step_number: 1~5
  step_type: 'Hook' | 'Problem' | 'Value' | ...
  
  email_subject: string
  email_body: string
  
  status: 'pending' | 'sent' // 발송 상태만 관리
  is_core_step: boolean // 1, 3, 5번 강조
}
user_assets (나만의 무기고)
typescript{
  id: UUID
  user_id: UUID (FK → users)
  file_url: string // Supabase Storage URL
  file_type: 'image' | 'gif' | 'video' | 'document'
  name: string // 파일명
  created_at: timestamp
}
report_events (리포트 추적)
typescript{
  id: UUID
  prospect_id: UUID (FK → prospects) // ⚠️ report 테이블 없이 직접 참조
  event_type: 'view' | 'scroll_50' | 'scroll_80' | 'dwell_10s' | 'dwell_30s'
  metadata: JSONB // {"scroll_depth": 0.8, "dwell_seconds": 35}
}
generation_logs (AI 사용량)

요금제별 쿼터 추적
model_name, input_tokens, output_tokens


3. 상세 기능 명세 (Functional Specifications)

### 3.1 Clean Chrome Extension (상세페이지 정밀 수집기)

**사용 목적**: AI 분석의 품질을 떨어뜨리는 리뷰, Q&A, 하단 푸터 등 불필요한 노이즈를 완벽하게 제거하고, 판매자가 작성한 **순수 본문 데이터**만 추출하기 위함.

**사용 시나리오**:
1. 마케터가 타겟 스마트스토어 상세페이지에 접속한다.
2. Chrome Extension 아이콘을 클릭한다.
3. 프로그램이 자동으로 `.se-viewer` 또는 `.se-main-container` (본문 영역)만 타겟팅하여 이미지와 텍스트 구조를 캡처한다.

**수집 데이터**:
- `clean_html`: `.se-viewer` 내부의 순수 HTML (리뷰, 푸터 제거됨)
- `main_images`: 본문 내 포함된 주요 이미지 URL 리스트 (Vision AI 분석용)
- `text_length`: 본문 텍스트 길이 (완독률 분모용)

**기대 효과**:
- AI 할루시네이션(거짓 정보) 방지 및 토큰 비용 절감
- 전체 페이지 길이가 아닌 **'실제 본문 길이'**를 기준으로 삼아, 완독률 데이터(Scroll Depth)의 정확도 100% 확보

### 3.2 Vision 분석 및 등록 (/prospects/new)

**목표**: 긴 분석 시간(30~60초)을 '기대감'으로 전환하는 로딩 경험 제공.

**Input**: 중앙 URL 입력창 또는 Chrome Extension에서 수집한 데이터

**Loading UI (Terminal View)**:
- 검은 터미널 배경에 모노스페이스 폰트로 로그 출력 (framer-motion)
- Log Scenario: Connecting... → Clean scanning... → Uploading to Gemini... → Extracting USP... → Building report...

**Process**:
1. Chrome Extension에서 수집한 `clean_html`, `main_images`, `text_length` 데이터 수신 (또는 URL 직접 입력 시 n8n에서 처리)
2. n8n `/webhook/analyze-url` 호출 (6가지 방법론 기반 프롬프트 적용)
3. DB `prospects` 테이블에 `vision_data` 및 Clean Scan 데이터 저장
4. 자동으로 `/prospects/[id]/mix` 페이지로 리다이렉트



3.2 미니 CRM 대시보드 (/dashboard)

UI: 고밀도 테이블 (Table View)
컬럼: 회사명 | URL | CRM 상태 | 재방문 | 마지막 조회 | 등록일
정렬 로직:

1순위: 🔥 Hot + 🔄 Re-visit (재접속자)
2순위: 🔥 Hot (정독한 사람)
3순위: Recent (최근 등록)


필터: Cold/Warm/Hot 토글

### 3.3 인사이트 믹서 (/prospects/[id]/mix) [핵심 UI]

**레이아웃**: 3단 분할 레이아웃 (Asset Library + Editor & Injection Zone + Preview)

#### A. 좌측: Asset Library (나만의 무기고)

**User Asset Storage**: 마케터가 자주 사용하는 포트폴리오, 성공 사례, GIF 등을 저장해두고 반복적으로 꺼내 쓰기 위함.

**기능**:
- 파일 업로드 (이미지, GIF, 비디오, 문서)
- 저장된 자료 목록 표시
- 드래그 앤 드롭으로 중앙 Editor에 삽입 가능
- 파일 삭제 및 관리

**사용 시나리오**:
1. 마케터가 '내구성 테스트.gif', '매출 300% 상승 사례.png' 등을 저장소에 미리 업로드
2. Workspace 좌측 탭에서 언제든 저장된 자료를 확인하고 바로 드래그하여 사용

#### B. 중앙: Editor & Injection Zone (작업대)

**구성 요소**:

**Vision Fact (AI 분석 결과)**:
- `vision_data`에서 추출한 USP, Mood 등을 카드 형태로 표시
- 수정 불가 (읽기 전용)

**Custom Context Input (나만의 무기)**:
- UI: Textarea (Minimal border-bottom style)
- Placeholder: "당신의 강점을 입력하세요. 예: 지난 3개월간 뷰티 브랜드 5곳의 ROAS를 평균 280% 개선..."
- 저장: `sequences.custom_context`에 저장
- 활용:
  - 이메일(예고편)의 근거 자료
  - 리포트(본편)의 Solution 섹션에 노출

**Strategy Chips (통합된 전략 토핑)**:
- UI: 단일 리스트의 Badge 형태
- 구성:
  - 일반 텍스트 칩: "🎯 경쟁사 분석", "📈 데이터 근거"
  - 이미지 칩: "📷 성과 그래프", "📂 포트폴리오"
- Interaction: 드래그 가능 (dnd-kit)

**Sequence Playlist (5개 Step 카드)**:
- 5개의 Step 카드가 Accordion 형태로 나열

**카드 기본 구조**:
- Collapsed: Step Number + Title만 표시 (예: 1. Hook - 첫 번째 인상)
- Expanded: 아래 2개 탭 표시

**카드 탭 구조 (Dual-View)**:

**Tab 1: ✉️ 예고편 (Email Editor)**:
- 제목: `email_subject`
- 본문: `email_body` (Textarea)
- **Placeholder**: AI가 "여기에 자료를 넣어주세요"라고 비워둔 박스
- **Free Drop**: 마케터가 라이브러리에서 자료를 끌어와 문단 사이 어디든 놓을 수 있음
- 하단 버튼: [Copy & Log] (Optimistic UI)

**재생성 로직 (The Magic Flow)**:
- Trigger: 좌측 **[Asset]** 또는 **[Chip]**을 중앙 **[예고편 탭]**에 드롭
- Action:
  - 수동 주입 (Passive): AI가 비워둔 빈칸에 마케터가 요청된 자료를 드래그 앤 드롭
  - 능동 커스텀 (Active): 마케터가 판단하기에 더 강력한 자료를 라이브러리에서 꺼내, 원하는 위치에 강제로 삽입
  - AI가 삽입된 자료를 인식하여 앞뒤 문맥을 매끄럽게 수정

#### C. 우측: Preview (리포트 미리보기)

**기능**:
- PC 화면에 최적화된 웹 리포트 미리보기
- 데이터 소스: `prospects.vision_data` + `sequences.custom_context`
- 실제 `/r/[prospect_id]`와 동일한 렌더링
- 실시간 업데이트: Editor에서 수정 시 즉시 반영

**재생성 로직 상세 (The Magic Flow)**:

- Trigger: 좌측 **[Asset]** 또는 **[Chip]**을 중앙 **[예고편 탭]**에 드롭
- Action:
  ```typescript
  await regenerateStepAction({
    step_id,
    asset_id?: string, // User Asset ID (선택)
    chip_text?: string, // Strategy Chip 텍스트 (선택)
    custom_context: sequences.custom_context
  })
  ```
- API: n8n `/webhook/regenerate-step` 호출
- Output:
  - AI가 기존 문맥에 자료/칩 내용을 녹여 다시 작성
  - 이미지/자료인 경우: `[ 📷 여기에 (성과 그래프) 이미지를 붙여넣으세요 ]` 마커 삽입
- UI: Loading skeleton → Smooth transition

**최종 발송 (Snapshot Sending & Tracking)**:

- [Copy & Log] 버튼 클릭 시
- Optimistic UI:
  - 즉시 체크 표시 + Dimmed 처리
  - `navigator.clipboard.writeText()` 실행
  - Sonner toast: "클립보드에 복사됨"
- Server Action:
  ```typescript
  await updateStepStatus(step_id, 'sent')
  ```
- **Snapshot 저장**: 해당 시점의 제안서 내용이 DB에 '저장(Snapshot)'되고 트래킹이 시작됨
- 사용자의 회사/개인 메일에서 붙여넣기 후 발송 (SMTP 서버 사용 안 함)
3.4 리포트 페이지 (/r/[prospect_id])
디자인: PC 업무 환경에 최적화된 전문 제안서(Web Proposal) 스타일
콘텐츠 구성:
┌─────────────────────────────┐
│ Hero Section                │
│ - report_title (H1)         │
│ - 대표 이미지 (optional)     │
└─────────────────────────────┘
┌─────────────────────────────┐
│ Deep Dive (Analysis)        │
│ - visual_analysis_text      │
│ - visual_usp (리스트)        │
└─────────────────────────────┘
┌─────────────────────────────┐
│ Opportunity Section         │
│ - opportunity_text          │
└─────────────────────────────┘
┌─────────────────────────────┐
│ Solution (Your Strength)    │
│ - custom_context (마케터)   │
└─────────────────────────────┘
┌─────────────────────────────┐
│ Floating CTA                │
│ - "미팅 신청하기" 버튼       │
└─────────────────────────────┘
행동 추적 로직 (Server Action: logReportEvent)
이벤트 종류:

View: 페이지 접속 즉시 기록
Scroll Tracking:

scroll_50: 스크롤 50% 도달
scroll_80: 스크롤 80% 도달


Dwell Tracking:

dwell_10s: 10초 체류
dwell_30s: 30초 체류



CRM 상태 승격 규칙:
typescript// Warm: (50% 스크롤) AND (10초 체류)
if (hasEvent('scroll_50') && hasEvent('dwell_10s')) {
  crm_status = 'warm'
}

// Hot: (80% 스크롤) AND (30초 체류)
if (hasEvent('scroll_80') && hasEvent('dwell_30s')) {
  crm_status = 'hot'
}
재방문 감지:
typescriptconst lastView = prospect.last_viewed_at
const now = new Date()

if (now - lastView > 1시간) {
  visit_count++
  // 재접속 시 즉시 등급 상향 (Hot 우선 노출)
}

4. API / Webhook 명세 (n8n 연동 가이드)
4.1 본편 제작: Vision 분석 (/webhook/analyze-url)
Input:
json{
  "url": "https://example.com/product",
  "user_id": "uuid"
}
Process:

ScreenshotOne으로 전체 페이지 캡처
Gemini 3.0 Pro Vision API 호출
시각적 요소 분석 (색상, 레이아웃, USP)

Output:
json{
  "vision_data": {
    "mood": "luxury",
    "visual_usp": ["고급스러운 제품 사진", "직관적 레이아웃"],
    "colors": ["#1a1a1a", "#f5f5f5", "#6366f1"],
    "price_offer": "30% 할인",
    "report_title": "글로우업 매출 20% 상승 제안",
    "visual_analysis_text": "귀사의 상세페이지는...",
    "opportunity_text": "다음 3가지를 개선하면..."
  }
}
### 4.2 초기 생성: 시퀀스 배치 (/webhook/generate-sequence)

**Input**:
```json
{
  "prospect_id": "uuid",
  "brand_name": "글로우업",
  "vision_data": { ... },
  "custom_context": "지난 3개월간 뷰티 브랜드 5곳..."
}
```

**System Prompt Rule**:
- 6가지 퍼포먼스 마케팅 방법론이 n8n 프롬프트에 구현됨
- 당신은 B2B 콜드메일 전문가입니다.

**[엄격한 규칙]**
1. 절대 설명하지 마라. 리포트 링크를 클릭하게 만드는 Teaser를 작성하라.
2. 각 이메일은 300~400자 내외로 간결하게.
3. custom_context를 자연스럽게 녹여라 (예: "저희는 지난 3개월간...")
4. vision_data의 visual_usp를 후킹 포인트로 사용하라.
5. 논리상 증거가 부족한 부분에 **[Placeholder: 여기에 내구성 테스트 영상을 넣어주세요]**와 같은 요청 박스를 생성하라.

**[톤앤매너]**
- 겸손하지만 자신감 있게
- 강요하지 말고 호기심 유발
- 전문성 + 친근함

**Output**:
```json
{
  "steps": [
    {
      "step_number": 1,
      "step_type": "Hook",
      "email_subject": "글로우업 상세페이지 본 마케터의 관찰",
      "email_body": "안녕하세요...\n{{custom_context_integrated}}\n\n리포트: https://linkpitch.com/r/xxx"
    },
    // ... 총 5개
  ]
}
```
4.3 예고편 제작: 스텝 재생성 (/webhook/regenerate-step)
Input:
json{
  "step_id": "uuid",
  "step_number": 3,
  "brand_name": "글로우업",
  "current_body": "기존 이메일 내용...",
  "source_material": {
    "vision_data": { ... },
    "custom_context": "지난 3개월간..."
  },
  "strategy_chip": "📷 성과 그래프"
}
System Prompt Rule:
[재작성 규칙]
1. current_body의 핵심 메시지는 유지하되, strategy_chip을 자연스럽게 통합하라.
2. custom_context를 근거로 신뢰도를 높여라.
3. strategy_chip이 이미지 관련이면:
   - "아래 자료를 보시면..." 같은 문장 추가
   - [ 📷 여기에 (성과 그래프) 이미지를 붙여넣으세요 ] 마커 삽입

[이미지 칩 처리 예시]
입력: "📷 성과 그래프"
출력:
"...저희 클라이언트는 3개월 만에 ROAS 280% 달성했습니다.

[ 📷 여기에 (성과 그래프) 이미지를 붙여넣으세요 ]

같은 전략을 적용하면..."
Output:
json{
  "email_body": "새로 작성된 텍스트...\n\n[ 📷 여기에 (성과 그래프) 이미지를 붙여넣으세요 ]\n\n..."
}

### 5. 시스템 역할 분담 (System Architecture)

| 구분 | 기능 | 담당 | 방식 | 이유 |
|------|------|------|------|------|
| **Extension** | 1. Clean Scan (상세페이지 정밀 수집) | Chrome Extension | Vanilla JS | DOM 제어 및 경량화 |
| **AI (Brain)** | 2. URL 분석 (Vision) | n8n | analyze-url | 이미지 분석 및 구조화 |
| **AI (Brain)** | 3. 초기 5개 생성 | n8n | generate-sequence | 6가지 방법론 기반 자연스러운 데이터 주입 |
| **AI (Brain)** | 4. Asset/Chip 드래그 수정 | n8n | regenerate-step | 맥락 이해 및 재작성 |
| **DB (Speed)** | 5. 발송 완료 체크 | Next.js | Server Action | 단순 상태 변경 |
| **DB (Speed)** | 6. 리포트 추적 | Next.js | Server Action | 빠른 이벤트 로깅 |
| **DB (Speed)** | 7. Hot Lead 변경 | Next.js | Server Action | 조건 충족 시 즉시 반영 |
| **Storage** | 8. User Asset 저장 | Supabase Storage | Storage API | 파일 호스팅 및 CDN |

6. 개발 가이드 (Cursor Instructions)
6.1 기본 원칙

DB 마이그레이션 금지: supabase/migrations 생성하지 말 것 (사용자가 직접 SQL 실행)
타입 정의: types/ 폴더에 JSONB 구조와 Enum 값 정확히 반영
상태 관리: Custom Context와 Drag State는 Zustand로 전역 관리
최적화: 리포트 페이지 스크롤 이벤트는 Debounce 처리

6.2 폴더 구조
app/
├─ (auth)/
│  └─ sign-in/
├─ dashboard/
│  └─ page.tsx (CRM Table)
├─ prospects/
│  ├─ new/
│  │  └─ page.tsx (Vision Analysis)
│  └─ [id]/
│     └─ mix/
│        └─ page.tsx (Insight Mixer)
├─ r/
│  └─ [id]/
│     └─ page.tsx (Report Page)
└─ actions/
   ├─ analyze-url.ts
   ├─ generate-sequence.ts
   ├─ regenerate-step.ts
   ├─ update-step-status.ts
   ├─ log-report-event.ts
   ├─ upload-asset.ts
   └─ list-assets.ts

components/
├─ dashboard/
│  ├─ ProspectsTable.tsx
│  └─ KPICards.tsx
├─ mixer/
│  ├─ Workbench.tsx (3단 분할 레이아웃)
│  ├─ AssetLibrary.tsx (좌측: 나만의 무기고)
│  ├─ StrategyConsole.tsx (중앙: 전략 통제실)
│  ├─ SequencePlaylist.tsx (중앙: 5개 Step 카드)
│  ├─ StepCard.tsx
│  ├─ StrategyChip.tsx
│  └─ ReportPreview.tsx (우측: 리포트 미리보기)
└─ report/
   └─ ReportViewer.tsx

store/
└─ mixer-store.ts (Zustand)

types/
├─ prospect.ts
├─ sequence.ts
├─ step.ts
└─ user-asset.ts

hooks/
└─ use-report-tracking.ts
6.3 핵심 Server Actions
log-report-event.ts
typescript'use server'

export async function logReportEvent(
  prospectId: string,
  eventType: 'view' | 'scroll_50' | 'scroll_80' | 'dwell_10s' | 'dwell_30s',
  metadata?: any
) {
  // 1. report_events 테이블에 INSERT
  await supabase.from('report_events').insert({
    prospect_id: prospectId,
    event_type: eventType,
    metadata
  })

  // 2. CRM 상태 승격 체크
  const events = await getEventsByProspect(prospectId)
  
  let newStatus = 'cold'
  
  if (hasEvent(events, 'scroll_80') && hasEvent(events, 'dwell_30s')) {
    newStatus = 'hot'
  } else if (hasEvent(events, 'scroll_50') && hasEvent(events, 'dwell_10s')) {
    newStatus = 'warm'
  }

  // 3. prospects 테이블 업데이트
  await supabase
    .from('prospects')
    .update({ 
      crm_status: newStatus,
      last_viewed_at: new Date()
    })
    .eq('id', prospectId)

  // 4. 재방문 체크 (1시간 경과)
  const prospect = await getProspect(prospectId)
  const lastView = new Date(prospect.last_viewed_at)
  const now = new Date()
  
  if ((now - lastView) > 3600000) { // 1시간
    await supabase
      .from('prospects')
      .update({ 
        visit_count: prospect.visit_count + 1 
      })
      .eq('id', prospectId)
  }
}

7. 마일스톤 (개발 순서)
Phase 1: 기반 구축 (Week 1)

 Clerk 인증 설정
 Supabase SQL 실행 및 타입 정의
 Dashboard UI (Table) 구현

Phase 2: 핵심 기능 (Week 2-3)

 Vision 분석 로딩 애니메이션
 Insight Mixer 레이아웃 (Sidebar + Main)
 dnd-kit 연동 (드래그 앤 드롭)
 n8n Webhook 연결 및 테스트

Phase 3: 추적 및 최적화 (Week 4)

 리포트 페이지 (/r/[id]) 구현
 행동 추적 로직 (use-report-tracking)
 CRM 상태 자동 업데이트
 Optimistic UI (Copy & Log)

Phase 4: 폴리싱 (Week 5)

 요금제별 쿼터 제한 로직
 에러 핸들링 및 Toast 알림
 성능 최적화 (Debounce, Lazy Load)
 모바일 반응형 (선택)


## 8. 성공 지표 (Success Metrics)

### 8.1 핵심 KPI 지표

| **구분** | **KPI 항목** | **정의 및 계산식** | **목표치** | **관리 이유** |
| --- | --- | --- | --- | --- |
| **품질 검증** | **리포트 완독률**<br>(Engagement) | (사용자 스크롤 깊이 / Clean Body 높이) * 100 | **Avg. 60%↑** | 리뷰를 제외한 순수 길이 기준으로, 제안서가 실제로 읽히는지 판단하는 가장 중요한 척도 |
| **성과 검증** | **리드 전환율**<br>(Conversion) | (Hot + Warm 상태 도달 수 / 전체 발송 성공 수) * 100 | **15%↑** | 마케터가 "이 툴을 쓰니 유효한 DB가 생긴다"고 느끼게 하는 핵심 성과 지표 |
| **생산성** | **리포트 생성 시간**<br>(Productivity) | 스캔 시작 버튼 클릭 ~ 발송 완료 버튼 클릭까지 소요 시간 | **Avg. 10분↓** | 기존 3시간 이상 걸리던 작업을 획기적으로 줄여 "돈값을 한다"는 인식을 심어줌 |
| **지속성** | **주간 재사용률**<br>(Retention) | 지난주 생성 유저가 이번 주에도 생성한 비율 | **40%↑** | 일회성 호기심이 아닌, 마케터의 'Daily 업무 습관'으로 자리 잡았는지 확인 |

### 8.2 MVP 검증

- 1명의 마케터가 3개 Prospect 등록 완료
- 5개 Step 생성 및 3개 이상 Copy & Log
- 1개 이상의 Hot Lead 전환 (80% 스크롤 + 30초 체류)

### 8.3 제품 완성도

- Vision 분석 완료율 95% 이상 (에러율 5% 이하)
- 드래그 앤 드롭 성공률 100%
- 리포트 페이지 로딩 속도 2초 이하
- Clean Scan 정확도 100% (리뷰/푸터 제거 성공률)