-- Check current foreign key constraints on occupant_room_assignments
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE 
    tc.table_name = 'occupant_room_assignments' 
    AND tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public';

-- Also check for any duplicate constraint names that might cause issues
SELECT constraint_name, COUNT(*) as count
FROM information_schema.table_constraints 
WHERE table_name = 'occupant_room_assignments'
  AND table_schema = 'public'
  AND constraint_type = 'FOREIGN KEY'
GROUP BY constraint_name
HAVING COUNT(*) > 1;

-- Check if there are multiple foreign keys pointing to the same table
SELECT 
    ccu.table_name AS foreign_table_name,
    COUNT(*) as foreign_key_count,
    array_agg(tc.constraint_name) as constraint_names,
    array_agg(kcu.column_name) as column_names
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE 
    tc.table_name = 'occupant_room_assignments' 
    AND tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
GROUP BY ccu.table_name
HAVING COUNT(*) > 1;