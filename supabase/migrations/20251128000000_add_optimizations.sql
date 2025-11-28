-- ================================================================
-- LinkPitch MVP v6.3 - Schema Optimizations
-- 추가 인덱스 + 데이터 무결성 제약조건
-- ================================================================

-- [1] 성능 최적화 인덱스 추가

-- CRM 대시보드: "Hot 고객사 목록 보기" (user_id + crm_status + 최근 활동순)
CREATE INDEX idx_prospects_crm_dashboard ON prospects(user_id, crm_status, last_activity_at DESC NULLS LAST);

-- 자산 라이브러리: "내가 업로드한 파일 목록" (user_id + 최신순)
CREATE INDEX idx_user_assets_user_created ON user_assets(user_id, created_at DESC);

-- 리포트 추적: "고객사별 방문 기록 조회" (prospect_id + 시간순)
CREATE INDEX idx_report_tracking_prospect ON report_tracking_logs(prospect_id, created_at DESC);

-- 시퀀스 필터: "진행 중인 시퀀스만 보기"
CREATE INDEX idx_sequences_user_status ON sequences(user_id, status);

-- 부분 인덱스: Active 시퀀스만 (공간 절약)
CREATE INDEX idx_sequences_active ON sequences(user_id, prospect_id) WHERE status = 'active';

-- 캐시 정리용: 접근 시간 인덱스 (cleanup 함수에서 사용)
CREATE INDEX idx_cache_last_accessed ON site_analysis_cache(last_accessed_at);

-- [2] 데이터 무결성 제약조건 추가

-- Prospects 테이블
ALTER TABLE prospects 
ADD CONSTRAINT chk_prospects_scroll_depth CHECK (max_scroll_depth BETWEEN 0 AND 100),
ADD CONSTRAINT chk_prospects_duration CHECK (max_duration_seconds >= 0),
ADD CONSTRAINT chk_prospects_visit_count CHECK (visit_count >= 0);

-- Report Tracking Logs 테이블
ALTER TABLE report_tracking_logs
ADD CONSTRAINT chk_tracking_scroll_depth CHECK (scroll_depth BETWEEN 0 AND 100),
ADD CONSTRAINT chk_tracking_duration CHECK (duration_seconds >= 0);

-- [3] 유틸리티 함수: 캐시 정리 (Cron Job용)

-- 기존 함수 삭제 (return type 변경을 위해)
DROP FUNCTION IF EXISTS cleanup_expired_cache();

CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS TABLE(deleted_count INT) AS $$
DECLARE
    row_count INT;
BEGIN
    DELETE FROM site_analysis_cache
    WHERE last_accessed_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS row_count = ROW_COUNT;
    RETURN QUERY SELECT row_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_cache IS '30일 이상 미사용 캐시 삭제 (크론잡으로 실행)';

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE 'v6.3 최적화 완료!';
    RAISE NOTICE '신규 인덱스: 7개 추가 (CRM 대시보드, 자산 라이브러리, 리포트 추적 등)';
    RAISE NOTICE '제약조건: 6개 추가 (스크롤 0-100%%, 음수 방지)';
    RAISE NOTICE '유틸리티: cleanup_expired_cache() 함수 추가';
END $$;
