-- Represent floor-level locations such as hallways, entrances, and mezzanines
-- separately from rooms while preserving their water-cooler inventory.

BEGIN;

CREATE TABLE IF NOT EXISTS public.common_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id uuid NOT NULL REFERENCES public.floors(id) ON DELETE CASCADE,
  name text NOT NULL,
  area_type text NOT NULL DEFAULT 'hallway'
    CHECK (area_type IN ('hallway', 'entrance', 'lobby', 'mezzanine', 'waiting_area', 'other')),
  status public.status_enum NOT NULL DEFAULT 'active',
  description text,
  water_cooler_count integer NOT NULL DEFAULT 0 CHECK (water_cooler_count >= 0),
  water_cooler_notes text,
  legacy_room_id uuid UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT common_areas_floor_name_unique UNIQUE (floor_id, name)
);

CREATE INDEX IF NOT EXISTS idx_common_areas_floor
  ON public.common_areas (floor_id);

CREATE INDEX IF NOT EXISTS idx_common_areas_with_water_coolers
  ON public.common_areas (floor_id)
  WHERE water_cooler_count > 0;

CREATE TABLE IF NOT EXISTS public.common_area_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  common_area_id uuid NOT NULL REFERENCES public.common_areas(id) ON DELETE CASCADE,
  change_type text NOT NULL,
  changed_by uuid,
  previous_values jsonb,
  new_values jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_common_area_history_area
  ON public.common_area_history (common_area_id, created_at DESC);

DROP TRIGGER IF EXISTS update_common_areas_updated_at ON public.common_areas;
CREATE TRIGGER update_common_areas_updated_at
  BEFORE UPDATE ON public.common_areas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.common_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.common_area_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS common_areas_read ON public.common_areas;
CREATE POLICY common_areas_read ON public.common_areas
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS common_areas_write ON public.common_areas;
CREATE POLICY common_areas_write ON public.common_areas
  FOR ALL TO authenticated
  USING (public.is_privileged())
  WITH CHECK (public.is_privileged());

DROP POLICY IF EXISTS common_area_history_read ON public.common_area_history;
CREATE POLICY common_area_history_read ON public.common_area_history
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS common_area_history_write ON public.common_area_history;
CREATE POLICY common_area_history_write ON public.common_area_history
  FOR ALL TO authenticated
  USING (public.is_privileged())
  WITH CHECK (public.is_privileged());

-- Migration 105 created these as rooms because rooms were the only simple
-- floor-level location available at the time. Move the exact five records to
-- common_areas, preserving cooler quantities and notes, then remove the room
-- records so they no longer affect room lists or counts.
WITH area_candidates AS (
  SELECT
    r.id AS room_id,
    r.floor_id,
    r.name,
    CASE
      WHEN r.room_number = '1ST-ENTRANCE' THEN 'entrance'
      WHEN r.room_number = '10 M' THEN 'mezzanine'
      ELSE 'hallway'
    END AS area_type,
    COALESCE(r.status, 'active'::public.status_enum) AS status,
    r.description,
    COALESCE(r.water_cooler_count, CASE WHEN r.has_water_cooler THEN 1 ELSE 0 END) AS water_cooler_count,
    r.water_cooler_notes
  FROM public.rooms r
  JOIN public.floors f ON f.id = r.floor_id
  JOIN public.buildings b ON b.id = f.building_id
  WHERE
    (b.name ILIKE '100 Centre%' AND r.room_number IN (
      '1ST-ENTRANCE', '16-HALL-PRIVATE', '17-HALL-NORTH', '17-HALL-SOUTH'
    ))
    OR (b.name ILIKE '111 Centre%' AND r.room_number = '10 M')
)
INSERT INTO public.common_areas (
    floor_id,
    name,
    area_type,
    status,
    description,
    water_cooler_count,
    water_cooler_notes,
    legacy_room_id
  )
  SELECT
    floor_id,
    name,
    area_type,
    status,
    description,
    water_cooler_count,
    water_cooler_notes,
    room_id
  FROM area_candidates
  ON CONFLICT (floor_id, name) DO UPDATE SET
    area_type = EXCLUDED.area_type,
    status = EXCLUDED.status,
    description = EXCLUDED.description,
    water_cooler_count = EXCLUDED.water_cooler_count,
    water_cooler_notes = EXCLUDED.water_cooler_notes,
    legacy_room_id = EXCLUDED.legacy_room_id;

-- Preserve the audit trail before removing the old room foreign keys.
INSERT INTO public.common_area_history (
  id,
  common_area_id,
  change_type,
  changed_by,
  previous_values,
  new_values,
  created_at
)
SELECT
  rh.id,
  ca.id,
  rh.change_type,
  rh.changed_by,
  rh.previous_values,
  rh.new_values,
  rh.created_at
FROM public.room_history rh
JOIN public.common_areas ca ON ca.legacy_room_id = rh.room_id
ON CONFLICT (id) DO NOTHING;

DELETE FROM public.room_history rh
USING public.common_areas ca
WHERE ca.legacy_room_id = rh.room_id;

DELETE FROM public.rooms r
USING public.common_areas ca
JOIN public.floors f ON f.id = ca.floor_id
JOIN public.buildings b ON b.id = f.building_id
WHERE r.id = ca.legacy_room_id
  AND (
    (b.name ILIKE '100 Centre%' AND r.room_number IN (
      '1ST-ENTRANCE', '16-HALL-PRIVATE', '17-HALL-NORTH', '17-HALL-SOUTH'
    ))
    OR (b.name ILIKE '111 Centre%' AND r.room_number = '10 M')
  );

COMMENT ON TABLE public.common_areas IS
  'Named, non-room locations within a floor, such as hallways, entrances, lobbies, and mezzanines.';

COMMENT ON COLUMN public.common_areas.water_cooler_count IS
  'Number of water coolers physically located in the common area; zero means none.';

COMMIT;
