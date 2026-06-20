-- Make a Request form: capture the timing constraint the user typed in.
-- 'anytime' is the default and matches today's behaviour. 'when_court_is_down'
-- is a soft signal with no specific date. 'specific_time' is paired with a
-- non-null requested_for_at timestamp.

ALTER TABLE public.staff_tasks
  ADD COLUMN IF NOT EXISTS timing_preference text DEFAULT 'anytime',
  ADD COLUMN IF NOT EXISTS requested_for_at timestamptz;

ALTER TABLE public.staff_tasks
  DROP CONSTRAINT IF EXISTS staff_tasks_timing_preference_check;

ALTER TABLE public.staff_tasks
  ADD CONSTRAINT staff_tasks_timing_preference_check
    CHECK (timing_preference IN ('anytime', 'when_court_is_down', 'specific_time'));

ALTER TABLE public.staff_tasks
  DROP CONSTRAINT IF EXISTS staff_tasks_specific_time_has_date;

ALTER TABLE public.staff_tasks
  ADD CONSTRAINT staff_tasks_specific_time_has_date
    CHECK (timing_preference <> 'specific_time' OR requested_for_at IS NOT NULL);
