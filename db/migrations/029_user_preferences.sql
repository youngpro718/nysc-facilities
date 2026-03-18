-- User preferences table for cross-device persistence of per-user settings.
-- Initial use case: dashboard layout customization (replaces localStorage-only storage).

create table if not exists user_preferences (
  user_id   uuid primary key references auth.users(id) on delete cascade not null,
  preferences jsonb not null default '{}'::jsonb,
  updated_at  timestamptz default now() not null
);

alter table user_preferences enable row level security;

create policy "users can manage own preferences"
  on user_preferences for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Index for fast upsert lookups (PK covers this, but explicit for clarity)
-- No additional index needed since user_id is the PK.
