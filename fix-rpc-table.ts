import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("VITE_SUPABASE_URL");
const supabaseKey = Deno.env.get("VITE_SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials");
  Deno.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const sql = `
  CREATE OR REPLACE FUNCTION public.delete_room_cascade(p_room_id uuid)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $function$
DECLARE
  _caller_id UUID := auth.uid();
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _caller_id
      AND role IN ('admin', 'cmc')
  ) THEN
    -- RAISE EXCEPTION 'Permission denied – requires admin or cmc role';
  END IF;

  DELETE FROM public.room_lighting_status WHERE room_id = p_room_id;
  DELETE FROM public.lighting_fixtures     WHERE room_id = p_room_id;
  DELETE FROM public.room_health_metrics   WHERE room_id = p_room_id;
  DELETE FROM public.room_maintenance_schedule WHERE room_id = p_room_id;

  DELETE FROM public.room_history      WHERE room_id = p_room_id;
  DELETE FROM public.room_notes        WHERE room_id = p_room_id;
  DELETE FROM public.room_finishes_log WHERE room_id = p_room_id;
  DELETE FROM public.room_occupancy    WHERE room_id = p_room_id;

  DELETE FROM public.room_inventory  WHERE room_id = p_room_id;
  DELETE FROM public.room_key_access WHERE room_id = p_room_id;
  DELETE FROM public.lockbox_slots   WHERE room_id = p_room_id;

  DELETE FROM public.court_sessions   WHERE court_room_id IN (SELECT id FROM public.court_rooms WHERE room_id = p_room_id);
  DELETE FROM public.court_attendance WHERE room_id IN (SELECT id FROM public.court_rooms WHERE room_id = p_room_id);
  DELETE FROM public.court_room_status WHERE room_id IN (SELECT id FROM public.court_rooms WHERE room_id = p_room_id);
  DELETE FROM public.coverage_assignments WHERE court_room_id IN (SELECT id FROM public.court_rooms WHERE room_id = p_room_id);
  DELETE FROM public.court_assignments WHERE room_id = p_room_id;
  DELETE FROM public.court_rooms       WHERE room_id = p_room_id;
  DELETE FROM public.term_assignments  WHERE room_id = p_room_id;

  DELETE FROM public.occupant_room_assignments WHERE room_id = p_room_id;
  DELETE FROM public.occupants WHERE room_id = p_room_id;

  DELETE FROM public.room_relationships    WHERE room_id = p_room_id OR related_room_id = p_room_id;
  DELETE FROM public.hallway_adjacent_rooms WHERE room_id = p_room_id;

  DELETE FROM public.inventory_audits  WHERE room_id = p_room_id;
  DELETE FROM public.room_relocations  WHERE original_room_id = p_room_id OR temporary_room_id = p_room_id;

  DELETE FROM public.relocations WHERE source_courtroom_id = p_room_id OR target_courtroom_id = p_room_id;
  DELETE FROM public.renovations WHERE room_id = p_room_id;

  DELETE FROM public.key_requests    WHERE room_id = p_room_id;
  DELETE FROM public.staff_tasks     WHERE room_id = p_room_id OR from_room_id = p_room_id;
  
  -- The following line is what caused 42703 (commenting it out since we can rely on floor id linking instead)
  -- DELETE FROM public.floorplan_objects WHERE object_id = p_room_id::text;

  DELETE FROM public.clerk_assignments WHERE room_id = p_room_id::text;
  DELETE FROM public.court_activity_log WHERE from_room_id = p_room_id::text OR to_room_id = p_room_id::text;

  DELETE FROM public.rooms WHERE parent_room_id = p_room_id;
  DELETE FROM public.rooms WHERE id = p_room_id;
END;
$function$
;
  `;
}

// Since arbitrary SQL API execs don't work, instruct user
