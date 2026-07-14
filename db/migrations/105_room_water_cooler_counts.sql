-- Extend migration 104's presence flag with an exact quantity, then import
-- the July 2026 inventory supplied by Facilities.

BEGIN;

ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS water_cooler_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS water_cooler_notes text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rooms_water_cooler_count_nonnegative'
  ) THEN
    ALTER TABLE public.rooms
      ADD CONSTRAINT rooms_water_cooler_count_nonnegative
      CHECK (water_cooler_count >= 0);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_rooms_with_water_coolers
  ON public.rooms (floor_id)
  WHERE water_cooler_count > 0;

-- The supplied sheet is the authoritative inventory for both Centre Street
-- buildings. Clear those buildings before applying the 75 listed locations.
UPDATE public.rooms r
SET has_water_cooler = false,
    water_cooler_count = 0,
    water_cooler_notes = NULL
FROM public.floors f
JOIN public.buildings b ON b.id = f.building_id
WHERE r.floor_id = f.id
  AND (b.name ILIKE '100 Centre%' OR b.name ILIKE '111 Centre%');

-- Two floors in the supplied inventory do not currently exist.
INSERT INTO public.floors (building_id, floor_number, name, status)
SELECT b.id, requested.floor_number, requested.name, 'active'
FROM (
  VALUES
    ('100', 1, '1st Floor'),
    ('100', 12, '12th Floor')
) AS requested(building_code, floor_number, name)
JOIN public.buildings b
  ON (requested.building_code = '100' AND b.name ILIKE '100 Centre%')
WHERE NOT EXISTS (
  SELECT 1
  FROM public.floors f
  WHERE f.building_id = b.id
    AND f.floor_number = requested.floor_number
);

DO $$
DECLARE
  cooler record;
  target_building_id uuid;
  target_floor_id uuid;
  target_room_id uuid;
  inferred_room_type public.room_type_enum;
BEGIN
  FOR cooler IN
    SELECT *
    FROM (VALUES
      ('100', 1,  '1ST-ENTRANCE', 'One Hogan Place Entrance', 1, NULL),
      ('100', 2,  '218', 'Part N', 1, NULL),
      ('100', 10, '1000', 'Clerk''s Office', 4, 'CAP Unit (1007), Calendar Unit / Quality Control (1003), Maya''s office, and outside Lisette''s office'),
      ('100', 11, '1100', 'TAP A', 1, NULL),
      ('100', 11, '1104', 'Part 71', 1, NULL),
      ('100', 11, '1109', 'Court Reporters', 1, NULL),
      ('100', 11, '1111', 'Part 62', 1, NULL),
      ('100', 11, '1112', 'Storage Room', 4, 'Spare coolers'),
      ('100', 11, '1116', 'Part 41', 1, NULL),
      ('100', 11, '1121', 'Supply Room', 1, NULL),
      ('100', 11, '1123', 'ATI', 1, NULL),
      ('100', 11, '1130', 'TAP B', 1, NULL),
      ('100', 12, '1200', 'Personnel', 1, NULL),
      ('100', 12, '1201', 'Appeals', 1, NULL),
      ('100', 13, '1300', 'Part 32', 1, NULL),
      ('100', 13, '1306', 'Part 66', 1, NULL),
      ('100', 13, '1307', 'Part 42', 1, NULL),
      ('100', 13, '1311', 'Court Reporters', 1, NULL),
      ('100', 13, '1313', 'MDC-92', 1, NULL),
      ('100', 13, '1317', 'Part 81', 1, NULL),
      ('100', 13, '1323', 'Video Room', 1, NULL),
      ('100', 13, '1324', 'Part 51', 1, NULL),
      ('100', 13, '1333', 'Part 93', 1, NULL),
      ('100', 13, '1336', 'Kelly Duffy''s Office', 1, NULL),
      ('100', 14, '1411', 'Male Locker Room', 1, NULL),
      ('100', 14, '1416', 'MDC Room', 1, NULL),
      ('100', 15, '1523', 'Part 75', 1, NULL),
      ('100', 15, '1528', 'Major Office', 1, NULL),
      ('100', 15, '1530', 'Part 59', 1, NULL),
      ('100', 15, '1536', 'Part 95', 1, NULL),
      ('100', 16, '1600', 'Part 1', 1, NULL),
      ('100', 16, '1607', 'IDV Back Office', 1, NULL),
      ('100', 16, '1608 B', 'IDV', 1, NULL),
      ('100', 16, '1609', 'Male Sergeant Locker Room', 1, NULL),
      ('100', 16, '1610', 'Operations', 1, NULL),
      ('100', 16, '16-HALL-PRIVATE', '16th Floor Private Hallway', 1, NULL),
      ('100', 16, '1619', 'IT Office', 1, NULL),
      ('100', 16, '1620', 'Court Reporters', 1, NULL),
      ('100', 16, '1622', 'Female Locker Room', 2, NULL),
      ('100', 16, '1625', 'Court Reporters', 1, NULL),
      ('100', 16, '1629', 'Purchasing Department', 1, NULL),
      ('100', 17, '17-INTERPRETERS', 'Interpreter''s Office', 1, NULL),
      ('100', 17, '17-HALL-NORTH', 'North Hallway', 1, NULL),
      ('100', 17, '17-HALL-SOUTH', 'South Hallway', 1, NULL),
      ('100', 17, '1718', 'Judge Edwards'' Chamber', 1, NULL),
      ('100', 17, '1727', 'Judge Biben''s Chamber', 1, NULL),
      ('100', 17, '1734', 'Judge Scherzer''s Chamber', 1, NULL),
      ('111', 5,  '568', 'Judge Hanshaft''s Chamber', 1, NULL),
      ('111', 6,  '608', 'Female Locker Room', 1, NULL),
      ('111', 6,  '613', 'Male Locker Room', 1, NULL),
      ('111', 6,  '621', 'Part 54', 2, NULL),
      ('111', 6,  '631', 'Part 72', 1, NULL),
      ('111', 6,  '677', 'Part 94', 1, NULL),
      ('111', 6,  '687', 'Part 85', 1, NULL),
      ('111', 7,  '733', 'Part 22', 1, NULL),
      ('111', 7,  '738', 'Copy Room by Barbara', 1, NULL),
      ('111', 7,  '763', 'RTA-73', 1, NULL),
      ('111', 9,  '920', 'Male Locker Room', 2, NULL),
      ('111', 9,  '921 A', 'Court Reporters', 1, NULL),
      ('111', 9,  '921 B', 'Court Reporters', 1, NULL),
      ('111', 9,  '927', 'Clerk''s Office', 1, NULL),
      ('111', 9,  '928', 'Part 61', 1, NULL),
      ('111', 9,  '933', 'Operations', 1, NULL),
      ('111', 9,  '948', 'Part 23', 1, NULL),
      ('111', 10, '10 M', 'Mezzanine', 1, NULL),
      ('111', 10, '1008', 'Male Officer Locker Room', 1, NULL),
      ('111', 10, '1014', 'Male Officer Locker Room', 1, NULL),
      ('111', 10, '1023', 'Part 37', 1, NULL),
      ('111', 10, '1029', 'Male LT Locker Room', 1, NULL),
      ('111', 10, '1030 D', 'Court Reporters', 1, NULL),
      ('111', 10, '1039', 'Female Sergeant Locker Room', 1, NULL),
      ('111', 10, '1047', 'Part 77', 1, NULL),
      ('111', 11, '1170', 'Male Sergeant Locker Room', 1, NULL),
      ('111', 12, '1234', 'Part 99', 1, NULL),
      ('111', 12, '1247', 'Part 53', 1, NULL)
    ) AS supplied(building_code, floor_number, room_number, room_name, cooler_count, cooler_notes)
  LOOP
    SELECT id INTO target_building_id
    FROM public.buildings
    WHERE (cooler.building_code = '100' AND name ILIKE '100 Centre%')
       OR (cooler.building_code = '111' AND name ILIKE '111 Centre%')
    ORDER BY name
    LIMIT 1;

    SELECT id INTO target_floor_id
    FROM public.floors
    WHERE building_id = target_building_id
      AND floor_number = cooler.floor_number
    LIMIT 1;

    IF target_floor_id IS NULL THEN
      RAISE EXCEPTION 'Missing floor % for % Centre Street', cooler.floor_number, cooler.building_code;
    END IF;

    SELECT id INTO target_room_id
    FROM public.rooms
    WHERE floor_id = target_floor_id
      AND regexp_replace(lower(coalesce(room_number, '')), '[^a-z0-9]', '', 'g') =
          regexp_replace(lower(cooler.room_number), '[^a-z0-9]', '', 'g')
    ORDER BY created_at
    LIMIT 1;

    IF target_room_id IS NULL THEN
      inferred_room_type := (CASE
        WHEN cooler.room_name ILIKE '%female%locker%' THEN 'female_locker_room'
        WHEN cooler.room_name ILIKE '%male%locker%' OR cooler.room_name ILIKE '%men%locker%' THEN 'male_locker_room'
        WHEN cooler.room_name ILIKE '%chamber%' THEN 'judges_chambers'
        WHEN cooler.room_name ILIKE '%IT Office%' THEN 'it_room'
        ELSE 'office'
      END)::public.room_type_enum;

      INSERT INTO public.rooms (
        floor_id, name, room_number, room_type, status, current_function,
        has_water_cooler, water_cooler_count, water_cooler_notes
      ) VALUES (
        target_floor_id, cooler.room_name, cooler.room_number, inferred_room_type,
        'active', 'office', true, cooler.cooler_count, cooler.cooler_notes
      )
      RETURNING id INTO target_room_id;
    ELSE
      UPDATE public.rooms
      SET has_water_cooler = cooler.cooler_count > 0,
          water_cooler_count = cooler.cooler_count,
          water_cooler_notes = cooler.cooler_notes
      WHERE id = target_room_id;
    END IF;
  END LOOP;
END $$;

COMMENT ON COLUMN public.rooms.water_cooler_count IS
  'Number of water coolers physically located in the room; zero means none.';
COMMENT ON COLUMN public.rooms.water_cooler_notes IS
  'Optional placement or inventory notes for the room water coolers.';

COMMIT;
