-- Manual script to reset rate limits
-- Replace 'your-email@example.com' with the actual email address that's being rate limited

-- Option 1: Reset only login attempts for a specific email
DELETE FROM auth_rate_limits 
WHERE identifier = 'your-email@example.com' 
AND attempt_type = 'login';

-- Option 2: Reset all rate limits for a specific email (uncomment if needed)
-- DELETE FROM auth_rate_limits 
-- WHERE identifier = 'your-email@example.com';

-- Option 3: Reset all rate limits for all users (DANGEROUS - use with caution)
-- DELETE FROM auth_rate_limits;

-- Check current rate limit status for a specific email
SELECT 
    identifier,
    attempt_type,
    attempts,
    last_attempt,
    blocked_until,
    (blocked_until IS NOT NULL AND blocked_until > now()) as is_currently_blocked
FROM auth_rate_limits 
WHERE identifier = 'your-email@example.com';

-- Check all current rate limits (for admin review)
SELECT 
    identifier,
    attempt_type,
    attempts,
    last_attempt,
    blocked_until,
    (blocked_until IS NOT NULL AND blocked_until > now()) as is_currently_blocked
FROM auth_rate_limits 
ORDER BY last_attempt DESC;
