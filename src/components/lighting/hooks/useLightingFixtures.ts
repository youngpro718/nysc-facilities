
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LightingFixture, MaintenanceEntry, LightStatus } from "../types";
import type { Json } from '@/integrations/supabase/types';

export function useLightingFixtures() {
  const queryClient = useQueryClient();

  const { data: fixtures, isLoading } = useQuery({
    queryKey: ['lighting-fixtures'],
    queryFn: async () => {
      const { data: rawFixtures, error } = await supabase
        .from('lighting_fixture_details')
        .select('*');

      if (error) throw error;

      return (rawFixtures || []).map((raw): LightingFixture => ({
        id: raw.id,
        name: raw.name,
        type: raw.type,
        status: raw.status as LightStatus,
        zone_name: raw.zone_name || null,
        building_name: raw.building_name,
        floor_name: raw.floor_name,
        floor_id: raw.floor_id,
        space_id: raw.space_id,
        space_type: raw.space_type as ('room' | 'hallway' | null),
        position: raw.position,
        sequence_number: raw.sequence_number,
        zone_id: raw.zone_id,
        space_name: raw.space_name,
        room_number: raw.room_number,
        emergency_circuit: raw.emergency_circuit || false,
        technology: raw.technology,
        ballast_issue: raw.ballast_issue || false,
        bulb_count: raw.bulb_count || 1,
        electrical_issues: typeof raw.electrical_issues === 'string' 
          ? JSON.parse(raw.electrical_issues) 
          : raw.electrical_issues || { short_circuit: false, wiring_issues: false, voltage_problems: false },
        energy_usage_data: raw.energy_usage_data || null,
        emergency_protocols: raw.emergency_protocols || null,
        warranty_info: raw.warranty_info || null,
        manufacturer_details: raw.manufacturer_details || null,
        maintenance_history: Array.isArray(raw.maintenance_history) 
          ? raw.maintenance_history.map((record: Json): MaintenanceEntry => ({
              id: String(record.id || ''),
              date: String(record.date || ''),
              type: String(record.type || ''),
              notes: String(record.notes || '')
            }))
          : [],
        inspection_history: (Array.isArray(raw.inspection_history) 
          ? raw.inspection_history 
          : []
        ).map(entry => ({
          date: String(entry.date || ''),
          status: String(entry.status || ''),
          notes: String(entry.notes || '')
        })),
        connected_fixtures: Array.isArray(raw.connected_fixtures) ? raw.connected_fixtures : [],
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

  const handleBulkStatusUpdate = async (fixtureIds: string[], status: LightStatus) => {
    try {
      const { error } = await supabase
        .from('lighting_fixtures')
        .update({ status })
        .in('id', fixtureIds);

      if (error) throw error;
      toast.success(`Updated status for ${fixtureIds.length} fixtures`);
      queryClient.invalidateQueries({ queryKey: ['lighting-fixtures'] });
      return true;
    } catch (error: any) {
      toast.error(error.message || "Failed to update fixtures status");
      return false;
    }
  };

  return {
    fixtures: fixtures || [],
    isLoading,
    handleDelete,
    handleBulkDelete,
    handleBulkStatusUpdate,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['lighting-fixtures'] })
  };
}
