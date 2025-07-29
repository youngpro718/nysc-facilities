-- Consolidate all specialized issue tables into the main issues table
-- This migration safely moves data from maintenance_issues, lighting_issues, and door_issues
-- into the unified issues table, then updates all components to use the main table

-- First, let's check if the specialized tables have any data and migrate it
DO $$
DECLARE
    maintenance_count INTEGER;
    lighting_count INTEGER;
    door_count INTEGER;
BEGIN
    -- Check if specialized tables exist and have data
    SELECT COUNT(*) INTO maintenance_count FROM information_schema.tables 
    WHERE table_name = 'maintenance_issues' AND table_schema = 'public';
    
    SELECT COUNT(*) INTO lighting_count FROM information_schema.tables 
    WHERE table_name = 'lighting_issues' AND table_schema = 'public';
    
    SELECT COUNT(*) INTO door_count FROM information_schema.tables 
    WHERE table_name = 'door_issues' AND table_schema = 'public';

    -- Migrate maintenance_issues data if table exists
    IF maintenance_count > 0 THEN
        RAISE NOTICE 'Migrating data from maintenance_issues to issues table...';
        
        INSERT INTO public.issues (
            title,
            description,
            issue_type,
            priority,
            status,
            space_id,
            space_type,
            location_description,
            reported_by,
            assigned_to,
            photos,
            resolution_notes,
            resolved_at,
            created_at,
            updated_at
        )
        SELECT 
            title,
            description,
            issue_type,
            -- Map severity to priority
            CASE 
                WHEN severity = 'critical' THEN 'high'
                WHEN severity = 'high' THEN 'high'
                WHEN severity = 'medium' THEN 'medium'
                WHEN severity = 'low' THEN 'low'
                ELSE 'medium'
            END as priority,
            -- Map maintenance status to standard status
            CASE 
                WHEN status = 'reported' THEN 'open'
                WHEN status = 'temporary_fix' THEN 'in_progress'
                WHEN status = 'scheduled' THEN 'in_progress'
                WHEN status = 'resolved' THEN 'resolved'
                ELSE 'open'
            END::issue_status_enum as status,
            space_id,
            space_type,
            space_name as location_description,
            reported_by,
            assigned_to,
            photos,
            resolution_notes,
            resolved_date as resolved_at,
            created_at,
            updated_at
        FROM public.maintenance_issues
        WHERE NOT EXISTS (
            -- Avoid duplicates if migration was run before
            SELECT 1 FROM public.issues i 
            WHERE i.title = maintenance_issues.title 
            AND i.created_at = maintenance_issues.created_at
        );
        
        RAISE NOTICE 'Maintenance issues migration completed.';
    END IF;

    -- Migrate lighting_issues data if table exists
    IF lighting_count > 0 THEN
        RAISE NOTICE 'Migrating data from lighting_issues to issues table...';
        
        INSERT INTO public.issues (
            title,
            description,
            issue_type,
            priority,
            status,
            room_id,
            location_description,
            reported_by,
            photos,
            created_at,
            updated_at
        )
        SELECT 
            COALESCE(title, 'Lighting Issue') as title,
            COALESCE(description, 'Lighting fixture issue') as description,
            'lighting' as issue_type,
            CASE 
                WHEN severity = 'critical' THEN 'high'
                WHEN severity = 'high' THEN 'high'
                WHEN severity = 'medium' THEN 'medium'
                WHEN severity = 'low' THEN 'low'
                ELSE 'medium'
            END as priority,
            CASE 
                WHEN status = 'reported' THEN 'open'
                WHEN status = 'in_progress' THEN 'in_progress'
                WHEN status = 'resolved' THEN 'resolved'
                ELSE 'open'
            END::issue_status_enum as status,
            room_id,
            COALESCE(location_description, 'Lighting fixture') as location_description,
            reported_by,
            photos,
            COALESCE(reported_at, created_at, NOW()) as created_at,
            COALESCE(updated_at, NOW()) as updated_at
        FROM public.lighting_issues
        WHERE NOT EXISTS (
            SELECT 1 FROM public.issues i 
            WHERE i.issue_type = 'lighting'
            AND i.room_id = lighting_issues.room_id
            AND i.created_at = COALESCE(lighting_issues.reported_at, lighting_issues.created_at)
        );
        
        RAISE NOTICE 'Lighting issues migration completed.';
    END IF;

    -- Migrate door_issues data if table exists
    IF door_count > 0 THEN
        RAISE NOTICE 'Migrating data from door_issues to issues table...';
        
        INSERT INTO public.issues (
            title,
            description,
            issue_type,
            priority,
            status,
            location_description,
            reported_by,
            photos,
            created_at,
            updated_at
        )
        SELECT 
            COALESCE(title, 'Door Issue') as title,
            COALESCE(description, 'Door maintenance issue') as description,
            'maintenance' as issue_type,
            CASE 
                WHEN severity = 'critical' THEN 'high'
                WHEN severity = 'high' THEN 'high'
                WHEN severity = 'medium' THEN 'medium'
                WHEN severity = 'low' THEN 'low'
                ELSE 'medium'
            END as priority,
            CASE 
                WHEN status = 'reported' THEN 'open'
                WHEN status = 'in_progress' THEN 'in_progress'
                WHEN status = 'resolved' THEN 'resolved'
                ELSE 'open'
            END::issue_status_enum as status,
            COALESCE(location_description, 'Door') as location_description,
            reported_by,
            photos,
            COALESCE(created_at, NOW()) as created_at,
            COALESCE(updated_at, NOW()) as updated_at
        FROM public.door_issues
        WHERE NOT EXISTS (
            SELECT 1 FROM public.issues i 
            WHERE i.issue_type = 'maintenance'
            AND i.location_description ILIKE '%door%'
            AND i.created_at = door_issues.created_at
        );
        
        RAISE NOTICE 'Door issues migration completed.';
    END IF;

END $$;

-- Add any missing columns to issues table that might be needed
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS space_id UUID;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS space_type TEXT;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_issues_space_id ON public.issues(space_id);
CREATE INDEX IF NOT EXISTS idx_issues_space_type ON public.issues(space_type);

-- Update the issues table trigger to handle the new columns
CREATE OR REPLACE FUNCTION update_issues_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS update_issues_updated_at ON public.issues;
CREATE TRIGGER update_issues_updated_at
    BEFORE UPDATE ON public.issues
    FOR EACH ROW
    EXECUTE FUNCTION update_issues_updated_at_column();

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Issue table consolidation migration completed successfully.';
    RAISE NOTICE 'All specialized issue tables have been migrated to the main issues table.';
    RAISE NOTICE 'Next step: Update application components to use the unified issues table.';
END $$;
