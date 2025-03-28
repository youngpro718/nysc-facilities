-- SQL Script to create lighting zones and fixtures for existing rooms
-- This script will:
-- 1. Create lighting zones for each existing floor
-- 2. Create lighting fixtures for each existing room
-- 3. Update room_lighting_status for each room

-- Step 1: Create lighting zones for each existing floor
-- First, create a main zone for each floor if it doesn't already exist
INSERT INTO lighting_zones (id, name, floor_id, type, created_at, updated_at, parent_zone_id, zone_path)
SELECT 
    gen_random_uuid(), -- Generate a UUID for the zone
    'Main Zone - ' || floors.name, -- Name the zone based on the floor name
    floors.id, -- Associate with the floor
    'general', -- Zone type
    NOW(), -- Creation timestamp
    NOW(), -- Update timestamp
    NULL, -- No parent zone
    ARRAY[]::uuid[] -- Empty zone path
FROM 
    floors
WHERE 
    NOT EXISTS (
        SELECT 1 FROM lighting_zones WHERE floor_id = floors.id AND parent_zone_id IS NULL
    );

-- Step 2: Create sub-zones for different room types on each floor
-- Only creates zones for room types that actually exist in the database
INSERT INTO lighting_zones (id, name, floor_id, type, created_at, updated_at, parent_zone_id, zone_path)
SELECT 
    gen_random_uuid(), -- Generate a UUID for the zone
    rooms.room_type || ' Zone - ' || floors.name,
    floors.id, -- Associate with the floor
    'general', -- Zone type
    NOW(), -- Creation timestamp
    NOW(), -- Update timestamp
    (SELECT id FROM lighting_zones WHERE floor_id = floors.id AND parent_zone_id IS NULL LIMIT 1), -- Parent zone is the main floor zone
    ARRAY[(SELECT id FROM lighting_zones WHERE floor_id = floors.id AND parent_zone_id IS NULL LIMIT 1)]::uuid[] -- Zone path includes parent
FROM 
    rooms
    JOIN floors ON rooms.floor_id = floors.id
GROUP BY 
    floors.id, floors.name, rooms.room_type
ON CONFLICT DO NOTHING;

-- Step 3: Create lighting fixtures for each existing room
-- Calculate how many fixtures to create based on room type
WITH room_fixture_counts AS (
    SELECT 
        r.id AS room_id,
        r.name AS room_name,
        r.room_number,
        r.floor_id,
        r.room_type,
        CASE 
            WHEN r.room_type = 'courtroom' THEN 8      -- Courtrooms get more fixtures
            WHEN r.room_type = 'office' THEN 4         -- Offices get a standard number
            WHEN r.room_type = 'judges_chambers' THEN 6 -- Judges chambers get more fixtures
            WHEN r.room_type = 'utility_room' THEN 3   -- Utility rooms get fewer fixtures
            ELSE 2                                     -- Other rooms get minimal fixtures
        END AS fixture_count,
        (SELECT id FROM lighting_zones lz 
         WHERE lz.floor_id = r.floor_id 
         AND lz.name LIKE r.room_type || ' Zone - %'
         LIMIT 1) AS zone_id
    FROM 
        rooms r
    WHERE 
        NOT EXISTS (
            SELECT 1 FROM lighting_fixtures lf WHERE lf.room_id = r.id
        )
)
INSERT INTO lighting_fixtures (
    id, name, type, status, installation_date, created_at, updated_at,
    zone_id, technology, bulb_count, floor_id, room_id, room_number, sequence_number,
    position
)
SELECT 
    gen_random_uuid(),
    'Room ' || COALESCE(rfc.room_number, 'X') || ' - ceiling Light ' || seq.n,
    'standard',
    'functional',
    CURRENT_DATE - (random() * 365)::integer, -- Random installation date within the last year
    NOW(),
    NOW(),
    rfc.zone_id,
    CASE WHEN random() > 0.7 THEN 'LED' ELSE 'Fluorescent' END::lighting_technology_enum, -- Mix of technologies
    CASE WHEN random() > 0.5 THEN 2 ELSE 4 END, -- Either 2 or 4 bulbs per fixture
    rfc.floor_id,
    rfc.room_id,
    rfc.room_number,
    seq.n,
    'ceiling'
FROM 
    room_fixture_counts rfc
    CROSS JOIN LATERAL generate_series(1, rfc.fixture_count) AS seq(n)
WHERE
    rfc.zone_id IS NOT NULL; -- Only create fixtures for rooms that have a zone

-- Step 4: Update room_lighting_status for each room that has fixtures
INSERT INTO room_lighting_status (
    id, room_id, working_fixtures, non_working_fixtures, total_fixtures,
    room_name, room_number, created_at, updated_at
)
SELECT 
    gen_random_uuid(),
    r.id,
    COUNT(lf.id), -- All fixtures are working initially
    0, -- No non-working fixtures initially
    COUNT(lf.id), -- Total fixtures
    r.name,
    r.room_number,
    NOW(),
    NOW()
FROM 
    rooms r
    JOIN lighting_fixtures lf ON r.id = lf.room_id
GROUP BY 
    r.id, r.name, r.room_number
ON CONFLICT DO NOTHING;

-- Step 5: Create some non-working fixtures for realism (about 10% of fixtures)
UPDATE lighting_fixtures
SET 
    status = 'non_functional',
    maintenance_notes = 'Needs replacement bulb',
    last_maintenance_date = CURRENT_DATE - (random() * 30)::integer
WHERE 
    id IN (
        SELECT id FROM lighting_fixtures
        ORDER BY random()
        LIMIT (SELECT GREATEST(1, COUNT(*) * 0.1) FROM lighting_fixtures)
    );

-- Step 6: Update room_lighting_status to reflect non-working fixtures
UPDATE room_lighting_status rls
SET
    working_fixtures = subquery.working,
    non_working_fixtures = subquery.non_working,
    updated_at = NOW()
FROM (
    SELECT
        room_id,
        COUNT(id) FILTER (WHERE status = 'functional') AS working,
        COUNT(id) FILTER (WHERE status = 'non_functional') AS non_working
    FROM
        lighting_fixtures
    GROUP BY
        room_id
) AS subquery
WHERE
    rls.room_id = subquery.room_id;
