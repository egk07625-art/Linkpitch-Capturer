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

