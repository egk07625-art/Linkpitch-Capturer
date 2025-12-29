# Supabase 스키마 적용 확인 가이드

이 문서는 통합된 마이그레이션 파일이 Supabase에 제대로 적용되었는지 확인하는 방법을 안내합니다.

## 확인 항목

### 1. Supabase Dashboard에서 RLS 상태 확인

Supabase Dashboard의 SQL Editor에서 다음 쿼리를 실행하세요:

```sql
-- 모든 테이블의 RLS 상태 확인
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**예상 결과**: 모든 테이블의 `rls_enabled`가 `false`여야 합니다.

**확인할 테이블들**:
- users
- user_plans
- prospects
- sequences
- step
- step_generations
- user_assets
- site_analysis_cache
- generated_emails
- report_tracking_logs
- plans
- step_templates

### 2. Credits 컬럼 확인

```sql
-- users 테이블에 credits 컬럼이 있는지 확인
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND column_name = 'credits';
```

**예상 결과**: 
- `column_name`: credits
- `data_type`: integer
- `column_default`: 3
- `is_nullable`: NO

### 3. Credits 제약조건 확인

```sql
-- credits 컬럼 제약조건 확인
SELECT 
  constraint_name,
  constraint_type,
  check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public' 
  AND tc.table_name = 'users'
  AND (tc.constraint_name LIKE '%credits%' OR cc.constraint_name LIKE '%credits%');
```

**예상 결과**: `chk_users_credits` 제약조건이 `credits >= 0`로 설정되어 있어야 합니다.

### 4. cleanup_expired_cache 함수 확인

```sql
-- cleanup_expired_cache 함수 확인
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'cleanup_expired_cache';
```

**예상 결과**: 함수가 존재하고 `RETURNS TABLE(deleted_count INT)`로 정의되어 있어야 합니다.

### 5. 초기 데이터 확인

```sql
-- 초기 데이터 확인
SELECT 'step_templates' as table_name, COUNT(*) as count FROM step_templates
UNION ALL
SELECT 'plans', COUNT(*) FROM plans
UNION ALL
SELECT 'users', COUNT(*) FROM users;
```

**예상 결과**:
- `step_templates`: 5개 (step 1-5)
- `plans`: 3개 (free, starter, pro)
- `users`: 1개 이상 (admin 포함)

## 웹사이트에서 확인

### 1. 로그인 및 사용자 동기화 확인

1. 웹사이트에 로그인합니다.
2. 브라우저 개발자 도구의 콘솔을 엽니다 (F12).
3. 다음 메시지가 표시되는지 확인:
   - `User synced successfully:` - 사용자가 성공적으로 동기화됨

### 2. Prospects 페이지 확인

1. `/prospects` 페이지로 이동합니다.
2. 다음을 확인합니다:
   - 에러 메시지가 표시되지 않아야 함
   - 빈 목록이 표시되거나 등록된 고객사 목록이 표시되어야 함
   - 콘솔에 "User not found" 에러가 없어야 함

### 3. 네트워크 요청 확인

1. 개발자 도구의 Network 탭을 엽니다.
2. `/prospects` 페이지를 새로고침합니다.
3. 다음 요청들을 확인:
   - `/api/sync-user` - 200 상태 코드
   - Supabase API 호출들 - 200 상태 코드

## 문제 해결

### RLS가 여전히 활성화된 경우

Supabase Dashboard의 SQL Editor에서 다음을 실행:

```sql
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
```

### 사용자 동기화 실패 시

1. 콘솔에서 에러 메시지를 확인합니다.
2. `/api/sync-user` 엔드포인트가 정상 작동하는지 확인합니다.
3. 수동으로 동기화를 시도할 수 있습니다:

```bash
# 브라우저 콘솔에서 실행
fetch('/api/sync-user', { method: 'POST' })
  .then(res => res.json())
  .then(console.log)
  .catch(console.error);
```

### Credits 컬럼이 없는 경우

Supabase Dashboard의 SQL Editor에서 다음을 실행:

```sql
-- credits 컬럼 추가
ALTER TABLE users 
ADD COLUMN credits INT NOT NULL DEFAULT 3;

-- 제약조건 추가
ALTER TABLE users
ADD CONSTRAINT chk_users_credits CHECK (credits >= 0);

-- 인덱스 추가
CREATE INDEX idx_users_credits ON users(credits);
```

## 확인 체크리스트

- [ ] 모든 테이블의 RLS가 비활성화됨
- [ ] credits 컬럼이 users 테이블에 존재함
- [ ] credits 제약조건이 올바르게 설정됨
- [ ] cleanup_expired_cache 함수가 존재함
- [ ] 초기 데이터가 올바르게 삽입됨
- [ ] 로그인 후 사용자가 Supabase에 동기화됨
- [ ] `/prospects` 페이지에서 에러가 발생하지 않음
- [ ] 네트워크 요청이 모두 성공함

## 완료 후

모든 확인 항목이 통과되면:
1. RLS가 비활성화된 상태에서 정상 작동함을 확인했습니다.
2. 사용자 동기화가 자동으로 작동합니다.
3. Prospects 페이지가 에러 없이 작동합니다.

**다음 단계**: 프로덕션 배포 전에 `20251123012300_enable_rls_policies.sql.disabled` 파일을 활성화하여 RLS를 다시 적용해야 합니다.





























