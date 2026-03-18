-- Track AI edge function invocations per user.
-- Used for rate limiting and cost visibility.

create table if not exists ai_invocation_log (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references profiles(id) on delete cascade not null,
  function_name text not null,
  created_at    timestamptz default now() not null
);

-- Index for rate-limit lookups: user + function + time window
create index if not exists ai_invocation_log_user_fn_time
  on ai_invocation_log (user_id, function_name, created_at);

alter table ai_invocation_log enable row level security;

-- Users can only read their own log entries
create policy "users read own invocation log"
  on ai_invocation_log for select
  using (auth.uid() = user_id);

-- Insert allowed for authenticated users (rate enforcement is in edge function)
create policy "users insert own invocation log"
  on ai_invocation_log for insert
  with check (auth.uid() = user_id);
