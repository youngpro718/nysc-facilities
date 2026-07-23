-- 109_drop_unused_lighting_maintenance.sql
--
-- lighting_maintenance was a legacy/duplicate table, superseded by
-- lighting_maintenance_schedules (which has more columns: completed_by,
-- completed_date, completion_notes, reminder_sent). It was never referenced
-- by any frontend code and never appeared in a tracked migration that
-- created it (it was one of several objects the live DB accumulated outside
-- the migration set, per 088_lighting_schema_reconciliation.sql).
--
-- Confirmed before dropping: 0 rows, no frontend `.from('lighting_maintenance')`
-- references anywhere in src/.

drop table if exists public.lighting_maintenance cascade;
