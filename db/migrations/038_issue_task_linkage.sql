-- Migration: 038_issue_task_linkage.sql
-- Description: Link staff tasks to issues so tasks can be created from issue records
-- Date: 2026-03-19

BEGIN;

ALTER TABLE public.staff_tasks
  ADD COLUMN IF NOT EXISTS issue_id uuid REFERENCES public.issues(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_staff_tasks_issue_id
  ON public.staff_tasks(issue_id);

COMMENT ON COLUMN public.staff_tasks.issue_id IS 'Optional issue this task was created from';

COMMIT;
