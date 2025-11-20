# ERROR REPORT

## 2025-01-XX - Vercel 배포 실패

### 에러 원인
**빌드 실패: `react/no-unescaped-entities` 에러**

#### 1. 실제 에러 (빌드 실패 원인)
- **파일**: `app/test-design-system/page.tsx`
- **라인**: 154
- **에러**: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`
- **원인**: JSX 내부 문자열에서 작은따옴표(`'`)가 이스케이프되지 않음
- **해결**: 작은따옴표를 큰따옴표로 변경 또는 HTML 엔티티로 이스케이프

```typescript
// 에러 발생 코드
getComputedStyle(document.documentElement).getPropertyValue('--bg-primary')

// 수정 후
getComputedStyle(document.documentElement).getPropertyValue("--bg-primary")
```

#### 2. 경고 (빌드 중단시키지 않지만 정리 필요)

**`components/Navbar.tsx`**
- 라인 1: `SignInButton` import되었지만 사용되지 않음

**`app/actions/reports.ts`**
- 라인 13: `updateProspect` import되었지만 사용되지 않음
- 라인 23: `input` 파라미터 정의되었지만 사용되지 않음
- 라인 25: `supabase` 변수 할당되었지만 사용되지 않음

**`app/actions/steps.ts`**
- 라인 17: `prospectId` 파라미터 정의되었지만 사용되지 않음
- 라인 18: `supabase` 변수 할당되었지만 사용되지 않음
- 라인 26: `input` 파라미터 정의되었지만 사용되지 않음
- 라인 27: `supabase` 변수 할당되었지만 사용되지 않음
- 라인 36: `id` 파라미터 정의되었지만 사용되지 않음
- 라인 37: `input` 파라미터 정의되었지만 사용되지 않음
- 라인 39: `supabase` 변수 할당되었지만 사용되지 않음

**`app/api/generate-step/route.ts`**
- 라인 20: `body` 변수 할당되었지만 사용되지 않음

### 해결 상태
- [x] ERROR-REPORT 파일 생성 및 기록
- [x] 실제 에러 수정 (test-design-system/page.tsx) - 작은따옴표를 큰따옴표로 변경
- [x] 경고 정리 (미사용 변수/import 제거)
  - [x] Navbar.tsx: SignInButton import 제거
  - [x] reports.ts: updateProspect import 제거, createClerkSupabaseClient import 제거, 미사용 파라미터 언더스코어 접두사 추가
  - [x] steps.ts: createClerkSupabaseClient import 제거, 미사용 파라미터 언더스코어 접두사 추가
  - [x] generate-step/route.ts: 미사용 body 변수 언더스코어 접두사 추가

### 수정 완료 날짜
2025-01-XX

---

## 2025-01-XX - Vercel 배포 실패 (두 번째)

### 에러 원인
**빌드 실패: `@typescript-eslint/no-unused-vars` 에러**

#### 실제 에러 (빌드 실패 원인)
- **파일**: `app/actions/generate-sequence.ts`
- **라인**: 14-15
- **에러**: 
  - `'Step' is defined but never used`
  - `'Prospect' is defined but never used`
- **원인**: 타입을 import했지만 실제로 사용하지 않음
- **해결**: 미사용 import 제거

```typescript
// 에러 발생 코드
import type { Step } from '@/types/step';
import type { Prospect } from '@/types/prospect';

// 수정 후
// 위 두 줄 제거 (실제로 사용되지 않음)
```

### 해결 상태
- [x] ERROR-REPORT 파일에 새 에러 기록
- [x] 실제 에러 수정 (generate-sequence.ts) - 미사용 Step, Prospect import 제거

### 수정 완료 날짜
2025-01-XX


---

## 2025-01-XX - Vercel 배포 실패 (세 번째) - 컴파일 경고 해결

### 에러 원인
**빌드 경고: `@typescript-eslint/no-unused-vars` 경고 다수**

#### 경고 목록
- **`app/actions/generation.ts`**
  - 라인 20: `url` 파라미터 미사용
  - 라인 57-59: `brandName`, `visionData`, `strategyKeywords` 파라미터 미사용

- **`app/actions/reports.ts`**
  - 라인 21: `_input` 파라미터 미사용 (언더스코어 접두사 있음)

- **`app/actions/steps.ts`**
  - 라인 16: `_prospectId` 파라미터 미사용
  - 라인 25: `_input` 파라미터 미사용
  - 라인 35-36: `_id`, `_input` 파라미터 미사용

- **`app/api/generate-step/route.ts`**
  - 라인 20: `_body` 변수 미사용

- **`app/test-design-system/page.tsx`**
  - 라인 154: JSX 내부 작은따옴표 이스케이프 필요

- **`app/actions/steps.ts`, `lib/server/steps.ts`**
  - `is_sent` 속성이 `UpdateStepInput` 타입에 없음

### 해결 방법

#### 1. ESLint 설정 수정
`eslint.config.mjs`에 언더스코어 접두사 변수 무시 규칙 추가:
```javascript
"@typescript-eslint/no-unused-vars": [
  "warn",
  {
    argsIgnorePattern: "^_",
    varsIgnorePattern: "^_",
  },
],
```

#### 2. 미사용 파라미터 언더스코어 접두사 추가
- `app/actions/generation.ts`: `url` → `_url`, `brandName` → `_brandName` 등

#### 3. JSX 이스케이프 수정
- `app/test-design-system/page.tsx`: 작은따옴표를 HTML 엔티티로 변경 (`&apos;`)

#### 4. 타입 에러 수정
- `app/actions/steps.ts`, `lib/server/steps.ts`: `is_sent` 속성 제거 (타입에 없음)

### 해결 상태
- [x] ERROR-REPORT 파일에 새 에러 기록
- [x] ESLint 설정 수정 (언더스코어 접두사 변수 무시 규칙 추가)
- [x] 모든 미사용 파라미터 언더스코어 접두사 추가
- [x] JSX 이스케이프 수정
- [x] 타입 에러 수정 (`is_sent` 제거)
- [x] 빌드 성공 확인 (경고 0개)

### 수정 완료 날짜
2025-01-XX
