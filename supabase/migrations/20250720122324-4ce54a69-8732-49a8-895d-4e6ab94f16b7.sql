-- Phase 1: Critical Security Fixes and Performance Improvements
-- DO NOT CHANGE ANY ADMIN DASHBOARD FUNCTIONALITY

-- Fix critical security issues identified by linter
-- 1. Fix function search paths (security warning)
ALTER FUNCTION public.update_door_maintenance_schedule() SET search_path = 'public';
ALTER FUNCTION public.get_room_size_from_data(jsonb) SET search_path = 'public';
ALTER FUNCTION public.check_admin_status(uuid) SET search_path = 'public';
ALTER FUNCTION public.create_user_notification(uuid, text, text, text, text, text, jsonb, uuid) SET search_path = 'public';
ALTER FUNCTION public.handle_new_supply_request() SET search_path = 'public';
ALTER FUNCTION public.fulfill_supply_request(uuid, text) SET search_path = 'public';

-- 2. Add critical indexes for admin dashboard performance (NO UI IMPACT)
-- These will make the admin dashboard faster without changing functionality
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_buildings_status ON public.buildings(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_buildings_name ON public.buildings(name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_floors_building_id ON public.floors(building_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_floors_status ON public.floors(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rooms_floor_id ON public.rooms(floor_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rooms_status ON public.rooms(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lighting_fixtures_room_id ON public.lighting_fixtures(room_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lighting_fixtures_status ON public.lighting_fixtures(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_issues_created_at ON public.issues(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_issues_building_id ON public.issues(building_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_issues_status ON public.issues(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_building_activities_created_at ON public.building_activities(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_building_activities_building_id ON public.building_activities(building_id);

-- 3. Add indexes for authentication and user management (admin dashboard uses these)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_id ON public.profiles(id);

-- 4. Add indexes for notification systems (admin gets notifications)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_admin_notifications_created_at ON public.admin_notifications(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_notifications_created_at ON public.user_notifications(created_at DESC);

-- 5. Create backup tracking table for audit purposes
CREATE TABLE IF NOT EXISTS public.database_backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_name TEXT NOT NULL,
    backup_type TEXT NOT NULL DEFAULT 'manual',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES auth.users(id),
    file_size_bytes BIGINT,
    status TEXT DEFAULT 'completed',
    notes TEXT
);

-- Insert record of this stabilization
INSERT INTO public.database_backups (backup_name, backup_type, notes)
VALUES ('phase_1_stabilization', 'schema_optimization', 'Phase 1: Added security fixes and performance indexes for admin dashboard');

COMMENT ON TABLE public.database_backups IS 'Tracks database backup and maintenance operations for audit purposes';