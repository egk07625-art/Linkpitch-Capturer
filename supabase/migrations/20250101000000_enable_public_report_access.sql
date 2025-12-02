-- ================================================
-- 공개 리포트 접근 준비 (RLS 비활성화 상태)
-- LinkPitch MVP - 리포트 뷰어 공개 접근 허용
-- ================================================
--
-- 리포트 뷰어는 공개 링크로 제공되어야 하므로,
-- generated_emails와 report_tracking_logs 테이블에
-- 인증 없이 접근할 수 있어야 합니다.
--
-- 보안: prospect_id (UUID)가 사실상 비밀번호 역할을 하므로
--       링크를 받은 당사자만 리포트를 볼 수 있습니다.
--
-- ⚠️ 중요: RLS는 출시 직전에 활성화 예정
-- 현재는 RLS가 비활성화된 상태로 개발 진행
-- ================================================

-- ================================================
-- RLS 비활성화 보장 (개발 단계)
-- ================================================

-- RLS가 활성화되어 있다면 비활성화
ALTER TABLE generated_emails DISABLE ROW LEVEL SECURITY;
ALTER TABLE report_tracking_logs DISABLE ROW LEVEL SECURITY;

-- ================================================
-- 완료 메시지
-- ================================================

DO $$
BEGIN
    RAISE NOTICE '✅ 리포트 뷰어 공개 접근 준비 완료 (RLS 비활성화)';
    RAISE NOTICE '📄 generated_emails: RLS 비활성화 (공개 접근 가능)';
    RAISE NOTICE '📊 report_tracking_logs: RLS 비활성화 (공개 접근 가능)';
    RAISE NOTICE '🔒 보안: UUID 기반 시크릿 링크 전략 (prospect_id가 비밀번호 역할)';
    RAISE NOTICE '⚠️  RLS는 출시 직전에 활성화 예정';
END $$;

