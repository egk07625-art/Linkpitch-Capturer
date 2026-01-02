-- ================================================
-- Storage Bucket RLS Policies 해제
-- 개발 환경용 - 프로덕션 배포 전에 다시 활성화 필요
-- ================================================

-- Storage 버킷을 public으로 설정 (RLS 우회)
UPDATE storage.buckets
SET public = true
WHERE id = 'app-assets';

-- 기존 RLS 정책 삭제
DROP POLICY IF EXISTS "app-assets-select-own" ON storage.objects;
DROP POLICY IF EXISTS "app-assets-insert-own" ON storage.objects;
DROP POLICY IF EXISTS "app-assets-update-own" ON storage.objects;
DROP POLICY IF EXISTS "app-assets-delete-own" ON storage.objects;

-- ================================================
-- Completion Message
-- ================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Storage RLS Policies disabled successfully!';
    RAISE NOTICE '⚠️  Warning: This is for development only!';
    RAISE NOTICE '🔒 Remember to enable RLS before production deployment!';
END $$;

