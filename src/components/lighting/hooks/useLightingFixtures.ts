
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LightingFixture, LightStatus } from "../types";

export function useLightingFixtures() {
  const queryClient = useQueryClient();

  const { data: fixtures, isLoading } = useQuery({
    queryKey: ['lighting-fixtures'],
    queryFn: async () => {
      const { data: rawFixtures, error } = await supabase
        .from('lighting_fixtures')
        .select('*');

      if (error) throw error;

      return (rawFixtures || []).map((raw): LightingFixture => ({
        id: raw.id,
        name: raw.name || '',
        type: raw.type || 'standard',
        status: raw.status || 'functional',
        zone_name: raw.zone_name,
        building_name: raw.building_name,
        floor_name: raw.floor_name,
        floor_id: raw.floor_id,
        space_id: raw.space_id,
        space_type: raw.space_type || 'room',
        position: raw.position || 'ceiling',
        sequence_number: raw.sequence_number,
        zone_id: raw.zone_id,
        space_name: raw.space_name,
        room_number: raw.room_number,
        technology: raw.technology || null,
        maintenance_notes: raw.maintenance_notes,
        created_at: raw.created_at,
        updated_at: raw.updated_at,
        bulb_count: raw.bulb_count || 1,
        electrical_issues: raw.electrical_issues || {
          short_circuit: false,
          wiring_issues: false,
          voltage_problems: false
        },
        ballast_issue: raw.ballast_issue || false,
        ballast_check_notes: raw.ballast_check_notes,
        emergency_circuit: raw.emergency_circuit || false,
        backup_power_source: raw.backup_power_source,
        emergency_duration_minutes: raw.emergency_duration_minutes,
        maintenance_history: raw.maintenance_history || [],
        inspection_history: raw.inspection_history || []
      }));
    }
  });

  return {
    fixtures: fixtures || [],
    isLoading,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['lighting-fixtures'] })
  };
}
