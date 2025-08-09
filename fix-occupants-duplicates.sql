-- Fix Occupants Table Duplicate Data Issue
-- This script identifies and removes duplicate entries while preserving data integrity

-- First, let's see what duplicates we have
SELECT 
    first_name, 
    last_name, 
    department, 
    title,
    COUNT(*) as duplicate_count
FROM occupants 
GROUP BY first_name, last_name, department, title
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, last_name;

-- Check for any room assignments or key assignments on duplicates before removal
WITH duplicates AS (
    SELECT 
        id,
        first_name, 
        last_name, 
        department, 
        title,
        ROW_NUMBER() OVER (
            PARTITION BY first_name, last_name, department, title 
            ORDER BY created_at ASC
        ) as row_num
    FROM occupants 
    WHERE (first_name, last_name, department, title) IN (
        SELECT first_name, last_name, department, title
        FROM occupants 
        GROUP BY first_name, last_name, department, title
        HAVING COUNT(*) > 1
    )
)
SELECT 
    d.id,
    d.first_name,
    d.last_name,
    d.department,
    d.row_num,
    COALESCE(room_count.count, 0) as room_assignments,
    COALESCE(key_count.count, 0) as key_assignments
FROM duplicates d
LEFT JOIN (
    SELECT occupant_id, COUNT(*) as count
    FROM occupant_room_assignments 
    GROUP BY occupant_id
) room_count ON d.id = room_count.occupant_id
LEFT JOIN (
    SELECT occupant_id, COUNT(*) as count
    FROM key_assignments 
    WHERE returned_at IS NULL
    GROUP BY occupant_id
) key_count ON d.id = key_count.occupant_id
ORDER BY d.first_name, d.last_name, d.row_num;

-- Remove duplicates (keep the first record, remove others)
-- This will preserve the oldest record for each person
WITH duplicates_to_remove AS (
    SELECT id
    FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY first_name, last_name, department, title 
                ORDER BY created_at ASC
            ) as row_num
        FROM occupants 
        WHERE (first_name, last_name, department, title) IN (
            SELECT first_name, last_name, department, title
            FROM occupants 
            GROUP BY first_name, last_name, department, title
            HAVING COUNT(*) > 1
        )
    ) ranked
    WHERE row_num > 1
)
DELETE FROM occupants 
WHERE id IN (SELECT id FROM duplicates_to_remove);

-- Verify the cleanup worked
SELECT 
    first_name, 
    last_name, 
    department, 
    title,
    COUNT(*) as count
FROM occupants 
GROUP BY first_name, last_name, department, title
HAVING COUNT(*) > 1;

-- Add a unique constraint to prevent future duplicates
-- Note: This might fail if there are still duplicates, which would indicate the cleanup didn't work
ALTER TABLE occupants 
ADD CONSTRAINT unique_occupant_person 
UNIQUE (first_name, last_name, department, title);

-- Final count of occupants
SELECT COUNT(*) as total_occupants FROM occupants;
