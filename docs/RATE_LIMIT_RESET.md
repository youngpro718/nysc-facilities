# Rate Limit Reset Guide

When users encounter "Too many attempts. Please try again later." errors, you can reset their rate limits using several methods.

## 🚨 Quick Reset (Recommended)

For immediate relief, use the quick reset script:

```bash
node scripts/quickResetRateLimit.js user@example.com
```

This will instantly remove all rate limits for the specified email address.

## 🔧 Interactive Reset

For more control and status checking:

```bash
node scripts/resetRateLimit.js user@example.com
```

This script will:
1. Show current rate limit status
2. Ask for confirmation before resetting
3. Allow you to reset specific attempt types (login, signup, etc.)

## 🖥️ Admin UI Method

1. Navigate to **Admin Profile** → **Security** tab
2. Enter the user's email address
3. Click "Check Status" to see current rate limits
4. Use "Reset Login Attempts" or "Reset All Attempts" buttons

## 📊 Manual Database Method

If you have direct database access, you can run SQL commands:

```sql
-- Reset login attempts for specific user
DELETE FROM auth_rate_limits 
WHERE identifier = 'user@example.com' 
AND attempt_type = 'login';

-- Reset all rate limits for specific user
DELETE FROM auth_rate_limits 
WHERE identifier = 'user@example.com';

-- Check current status
SELECT * FROM auth_rate_limits 
WHERE identifier = 'user@example.com';
```

## 🔍 Understanding Rate Limits

The system tracks attempts by:
- **Identifier**: Usually the email address
- **Attempt Type**: `login`, `signup`, `role_assignment`
- **Max Attempts**: Default is 5 attempts
- **Window**: Default is 15 minutes for login, 60 minutes for others

## 🛡️ Security Considerations

- Only administrators can reset rate limits
- All reset actions are logged in the security audit log
- Rate limits automatically expire after the time window
- Consider investigating why a user hit rate limits before resetting

## 📝 Common Scenarios

### User Forgot Password
```bash
# Reset login attempts so they can try again
node scripts/quickResetRateLimit.js user@example.com
```

### Testing/Development
```bash
# Reset all attempts for test account
node scripts/quickResetRateLimit.js test@example.com
```

### Bulk Reset (if needed)
```sql
-- CAUTION: This resets ALL rate limits for ALL users
DELETE FROM auth_rate_limits;
```

## 🔧 Troubleshooting

### Script Errors
- Ensure `.env` file has `VITE_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Check that Node.js is installed
- Verify database connection

### Permission Errors
- Ensure you have admin role in the system
- Check that the `auth_rate_limits` table exists
- Verify RLS policies allow admin access

### Still Blocked After Reset
- Clear browser cache/cookies
- Check if there are other security measures in place
- Verify the correct email address was used
