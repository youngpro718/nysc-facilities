-- Manual Rate Limit Reset Query
-- Run this in your Supabase SQL editor to reset rate limits
-- No functions needed - direct table operations

-- ⚠️  REPLACE 'your-email@domain.com' with the actual email address
-- that's being rate limited before running!

-- 🔍 STEP 1: Check current rate limit status first
SELECT 
    identifier,
    attempt_type,
    attempts,
    last_attempt,
    blocked_until,
    (blocked_until IS NOT NULL AND blocked_until > now()) as is_currently_blocked
FROM auth_rate_limits 
WHERE identifier = 'your-email@domain.com';

-- 🗑️  STEP 2: Reset all rate limits for a specific email (RECOMMENDED)
DELETE FROM auth_rate_limits 
WHERE identifier = 'your-email@domain.com';

-- Alternative: Reset only login attempts for a specific email
-- DELETE FROM auth_rate_limits 
-- WHERE identifier = 'your-email@domain.com' 
-- AND attempt_type = 'login';

-- 🔍 STEP 3: Verify the reset worked (should return no rows)
SELECT 
    identifier,
    attempt_type,
    attempts,
    last_attempt,
    blocked_until
FROM auth_rate_limits 
WHERE identifier = 'your-email@domain.com';

-- 📊 OPTIONAL: View all current rate limits (for admin review)
-- SELECT 
--     identifier,
--     attempt_type,
--     attempts,
--     last_attempt,
--     blocked_until,
--     (blocked_until IS NOT NULL AND blocked_until > now()) as is_currently_blocked
-- FROM auth_rate_limits 
-- ORDER BY last_attempt DESC
-- LIMIT 20;

-- 🚨 EMERGENCY: Reset ALL rate limits for ALL users (USE WITH EXTREME CAUTION)
-- DELETE FROM auth_rate_limits;
