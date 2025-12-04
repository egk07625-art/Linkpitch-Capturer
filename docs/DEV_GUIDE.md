# LinkPitch MVP v5.1 개발 가이드 (Updated)

## 1. 환경 설정 (Environment Setup)

### 1.1 필수 패키지 설치

Cursor에게 다음 명령어를 실행하게 하세요.

```bash
# UI & Animation
npm install framer-motion lucide-react clsx tailwind-merge

# Drag & Drop (For Insight Mixer)
npm install @dnd-kit/core @dnd-kit/utilities @dnd-kit/sortable

# State Management (For Context & Chips)
npm install zustand

# Date Formatting
npm install date-fns

# Toast Notifications
npm install sonner

# Auth (Clerk)
npm install @clerk/nextjs
```

### 1.2 환경 변수 (.env.local)

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... # 서버 액션 전용

# n8n Webhooks
N8N_WEBHOOK_ANALYZE_URL=https://n8n.example.com/webhook/analyze-url
N8N_WEBHOOK_GENERATE_SEQUENCE=https://n8n.example.com/webhook/generate-sequence
N8N_WEBHOOK_REGENERATE_STEP=https://n8n.example.com/webhook/regenerate-step
```

### 1.3 테마 설정 (app/globals.css)

**"Linear-style Dark Mode"**를 위해 아래 CSS 변수를 강제 적용하세요.

```css
@layer base {
  :root {
    --background: 240 10% 3.9%; /* Zinc-950 (#09090b) */
    --foreground: 0 0% 98%;
    --card: 240 10% 3.9%; /* Zinc-900 */
    --card-foreground: 0 0% 98%;
    --popover: 240 10% 3.9%;
    --popover-foreground: 0 0% 98%;
    --primary: 243 75% 59%; /* Indigo-500 (#6366f1) */
    --primary-foreground: 0 0% 98%;
    --destructive: 346 87% 43%; /* Rose-500 */
    --destructive-foreground: 0 0% 98%;
    --border: 240 3.7% 15.9%; /* Zinc-800 */
    --input: 240 3.7% 15.9%;
    --ring: 240 4.9% 83.9%;
  }
}
```

---

## 2. 타입 정의 (Type Definitions)

**types/ 폴더**에 아래 파일들을 생성하여 DB 스키마와 프론트엔드를 동기화하세요.

### types/prospect.ts

```typescript
export type CRMStatus = 'cold' | 'warm' | 'hot';

export interface VisionData {
  mood: string;
  visual_usp: string[]; // 시각적 강점
  colors?: string[];
  price_offer: string;
  report_title: string; // 리포트용 헤드라인
  visual_analysis_text: string; // 리포트용 분석글
  opportunity_text: string; // 리포트용 기회포착글
}

export interface Prospect {
  id: string;
  user_id: string;
  name: string;
  contact_name?: string;
  contact_email: string;
  url: string;
  memo?: string;
  vision_data: VisionData; // JSONB
  // Clean Scan 데이터 (Chrome Extension 수집)
  clean_html?: string; // .se-viewer 내부 순수 HTML
  main_images?: string[]; // 본문 내 주요 이미지 URL 리스트
  text_length?: number; // 본문 텍스트 길이 (완독률 분모용)
  crm_status: CRMStatus;
  visit_count: number;
  last_viewed_at?: string;
  created_at: string;
  updated_at: string;
}
```

### types/sequence.ts

```typescript
export type SequenceStatus = 'draft' | 'active' | 'completed' | 'paused';

export interface Sequence {
  id: string;
  user_id: string;
  prospect_id: string;
  name: string;
  sequence_type: string; // '5_steps'
  total_steps: number; // 5
  current_step: number;
  status: SequenceStatus;
  custom_context?: string; // 나만의 무기
  created_at: string;
  updated_at: string;
}
```

### types/step.ts

```typescript
export type StepStatus = 'pending' | 'sent';

export interface Step {
  id: string;
  user_id: string;
  sequence_id: string;
  step_number: number; // 1~5
  step_type: string; // 'Hook', 'Value', ...
  email_subject: string;
  email_body: string;
  status: StepStatus;
  sent_at?: string;
  is_core_step: boolean; // 1, 3, 5번 강조용
  created_at: string;
  updated_at: string;
}
```

### types/user-asset.ts

```typescript
export type UserAssetType = 'image' | 'gif' | 'video' | 'document';

export interface UserAsset {
  id: string;
  user_id: string;
  file_url: string; // Supabase Storage URL
  file_type: UserAssetType;
  name: string; // 파일명
  created_at: string;
  updated_at?: string;
}
```

### types/report-event.ts

```typescript
export type ReportEventType = 
  | 'view' 
  | 'scroll_50' 
  | 'scroll_80' 
  | 'dwell_10s' 
  | 'dwell_30s';

export interface ReportEvent {
  id: string;
  user_id: string;
  prospect_id: string; // ⚠️ report_id가 아닌 prospect_id
  event_type: ReportEventType;
  metadata?: {
    scroll_depth?: number;
    dwell_seconds?: number;
  };
  created_at: string;
}
```

---

## 3. 핵심 기능 구현 (Core Features)

### 3.1 Vision 분석 (app/prospects/new)

#### **컴포넌트:** AnalysisTerminal.tsx

```typescript
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { analyzeUrlAction } from '@/app/actions/analyze-url'
import { useRouter } from 'next/navigation'

const DUMMY_LOGS = [
  { text: '> Connecting to analysis server...', delay: 500 },
  { text: '> Capturing full-page screenshot...', delay: 2000 },
  { text: '> Uploading to Gemini Vision API...', delay: 5000 },
  { text: '> Extracting visual USP...', delay: 8000 },
  { text: '> Analyzing color palette...', delay: 10000 },
  { text: '> Building report structure...', delay: 12000 },
  { text: '✓ Analysis complete!', delay: 14000 },
]

export function AnalysisTerminal({ url }: { url: string }) {
  const [logs, setLogs] = useState<string[]>([])
  const router = useRouter()

  useEffect(() => {
    // 1. 가짜 로그 순차 출력
    DUMMY_LOGS.forEach(({ text, delay }) => {
      setTimeout(() => {
        setLogs(prev => [...prev, text])
      }, delay)
    })

    // 2. 실제 API 호출 (백그라운드)
    analyzeUrlAction(url).then(prospect => {
      router.push(`/prospects/${prospect.id}/mix`)
    })
  }, [url])

  return (
    <div className="bg-zinc-950 p-8 rounded-sm font-mono text-xs text-zinc-500 min-h-[400px]">
      {logs.map((log, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          {log}
        </motion.div>
      ))}
    </div>
  )
}
```

---

### 3.2 인사이트 믹서 (app/prospects/[id]/mix) **[난이도 상]**

#### **A. 상태 관리 (store/mixer-store.ts)**

Zustand를 사용하여 **Custom Context**와 **Drag State**를 전역 관리합니다.

```typescript
import { create } from 'zustand'

interface MixerState {
  customContext: string;
  setCustomContext: (text: string) => void;
  isDragging: boolean;
  setIsDragging: (v: boolean) => void;
}

export const useMixerStore = create<MixerState>((set) => ({
  customContext: '',
  setCustomContext: (text) => set({ customContext: text }),
  isDragging: false,
  setIsDragging: (v) => set({ isDragging: v }),
}))
```

#### **B. 레이아웃 (app/prospects/[id]/mix/page.tsx) - 3단 분할**

```typescript
import { Workbench } from '@/components/mixer/Workbench'

export default function MixPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex h-screen">
      {/* Left: Asset Library */}
      <aside className="w-64 border-r border-zinc-800 overflow-y-auto">
        <AssetLibrary prospectId={params.id} />
      </aside>

      {/* Center: Editor & Injection Zone */}
      <main className="flex-1 border-r border-zinc-800 overflow-y-auto">
        <Workbench prospectId={params.id} />
      </main>

      {/* Right: Preview */}
      <aside className="w-96 overflow-y-auto">
        <ReportPreview prospectId={params.id} />
      </aside>
    </div>
  )
}
```

#### **C. 드래그 앤 드롭 로직 (SequencePlaylist.tsx)**

```typescript
'use client'

import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { StepCard } from './StepCard'
import { regenerateStepAction } from '@/app/actions/regenerate-step'
import { useState } from 'react'

export function SequencePlaylist({ prospectId }: { prospectId: string }) {
  const [steps, setSteps] = useState<Step[]>([]) // DB에서 로드 (5개)
  const [loadingStepId, setLoadingStepId] = useState<string | null>(null)

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    const assetId = active.data.current?.assetId // User Asset ID
    const chipText = active.data.current?.text // "📷 성과 그래프"
    const stepId = over.id as string

    // 1. Loading 표시
    setLoadingStepId(stepId)

    try {
      // 2. 서버 액션 호출
      const updatedBody = await regenerateStepAction({
        step_id: stepId,
        asset_id: assetId,
        chip_text: chipText,
      })

      // 3. Optimistic UI 업데이트
      setSteps(prev =>
        prev.map(step =>
          step.id === stepId
            ? { ...step, email_body: updatedBody }
            : step
        )
      )
    } finally {
      setLoadingStepId(null)
    }
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="space-y-4">
        {steps.map(step => (
          <StepCard
            key={step.id}
            step={step}
            isLoading={loadingStepId === step.id}
          />
        ))}
      </div>
    </DndContext>
  )
}
```

#### **D. Draggable Chip (StrategyChip.tsx)**

```typescript
'use client'

import { useDraggable } from '@dnd-kit/core'

export function StrategyChip({ text }: { text: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: text,
    data: { text },
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`
        border border-zinc-700 rounded-full px-3 py-1 text-xs
        cursor-grab active:cursor-grabbing
        ${isDragging ? 'opacity-50' : ''}
      `}
    >
      {text}
    </div>
  )
}
```

#### **E. Droppable StepCard (StepCard.tsx)**

```typescript
'use client'

import { useDroppable } from '@dnd-kit/core'
import { useState } from 'react'

export function StepCard({ step, isLoading }: { step: Step; isLoading: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: step.id })
  const [activeTab, setActiveTab] = useState<'teaser' | 'movie'>('teaser')

  return (
    <div
      ref={setNodeRef}
      className={`
        border border-zinc-800 rounded-sm p-4
        ${isOver ? 'bg-zinc-800/30' : ''}
      `}
    >
      {/* Step Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className={step.is_core_step ? 'text-indigo-500' : ''}>
          {step.step_number} {/* 1~5 */}
        </span>
        <span>{step.step_type}</span>
        {step.is_core_step && <span className="text-xs text-indigo-500">Core</span>}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-4 text-sm">
        <button
          onClick={() => setActiveTab('teaser')}
          className={activeTab === 'teaser' ? 'text-zinc-50' : 'text-zinc-500'}
        >
          ✉️ 예고편
          {activeTab === 'teaser' && <div className="mt-1 text-center">•</div>}
        </button>
        <button
          onClick={() => setActiveTab('movie')}
          className={activeTab === 'movie' ? 'text-zinc-50' : 'text-zinc-500'}
        >
          🖥️ 본편
          {activeTab === 'movie' && <div className="mt-1 text-center">•</div>}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'teaser' ? (
        <div>
          {isLoading ? (
            <div className="text-zinc-500 text-sm">Updating...</div>
          ) : (
            <>
              <input
                value={step.email_subject}
                className="w-full bg-transparent border-b border-zinc-800 mb-2"
              />
              <textarea
                value={step.email_body}
                className="w-full bg-transparent min-h-[200px]"
              />
            </>
          )}
        </div>
      ) : (
        <div className="text-zinc-400 text-sm">
          본편(리포트) 미리보기...
        </div>
      )}
    </div>
  )
}
```

#### **F. Optimistic UI (Copy & Log 버튼)**

```typescript
'use client'

import { useState } from 'react'
import { updateStepStatusAction } from '@/app/actions/update-step-status'
import { toast } from 'sonner'

export function CopyButton({ step }: { step: Step }) {
  const [isSent, setIsSent] = useState(step.status === 'sent')

  const handleCopy = async () => {
    // 1. 즉시 UI 업데이트 (Optimistic)
    setIsSent(true)

    // 2. 클립보드 복사
    await navigator.clipboard.writeText(
      `${step.email_subject}\n\n${step.email_body}`
    )

    // 3. 백그라운드 DB 업데이트
    await updateStepStatusAction(step.id, 'sent')

    // 4. Toast 알림
    toast.success('클립보드에 복사되었습니다')
  }

  return (
    <button
      onClick={handleCopy}
      disabled={isSent}
      className={`
        px-4 py-2 rounded-sm text-sm font-medium
        ${isSent 
          ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
          : 'bg-zinc-100 text-zinc-950 hover:bg-zinc-200'
        }
      `}
    >
      {isSent ? '✓ Copied' : 'Copy & Log'}
    </button>
  )
}
```

---

### 3.3 리포트 페이지 & 추적 (app/r/[id])

#### **A. 뷰어 구현 (app/r/[id]/page.tsx)**

```typescript
import { getProspectById } from '@/lib/supabase'
import { ReportViewer } from '@/components/report/ReportViewer'

export default async function ReportPage({ params }: { params: { id: string } }) {
  const prospect = await getProspectById(params.id)

  return (
    <div className="max-w-4xl mx-auto py-16 px-8">
      <ReportViewer prospect={prospect} />
    </div>
  )
}
```

#### **B. 추적 훅 (hooks/use-report-tracking.ts)**

```typescript
'use client'

import { useEffect } from 'react'
import { logReportEventAction } from '@/app/actions/log-report-event'

export function useReportTracking(prospectId: string) {
  useEffect(() => {
    // 1. View Logging (접속 즉시)
    logReportEventAction(prospectId, 'view')

    // 2. Dwell Timer (10초, 30초)
    const timer10s = setTimeout(() => {
      logReportEventAction(prospectId, 'dwell_10s')
    }, 10000)

    const timer30s = setTimeout(() => {
      logReportEventAction(prospectId, 'dwell_30s')
    }, 30000)

    // 3. Scroll Tracking (Debounce)
    let scrollTimeout: NodeJS.Timeout
    const handleScroll = () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight)
        
        if (scrolled > 0.5) {
          logReportEventAction(prospectId, 'scroll_50', { scroll_depth: scrolled })
        }
        if (scrolled > 0.8) {
          logReportEventAction(prospectId, 'scroll_80', { scroll_depth: scrolled })
        }
      }, 300)
    }

    window.addEventListener('scroll', handleScroll)

    return () => {
      clearTimeout(timer10s)
      clearTimeout(timer30s)
      clearTimeout(scrollTimeout)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [prospectId])
}
```

---

## 4. 서버 액션 (Server Actions)

**app/actions/ 폴더**에 비즈니스 로직을 집중시키세요.

### 4.1 analyze-url.ts

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs'

export async function analyzeUrlAction(url: string) {
  const { userId } = auth()
  if (!userId) throw new Error('Unauthorized')

  // 1. n8n Webhook 호출
  const response = await fetch(process.env.N8N_WEBHOOK_ANALYZE_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, user_id: userId }),
  })

  const { vision_data } = await response.json()

  // 2. prospects 테이블 INSERT
  const supabase = createClient()
  const { data: prospect } = await supabase
    .from('prospects')
    .insert({
      user_id: userId,
      name: extractDomain(url),
      url,
      vision_data,
    })
    .select()
    .single()

  return prospect
}
```

### 4.2 generate-sequence.ts

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'

export async function generateSequenceAction(prospectId: string) {
  const supabase = createClient()

  // 1. Prospect 데이터 가져오기
  const { data: prospect } = await supabase
    .from('prospects')
    .select('*')
    .eq('id', prospectId)
    .single()

  // 2. n8n 호출
  const response = await fetch(process.env.N8N_WEBHOOK_GENERATE_SEQUENCE!, {
    method: 'POST',
    body: JSON.stringify({
      prospect_id: prospectId,
      brand_name: prospect.name,
      vision_data: prospect.vision_data,
    }),
  })

  const { steps } = await response.json()

  // 3. Sequence 생성
  const { data: sequence } = await supabase
    .from('sequences')
    .insert({
      user_id: prospect.user_id,
      prospect_id: prospectId,
      name: `${prospect.name} 시퀀스`,
      sequence_type: '5_steps',
      total_steps: 5,
    })
    .select()
    .single()

  // 4. Steps 일괄 INSERT (5개)
  await supabase.from('step').insert(
    steps.map((s: any, i: number) => ({
      user_id: prospect.user_id,
      sequence_id: sequence.id,
      step_number: i + 1, // 1~5
      step_type: s.step_type,
      email_subject: s.email_subject,
      email_body: s.email_body,
      is_core_step: [1, 3, 5].includes(i + 1), // Core Step: 1, 3, 5번
    }))
  )

  return sequence
}
```

### 4.3 regenerate-step.ts

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'

export async function regenerateStepAction({
  step_id,
  chip_text,
}: {
  step_id: string
  chip_text: string
}) {
  const supabase = createClient()

  // 1. Step 데이터 가져오기
  const { data: step } = await supabase
    .from('step')
    .select('*, sequence:sequences(custom_context, prospect:prospects(*))')
    .eq('id', step_id)
    .single()

  // 2. n8n 호출
  const response = await fetch(process.env.N8N_WEBHOOK_REGENERATE_STEP!, {
    method: 'POST',
    body: JSON.stringify({
      step_id,
      step_number: step.step_number,
      brand_name: step.sequence.prospect.name,
      current_body: step.email_body,
      source_material: {
        vision_data: step.sequence.prospect.vision_data,
        custom_context: step.sequence.custom_context,
      },
      strategy_chip: chip_text,
    }),
  })

  const { email_body } = await response.json()

  // 3. Step 업데이트
  await supabase
    .from('step')
    .update({ email_body })
    .eq('id', step_id)

  return email_body
}
```

### 4.4 log-report-event.ts

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs'

export async function logReportEventAction(
  prospectId: string,
  eventType: ReportEventType,
  metadata?: any
) {
  const { userId } = auth()
  if (!userId) return

  const supabase = createClient()

  // 1. 이벤트 INSERT
  await supabase.from('report_events').insert({
    user_id: userId,
    prospect_id: prospectId,
    event_type: eventType,
    metadata,
  })

  // 2. CRM 상태 업데이트 체크
  const { data: events } = await supabase
    .from('report_events')
    .select('event_type')
    .eq('prospect_id', prospectId)

  const hasEvent = (type: string) =>
    events?.some(e => e.event_type === type)

  let newStatus = 'cold'

  if (hasEvent('scroll_80') && hasEvent('dwell_30s')) {
    newStatus = 'hot'
  } else if (hasEvent('scroll_50') && hasEvent('dwell_10s')) {
    newStatus = 'warm'
  }

  // 3. Prospect 업데이트
  await supabase
    .from('prospects')
    .update({
      crm_status: newStatus,
      last_viewed_at: new Date().toISOString(),
    })
    .eq('id', prospectId)

  // 4. 재방문 체크 (1시간 경과)
  const { data: prospect } = await supabase
    .from('prospects')
    .select('last_viewed_at, visit_count')
    .eq('id', prospectId)
    .single()

  const lastView = new Date(prospect.last_viewed_at)
  const now = new Date()

  if ((now.getTime() - lastView.getTime()) > 3600000) {
    await supabase
      .from('prospects')
      .update({ visit_count: prospect.visit_count + 1 })
      .eq('id', prospectId)
  }
}
```

---

## 5. 개발 체크리스트 (순서대로 진행)

1. [ ] `.env.local`에 Clerk, Supabase, n8n API URL 설정
2. [ ] `types/` 정의 완료
3. [ ] Clerk 미들웨어 설정 (`middleware.ts`)
4. [ ] `components/dashboard` 구현 (Table UI)
5. [ ] `prospects/new` 로딩 애니메이션 구현
6. [ ] `mix` 페이지 레이아웃 (Sidebar + Main) 잡기
7. [ ] **[핵심]** dnd-kit 연동하여 칩 드래그 구현
8. [ ] n8n Webhook 연결 및 데이터 흐름 테스트
9. [ ] 리포트 페이지 추적 로직(`log-event`) 검증
10. [ ] Optimistic UI (Copy & Log) 완성

---

## 6. DashboardCard 사용 규칙

- 위치: `components/dashboard/dashboard-card.tsx`, 타입 정의는 `types/dashboard.ts`
- Props: `title`, `value`, `trend`, `trendLabel`, `description`, `icon`, `variant`, `href`를 기본으로 하여 `DashboardCardData` 배열을 map 렌더링
- Variant: `default | success | warning | danger`는 `lib/dashboard-card-variants.ts`에서 Tailwind 클래스를 일괄 관리
- 디자인: DESIGN_PLAN의 Sharp & Technical 원칙 준수 (border 기반, 그림자 금지, 150ms transition, text scale `text-sm`/`text-xs`)
- 관측성: 렌더 시 `console.info('[DashboardCard] render', { title, variant })` 로그 유지, `data-card-variant`로 테스트 포인트 제공
- 사용 범위: KPI/CRM 메트릭 카드 전용, 화면당 12개 이하 유지. 확장 시 variant 토큰과 로그 포맷을 재사용

---

**이 가이드를 따르면 Cursor가 LinkPitch의 모든 핵심 기능을 구현할 수 있습니다.**