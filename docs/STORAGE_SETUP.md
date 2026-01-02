# Storage RLS 정책 설정 가이드

## 문제
"new row violates row-level security policy" 에러가 발생하는 경우, Storage 버킷에 대한 RLS 정책이 설정되지 않았기 때문입니다.

## 해결 방법

### 방법 1: 마이그레이션 적용 (권장)

```bash
# Supabase CLI를 사용하여 마이그레이션 적용
supabase db push

# 또는 Supabase Dashboard에서 직접 SQL 실행
# supabase/migrations/20250101000000_setup_storage_rls.sql 파일의 내용을 복사하여 실행
```

### 방법 2: Supabase Dashboard에서 직접 설정

1. Supabase Dashboard → Storage → Policies로 이동
2. `app-assets` 버킷 선택
3. 다음 정책들을 추가:

#### SELECT 정책
```sql
CREATE POLICY "app-assets-select-own"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'app-assets' AND
  (string_to_array(name, '/'))[1] = auth.jwt()->>'sub'
);
```

#### INSERT 정책
```sql
CREATE POLICY "app-assets-insert-own"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'app-assets' AND
  (string_to_array(name, '/'))[1] = auth.jwt()->>'sub'
);
```

#### UPDATE 정책
```sql
CREATE POLICY "app-assets-update-own"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'app-assets' AND
  (string_to_array(name, '/'))[1] = auth.jwt()->>'sub'
)
WITH CHECK (
  bucket_id = 'app-assets' AND
  (string_to_array(name, '/'))[1] = auth.jwt()->>'sub'
);
```

#### DELETE 정책
```sql
CREATE POLICY "app-assets-delete-own"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'app-assets' AND
  (string_to_array(name, '/'))[1] = auth.jwt()->>'sub'
);
```

### 방법 3: 개발 환경에서 임시로 RLS 비활성화 (비권장)

개발 환경에서만 사용하고, 프로덕션에서는 반드시 RLS를 활성화해야 합니다.

```sql
-- Storage 버킷을 public으로 설정하고 RLS 비활성화
UPDATE storage.buckets
SET public = true
WHERE id = 'app-assets';

-- 기존 정책 삭제 (있는 경우)
DROP POLICY IF EXISTS "app-assets-select-own" ON storage.objects;
DROP POLICY IF EXISTS "app-assets-insert-own" ON storage.objects;
DROP POLICY IF EXISTS "app-assets-update-own" ON storage.objects;
DROP POLICY IF EXISTS "app-assets-delete-own" ON storage.objects;
```

## 확인 방법

마이그레이션 적용 후:

1. 브라우저 콘솔에서 에러가 사라졌는지 확인
2. 이미지 업로드가 정상적으로 작동하는지 테스트
3. Supabase Dashboard → Storage → Policies에서 정책이 생성되었는지 확인

## 참고

- RLS 정책은 사용자가 자신의 폴더(`{clerk_id}/filename`)에만 접근할 수 있도록 제한합니다
- Clerk JWT의 `sub` claim을 사용하여 사용자 인증을 확인합니다
- 프로덕션 환경에서는 반드시 RLS를 활성화해야 합니다

