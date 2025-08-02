-- Rate Limit Reset for jduchate@gmail.com
-- Copy and paste this into your Supabase SQL Editor

-- 🔍 STEP 1: Check current rate limit status
SELECT 
    identifier,
    attempt_type,
    attempts,
    last_attempt,
    blocked_until,
    (blocked_until IS NOT NULL AND blocked_until > now()) as is_currently_blocked
FROM auth_rate_limits 
WHERE identifier = 'jduchate@gmail.com';

-- 🗑️ STEP 2: Reset all rate limits for jduchate@gmail.com
DELETE FROM auth_rate_limits 
WHERE identifier = 'jduchate@gmail.com';

-- ✅ STEP 3: Verify the reset worked (should return no rows)
SELECT 
    identifier,
    attempt_type,
    attempts,
    last_attempt,
    blocked_until
FROM auth_rate_limits 
WHERE identifier = 'jduchate@gmail.com';

-- 🎉 Success message
SELECT 'Rate limits reset successfully for jduchate@gmail.com' as message;
