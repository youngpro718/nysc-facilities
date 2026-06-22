-- 086: domain-specific fields on lighting_issues.
--
-- Most non-technical reporters won't know the bulb type — these are optional,
-- default 'unknown'. The Facility Coordinator uses them (when known) to plan
-- the fix (LED swap vs ballast vs screw-in) and to know whether a lift is
-- required for high-ceiling rooms.
--
-- Applied to live DB.

BEGIN;

ALTER TABLE public.lighting_issues
  ADD COLUMN IF NOT EXISTS bulb_type text
    CHECK (bulb_type IN ('led','fluorescent','screw_in','unknown'))
    DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS ceiling_access text
    CHECK (ceiling_access IN ('normal','high','hard_to_reach','unknown'))
    DEFAULT 'unknown';

COMMENT ON COLUMN public.lighting_issues.bulb_type IS
  'Bulb type the reporter saw, or unknown. Helps FC plan the fix (LED swap, ballast, screw-in).';
COMMENT ON COLUMN public.lighting_issues.ceiling_access IS
  'Ceiling access difficulty — signals whether a lift is needed.';

COMMIT;
