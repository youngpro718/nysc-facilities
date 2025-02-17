
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LightingFixture, MaintenanceRecord } from "../types";
import type { Json } from '@/integrations/supabase/types';

export function useLightingFixtures() {
  const queryClient = useQueryClient();

  const { data: fixtures, isLoading } = useQuery({
    queryKey: ['lighting-fixtures'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lighting_fixture_details')
        .select('*');

      if (error) throw error;

      return (data || []).map((raw): LightingFixture => ({
        id: raw.id,
        name: raw.name,
        type: raw.type,
        status: raw.status,
        zone_name: raw.zone_name,
        building_name: raw.building_name,
        floor_name: raw.floor_name,
        floor_id: raw.floor_id,
        space_id: raw.space_id,
        space_type: raw.space_type,
        position: raw.position,
        sequence_number: raw.sequence_number,
        zone_id: raw.zone_id,
        space_name: raw.space_name,
        room_number: raw.room_number,
        emergency_circuit: raw.emergency_circuit,
        technology: raw.technology,
        ballast_issue: raw.ballast_issue,
        bulb_count: raw.bulb_count,
        electrical_issues: typeof raw.electrical_issues === 'string' 
          ? JSON.parse(raw.electrical_issues) 
          : raw.electrical_issues,
        energy_usage_data: raw.energy_usage_data,
        emergency_protocols: raw.emergency_protocols,
        warranty_info: raw.warranty_info,
        manufacturer_details: raw.manufacturer_details,
        maintenance_history: Array.isArray(raw.maintenance_history) 
          ? raw.maintenance_history.map((record: any): MaintenanceRecord => ({
              id: record.id || '',
              date: record.date || '',
              type: record.type || '',
              notes: record.notes || ''
            }))
          : [],
        inspection_history: raw.inspection_history || [],
        connected_fixtures: raw.connected_fixtures || [],
        maintenance_notes: raw.maintenance_notes,
        ballast_check_notes: raw.ballast_check_notes,
        backup_power_source: raw.backup_power_source,
        emergency_duration_minutes: raw.emergency_duration_minutes,
        created_at: raw.created_at,
        updated_at: raw.updated_at
      }));
    }
  });

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('lighting_fixtures')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Lighting fixture deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['lighting-fixtures'] });
    } catch (error: any) {
      toast.error(error.message || "Failed to delete lighting fixture");
    }
  };

  const handleBulkDelete = async (selectedFixtures: string[]) => {
    try {
      const { error } = await supabase
        .from('lighting_fixtures')
        .delete()
        .in('id', selectedFixtures);

      if (error) throw error;

      toast.success(`${selectedFixtures.length} fixtures deleted successfully`);
      queryClient.invalidateQueries({ queryKey: ['lighting-fixtures'] });
    } catch (error: any) {
      toast.error(error.message || "Failed to delete fixtures");
    }
  };

  return {
    fixtures: fixtures || [],
    isLoading,
    handleDelete,
    handleBulkDelete,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['lighting-fixtures'] })
  };
}
