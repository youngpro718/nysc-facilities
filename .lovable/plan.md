
Problem found:
- The signup failure is not caused by the `profiles` columns anymore.
- The current auth logs show a different root cause: Supabase is trying to call `public.log_security_event(..., uuid, jsonb)` during signup, and that exact function signature does not exist.

What I verified:
- `profiles.room_number` and `profiles.court_position` do exist now.
- `handle_new_user()` is present and already inserts those fields correctly.
- The database currently has two overloaded `log_security_event` functions:
  - `log_security_event(action_type text, resource_type text, resource_id text, details jsonb)`
  - `log_security_event(p_event_type text, p_target_table text, p_target_id text, p_details text)`
- The failing call is trying to pass a `uuid` as the third argument, not `text`, so Postgres cannot resolve the function and signup aborts.

Most likely source:
- A trigger or function in the database is calling `log_security_event(..., some_uuid_column, some_jsonb)` without casting the UUID to text.
- This appears to be coming from database-side auth/signup logic, not from the React client.

Recommended fix:
1. Add a compatibility overload:
   - Create `public.log_security_event(action_type text, resource_type text, resource_id uuid, details jsonb)`
   - Inside it, delegate to the existing text/jsonb version using `resource_id::text`
2. Keep the existing text-based function unchanged
   - This is the safest fix because it supports both old and new callers without breaking anything else.
3. Then audit database functions/triggers that call `log_security_event`
   - Standardize them to pass `::text` over time
   - But that cleanup can be a second pass after signup is restored

Why this is the best fix:
- Lowest-risk database change
- Backward compatible with all existing callers
- Restores signup immediately even if the offending call site is hidden in an older trigger/function
- Avoids touching frontend auth code unnecessarily

Implementation scope:
- One new SQL migration only
- No UI changes required
- Optional follow-up audit of all security/audit functions after the app is stable again

Technical details:
```text
Current failure:
  function public.log_security_event(unknown, unknown, uuid, jsonb) does not exist

Safe compatibility patch:
  create function public.log_security_event(text, text, uuid, jsonb)
  -> internally call public.log_security_event(text, text, uuid::text, jsonb)
```

What I would implement next:
- Add the compatibility overload migration
- Re-test signup
- If signup still fails, inspect the exact DB function/trigger calling it and normalize that caller too
