-- Migration: Fix Occupants Table Duplicates
-- Run this in Supabase SQL Editor

-- Step 1: Identify duplicates before removal
DO $$
BEGIN
    RAISE NOTICE 'Checking for duplicate occupants...';
END $$;

-- Show current duplicates
SELECT 
    'DUPLICATES FOUND:' as status,
    first_name, 
    last_name, 
    department, 
    title,
    COUNT(*) as duplicate_count
FROM occupants 
GROUP BY first_name, last_name, department, title
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, last_name;

-- Step 2: Remove duplicates (keep the first record based on created_at)
WITH duplicates_to_remove AS (
    SELECT id
    FROM (
        SELECT 
            id,
            first_name,
            last_name,
            ROW_NUMBER() OVER (
                PARTITION BY 
                    COALESCE(first_name, ''), 
                    COALESCE(last_name, ''), 
                    COALESCE(department, ''), 
                    COALESCE(title, '')
                ORDER BY created_at ASC NULLS LAST, id ASC
            ) as row_num
        FROM occupants 
        WHERE (
            COALESCE(first_name, ''), 
            COALESCE(last_name, ''), 
            COALESCE(department, ''), 
            COALESCE(title, '')
        ) IN (
            SELECT 
                COALESCE(first_name, ''), 
                COALESCE(last_name, ''), 
                COALESCE(department, ''), 
                COALESCE(title, '')
            FROM occupants 
            GROUP BY 
                COALESCE(first_name, ''), 
                COALESCE(last_name, ''), 
                COALESCE(department, ''), 
                COALESCE(title, '')
            HAVING COUNT(*) > 1
        )
    ) ranked
    WHERE row_num > 1
)
DELETE FROM occupants 
WHERE id IN (SELECT id FROM duplicates_to_remove);

-- Step 3: Verify cleanup worked
SELECT 
    'VERIFICATION:' as status,
    first_name, 
    last_name, 
    department, 
    title,
    COUNT(*) as count
FROM occupants 
GROUP BY first_name, last_name, department, title
HAVING COUNT(*) > 1;

-- Step 4: Show final count
SELECT 
    'FINAL COUNT:' as status,
    COUNT(*) as total_occupants 
FROM occupants;

-- Step 5: Add unique constraint to prevent future duplicates
-- Note: Only add this if no duplicates remain
DO $$
BEGIN
    -- Check if constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_occupant_person' 
        AND table_name = 'occupants'
    ) THEN
        -- Add unique constraint
        ALTER TABLE occupants 
        ADD CONSTRAINT unique_occupant_person 
        UNIQUE (first_name, last_name, department, title);
        
        RAISE NOTICE 'Added unique constraint to prevent future duplicates';
    ELSE
        RAISE NOTICE 'Unique constraint already exists';
    END IF;
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'Cannot add unique constraint - duplicates still exist!';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding constraint: %', SQLERRM;
END $$;
