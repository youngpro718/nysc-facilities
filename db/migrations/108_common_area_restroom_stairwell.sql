-- Add restroom and stairwell as valid common_area types. These are
-- floor-level spaces without their own room number, same as the
-- hallways/entrances/lobbies common_areas already covers (see 106).

BEGIN;

ALTER TABLE public.common_areas
  DROP CONSTRAINT IF EXISTS common_areas_area_type_check;

ALTER TABLE public.common_areas
  ADD CONSTRAINT common_areas_area_type_check
  CHECK (area_type IN ('hallway', 'entrance', 'lobby', 'mezzanine', 'waiting_area', 'restroom', 'stairwell', 'other'));

COMMIT;
