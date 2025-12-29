-- Add cta_text and report_url columns to generated_emails table
-- Migration: 20251228120000

ALTER TABLE generated_emails
ADD COLUMN IF NOT EXISTS cta_text TEXT,
ADD COLUMN IF NOT EXISTS report_url TEXT;

COMMENT ON COLUMN generated_emails.cta_text IS 'CTA 버튼 텍스트 (예: "자세히 보기", "리포트 확인하기")';
COMMENT ON COLUMN generated_emails.report_url IS '리포트 공개 URL (예: /r/{uuid})';
