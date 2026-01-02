-- ================================================
-- Storage Bucket RLS Policies
-- app-assets 버킷에 대한 Row Level Security 설정
-- ================================================

-- Storage 버킷이 존재하는지 확인하고 생성 (없는 경우)
INSERT INTO storage.buckets (id, name, public)
VALUES ('app-assets', 'app-assets', true)
ON CONFLICT (id) DO NOTHING;

-- ================================================
-- Storage Objects RLS Policies
-- ================================================

-- 1. SELECT 정책: 인증된 사용자는 자신의 폴더에 있는 파일만 조회 가능
CREATE POLICY IF NOT EXISTS "app-assets-select-own"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'app-assets' AND
  (
    -- 자신의 폴더 (clerk_id로 시작하는 경로)
    -- 경로 형식: {clerk_id}/filename
    (string_to_array(name, '/'))[1] = auth.jwt()->>'sub'
  )
);

-- 2. INSERT 정책: 인증된 사용자는 자신의 폴더에만 업로드 가능
CREATE POLICY IF NOT EXISTS "app-assets-insert-own"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'app-assets' AND
  (
    -- 자신의 폴더 (clerk_id로 시작하는 경로)
    -- 경로 형식: {clerk_id}/filename
    (string_to_array(name, '/'))[1] = auth.jwt()->>'sub'
  )
);

-- 3. UPDATE 정책: 인증된 사용자는 자신의 파일만 업데이트 가능
CREATE POLICY IF NOT EXISTS "app-assets-update-own"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'app-assets' AND
  (
    -- 자신의 폴더 (clerk_id로 시작하는 경로)
    (string_to_array(name, '/'))[1] = auth.jwt()->>'sub'
  )
)
WITH CHECK (
  bucket_id = 'app-assets' AND
  (
    -- 자신의 폴더 (clerk_id로 시작하는 경로)
    (string_to_array(name, '/'))[1] = auth.jwt()->>'sub'
  )
);

-- 4. DELETE 정책: 인증된 사용자는 자신의 파일만 삭제 가능
CREATE POLICY IF NOT EXISTS "app-assets-delete-own"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'app-assets' AND
  (
    -- 자신의 폴더 (clerk_id로 시작하는 경로)
    (string_to_array(name, '/'))[1] = auth.jwt()->>'sub'
  )
);

-- ================================================
-- Completion Message
-- ================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Storage RLS Policies enabled successfully!';
    RAISE NOTICE '🔒 Bucket protected: app-assets';
    RAISE NOTICE '👤 Policy type: Users can only access files in their own folder';
    RAISE NOTICE '🔑 Authentication: Clerk JWT integration via auth.jwt()->>''sub''';
END $$;

