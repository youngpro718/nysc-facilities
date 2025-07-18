-- Find and fix any remaining SECURITY DEFINER views
-- Check pg_class for any views that might have security definer properties

-- First, let's check what views exist in the public schema
SELECT 
    c.relname as view_name,
    n.nspname as schema_name,
    c.relkind
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
AND c.relkind = 'v'  -- v = view
ORDER BY c.relname;

-- Check for any view-related rules or security properties
SELECT 
    r.rulename,
    r.ev_type,
    c.relname as table_name,
    pg_get_ruledef(r.oid, true) as rule_definition
FROM pg_rewrite r
JOIN pg_class c ON c.oid = r.ev_class
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
AND c.relkind = 'v'
AND pg_get_ruledef(r.oid, true) ILIKE '%security definer%';