-- ================================================
-- generated_emails 테이블 UNIQUE 제약조건 추가
-- LinkPitch MVP - 리포트 뷰어 데이터 무결성 보장
-- ================================================
--
-- 리포트 뷰어 페이지에서 (prospect_id, step_number) 조합으로
-- 단일 리포트를 조회하므로, 데이터베이스 레벨에서 중복을 방지해야 합니다.
-- .single() 호출 시 정확히 하나의 레코드만 반환되도록 보장합니다.
-- ================================================

-- (prospect_id, step_number) 조합에 대한 UNIQUE 제약조건 추가
-- 하나의 prospect에 대해 각 step_number는 유일해야 함
-- prospect_id가 NULL이 아닌 경우에만 적용 (부분 UNIQUE 인덱스)
CREATE UNIQUE INDEX uq_generated_emails_prospect_step 
ON generated_emails(prospect_id, step_number) 
WHERE prospect_id IS NOT NULL;

-- ================================================
-- 완료 메시지
-- ================================================

DO $$
BEGIN
    RAISE NOTICE '✅ generated_emails 테이블에 UNIQUE 제약조건이 추가되었습니다!';
    RAISE NOTICE '🔒 제약조건: (prospect_id, step_number) 조합이 유일함을 보장';
    RAISE NOTICE '📊 리포트 뷰어의 .single() 쿼리가 안전하게 작동합니다.';
END $$;

