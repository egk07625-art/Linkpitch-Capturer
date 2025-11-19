-- Storage 버킷 생성
-- RLS 정책은 출시 전에 별도 마이그레이션으로 추가 예정

-- app-assets 버킷 생성 (이미 존재하면 무시됨)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'app-assets',
  'app-assets',
  true,  -- public bucket (create-storage-folders.sh에서 --public 사용)
  6291456,  -- 6MB 제한 (6 * 1024 * 1024)
  NULL  -- 모든 파일 타입 허용
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 6291456;

-- ============================================
-- RLS 정책 (출시 전에 활성화 예정)
-- 아래 정책들은 주석 해제하여 별도 마이그레이션 파일로 생성하거나
-- 이 파일에 추가하여 적용할 수 있습니다.
-- ============================================

-- -- INSERT: 인증된 사용자만 자신의 폴더에 업로드 가능
-- CREATE POLICY "Users can upload to own folder"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (
--   bucket_id = 'app-assets' AND
--   (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
-- );

-- -- SELECT: 인증된 사용자만 자신의 파일 조회 가능
-- CREATE POLICY "Users can view own files"
-- ON storage.objects FOR SELECT
-- TO authenticated
-- USING (
--   bucket_id = 'app-assets' AND
--   (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
-- );

-- -- DELETE: 인증된 사용자만 자신의 파일 삭제 가능
-- CREATE POLICY "Users can delete own files"
-- ON storage.objects FOR DELETE
-- TO authenticated
-- USING (
--   bucket_id = 'app-assets' AND
--   (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
-- );

-- -- UPDATE: 인증된 사용자만 자신의 파일 업데이트 가능
-- CREATE POLICY "Users can update own files"
-- ON storage.objects FOR UPDATE
-- TO authenticated
-- USING (
--   bucket_id = 'app-assets' AND
--   (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
-- )
-- WITH CHECK (
--   bucket_id = 'app-assets' AND
--   (storage.foldername(name))[1] = (SELECT auth.jwt()->>'sub')
-- );
