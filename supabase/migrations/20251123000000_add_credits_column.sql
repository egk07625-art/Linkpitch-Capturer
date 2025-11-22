-- ================================================
-- Add Credits Column to Users Table
-- Free Trial Credit System Implementation
-- ================================================

-- Add credits column to users table with default value of 3
ALTER TABLE users 
ADD COLUMN credits INT NOT NULL DEFAULT 3;

-- Add check constraint to ensure credits cannot be negative
ALTER TABLE users
ADD CONSTRAINT chk_users_credits CHECK (credits >= 0);

-- Add comment for documentation
COMMENT ON COLUMN users.credits IS '사용자 무료 크레딧 (가입 시 3개 제공)';

-- Create index for performance optimization
CREATE INDEX idx_users_credits ON users(credits);

-- ================================================
-- Completion Message
-- ================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Credits column added to users table';
    RAISE NOTICE '📊 Default value: 3 credits per new user';
    RAISE NOTICE '🔒 Constraint: credits >= 0';
END $$;
