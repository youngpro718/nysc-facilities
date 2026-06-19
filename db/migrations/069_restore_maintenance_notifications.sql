-- Restore the notification table expected by
-- public.notify_maintenance_affected_users().
--
-- The trigger on maintenance_schedules remained active after this table was
-- removed, causing every maintenance schedule insert to fail.

BEGIN;

CREATE TABLE IF NOT EXISTS public.maintenance_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_schedule_id uuid
    REFERENCES public.maintenance_schedules(id)
    ON DELETE CASCADE,
  user_id uuid,
  notification_type text NOT NULL,
  message text NOT NULL,
  sent_at timestamptz,
  delivery_method text DEFAULT 'in_app',
  status text DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_maintenance_notifications_schedule
  ON public.maintenance_notifications(maintenance_schedule_id);

CREATE INDEX IF NOT EXISTS idx_maintenance_notifications_user
  ON public.maintenance_notifications(user_id, created_at DESC);

ALTER TABLE public.maintenance_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS maintenance_notifications_read_own
  ON public.maintenance_notifications;
CREATE POLICY maintenance_notifications_read_own
  ON public.maintenance_notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_privileged());

DROP POLICY IF EXISTS maintenance_notifications_manage_privileged
  ON public.maintenance_notifications;
CREATE POLICY maintenance_notifications_manage_privileged
  ON public.maintenance_notifications
  FOR ALL TO authenticated
  USING (public.is_privileged())
  WITH CHECK (public.is_privileged());

GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.maintenance_notifications
  TO authenticated;

COMMIT;
