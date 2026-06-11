# Stop the "too many signup attempts" lockouts

## Why this is happening
Every failed signup from the earlier "Database error" bug still counted as an attempt, so the rate-limit table now has rows blocking those emails for up to 30 minutes. On top of that, `secureSignUp` calls `checkRateLimit(email, 'signup')` before every signup with the same 10-attempts / 15-minutes / 30-minute lockout policy used for logins — too aggressive for signup, which is a low-abuse surface, and the cause of the warning your user just saw.

## Fix
1. **Remove the rate-limit gate from signup** in `src/features/auth/hooks/useSecureAuth.ts` — drop the `checkRateLimit(... 'signup')` call and the resulting "Too many signup attempts" error. Login rate limiting stays in place unchanged.
2. **Clear all current signup blocks** in the database so anyone who got locked out from the earlier database errors can sign up immediately (`DELETE FROM public.app_rate_limits WHERE attempt_type = 'signup'`).
3. **Keep Supabase Auth's own per-IP signup throttle** (built-in, abuse-proof) as the only signup throttle — that's enough protection without trapping legitimate court staff.

## Out of scope
- No changes to login rate limiting.
- No changes to the signup form, validators, or the trusted-domain auto-approval logic (already fixed last turn).