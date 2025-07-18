-- Force a complete refresh by checking and fixing any security definer issues
-- Check if there are any functions or views with security definer that might be causing this

-- Check for any functions that might be related to room_persistent_issues
SELECT 
    p.proname as function_name,
    n.nspname as schema_name,
    CASE 
        WHEN p.prosecdef THEN 'SECURITY DEFINER'
        ELSE 'SECURITY INVOKER'
    END as security_type
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
AND (p.proname ILIKE '%room_persistent%' OR p.prosecdef = true);

-- Also check if there are any materialized views or other objects
SELECT 
    c.relname,
    c.relkind,
    CASE c.relkind
        WHEN 'r' THEN 'table'
        WHEN 'v' THEN 'view'
        WHEN 'm' THEN 'materialized view'
        WHEN 'f' THEN 'foreign table'
        ELSE 'other'
    END as object_type
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
AND c.relname ILIKE '%room_persistent%';

-- Force refresh the view definition one more time
DROP VIEW IF EXISTS public.room_persistent_issues CASCADE;

CREATE VIEW public.room_persistent_issues AS
SELECT 
    issues.room_id,
    count(*) AS issue_count,
    count(
        CASE
            WHEN issues.status = 'open'::issue_status_enum THEN 1
            ELSE NULL::integer
        END) AS open_issues,
    max(issues.created_at) AS latest_issue_date
FROM issues
WHERE issues.status = ANY (ARRAY['open'::issue_status_enum, 'in_progress'::issue_status_enum])
  AND issues.room_id IS NOT NULL
GROUP BY issues.room_id
HAVING count(*) >= 3;