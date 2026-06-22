-- 087: room-level lighting profile.
--
-- Tracks what each room actually has installed (bulb type, ceiling access,
-- LED-conversion status). Gets seeded over time by the auto-fill trigger on
-- lighting_issues, and can be set manually by the Facility Coordinator.
--
-- Applied to live DB.

BEGIN;

CREATE TABLE IF NOT EXISTS public.room_lighting_profiles (
  room_id        uuid PRIMARY KEY REFERENCES public.rooms(id) ON DELETE CASCADE,
  bulb_type      text NOT NULL DEFAULT 'unknown'
                 CHECK (bulb_type IN ('led','fluorescent','screw_in','mixed','unknown')),
  ceiling_access text NOT NULL DEFAULT 'unknown'
                 CHECK (ceiling_access IN ('normal','high','hard_to_reach','unknown')),
  led_converted  boolean NOT NULL DEFAULT false,
  notes          text,
  updated_at     timestamptz NOT NULL DEFAULT now(),
  updated_by     uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.room_lighting_profiles IS
  'What each room has installed for lighting. Auto-seeded from lighting_issues; manually editable by admin / facilities_manager.';

ALTER TABLE public.room_lighting_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS room_lighting_profiles_read ON public.room_lighting_profiles;
CREATE POLICY room_lighting_profiles_read ON public.room_lighting_profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS room_lighting_profiles_write ON public.room_lighting_profiles;
CREATE POLICY room_lighting_profiles_write ON public.room_lighting_profiles
  FOR ALL TO authenticated
  USING (has_role('admin'::user_role) OR has_role('facilities_manager'::user_role))
  WITH CHECK (has_role('admin'::user_role) OR has_role('facilities_manager'::user_role));

CREATE OR REPLACE FUNCTION public.fill_room_lighting_profile_from_issue()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.room_id IS NULL THEN RETURN NEW; END IF;
  IF COALESCE(NEW.bulb_type, 'unknown') = 'unknown'
     AND COALESCE(NEW.ceiling_access, 'unknown') = 'unknown' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.room_lighting_profiles (room_id, bulb_type, ceiling_access, led_converted)
  VALUES (
    NEW.room_id,
    CASE WHEN NEW.bulb_type IS NOT NULL AND NEW.bulb_type <> 'unknown' THEN NEW.bulb_type ELSE 'unknown' END,
    CASE WHEN NEW.ceiling_access IS NOT NULL AND NEW.ceiling_access <> 'unknown' THEN NEW.ceiling_access ELSE 'unknown' END,
    (NEW.bulb_type = 'led')
  )
  ON CONFLICT (room_id) DO UPDATE
    SET
      bulb_type = CASE
        WHEN public.room_lighting_profiles.bulb_type = 'unknown' AND EXCLUDED.bulb_type <> 'unknown'
          THEN EXCLUDED.bulb_type
        ELSE public.room_lighting_profiles.bulb_type
      END,
      ceiling_access = CASE
        WHEN public.room_lighting_profiles.ceiling_access = 'unknown' AND EXCLUDED.ceiling_access <> 'unknown'
          THEN EXCLUDED.ceiling_access
        ELSE public.room_lighting_profiles.ceiling_access
      END,
      led_converted = public.room_lighting_profiles.led_converted OR EXCLUDED.led_converted,
      updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fill_room_lighting_profile ON public.lighting_issues;
CREATE TRIGGER trg_fill_room_lighting_profile
  AFTER INSERT ON public.lighting_issues
  FOR EACH ROW EXECUTE FUNCTION public.fill_room_lighting_profile_from_issue();

-- Backfill from prior issues.
INSERT INTO public.room_lighting_profiles (room_id, bulb_type, ceiling_access, led_converted)
SELECT DISTINCT ON (room_id)
  room_id,
  CASE WHEN bulb_type IS NOT NULL AND bulb_type <> 'unknown' THEN bulb_type ELSE 'unknown' END,
  CASE WHEN ceiling_access IS NOT NULL AND ceiling_access <> 'unknown' THEN ceiling_access ELSE 'unknown' END,
  (bulb_type = 'led')
FROM public.lighting_issues
WHERE room_id IS NOT NULL
  AND (
    (bulb_type IS NOT NULL AND bulb_type <> 'unknown')
    OR (ceiling_access IS NOT NULL AND ceiling_access <> 'unknown')
  )
ORDER BY room_id, reported_at DESC
ON CONFLICT (room_id) DO NOTHING;

COMMIT;
