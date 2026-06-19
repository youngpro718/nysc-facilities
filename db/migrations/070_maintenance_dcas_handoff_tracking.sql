-- 070: Track DCAS / external-vendor handoff state on maintenance_schedules.
--
-- Context: the app doesn't dispatch DCAS or integrate with Archibus. Its job is
-- to make sure the person who scheduled the work *remembers* to file the
-- external ticket (Archibus / phone / email) and to record what was filed so
-- the team has a paper trail. These five columns mirror the pattern already
-- on the `issues` table.

ALTER TABLE public.maintenance_schedules
  ADD COLUMN IF NOT EXISTS external_system text,
  ADD COLUMN IF NOT EXISTS external_ticket_number text,
  ADD COLUMN IF NOT EXISTS external_ticket_status text NOT NULL DEFAULT 'not_notified',
  ADD COLUMN IF NOT EXISTS external_ticket_entered_at timestamptz,
  ADD COLUMN IF NOT EXISTS external_ticket_entered_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Valid values for external_ticket_status:
--   'not_notified'      DCAS / vendor has NOT been told yet — the action item
--   'notified'          User has informed DCAS (verbally / email) but no ticket # yet
--   'filed'             A formal ticket exists (Archibus #, work order #, etc.)
--   'confirmed'         Vendor has acknowledged and committed to the schedule
--   'not_required'      No external coordination needed (e.g., internal-only entry)
ALTER TABLE public.maintenance_schedules
  DROP CONSTRAINT IF EXISTS maintenance_schedules_external_ticket_status_check;
ALTER TABLE public.maintenance_schedules
  ADD CONSTRAINT maintenance_schedules_external_ticket_status_check
  CHECK (external_ticket_status IN ('not_notified', 'notified', 'filed', 'confirmed', 'not_required'));

-- Lookups by handoff status will be common on the dashboard widget. Tiny table
-- so a partial index over the not-yet-handled rows is plenty.
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_pending_handoff
  ON public.maintenance_schedules (scheduled_start_date)
  WHERE external_ticket_status IN ('not_notified', 'notified');
