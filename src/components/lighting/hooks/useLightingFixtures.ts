
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
        zone_name: null, // Will implement zone relation later
        building_name: null, // Will need to fetch separately if needed
        floor_name: null, // Will need to fetch separately if needed
        floor_id: raw.floor_id || null,
        space_id: raw.space_id || null,
        space_type: (raw.space_type || 'room') as 'room' | 'hallway',
        position: (raw.position || 'ceiling') as 'ceiling' | 'wall' | 'floor' | 'desk',
        sequence_number: raw.sequence_number || null,
        zone_id: raw.zone_id || null,
        space_name: null, // Will need to fetch separately if needed
        room_number: raw.room_number || null,
        technology: raw.technology || null,
        maintenance_notes: raw.maintenance_notes || null,
        created_at: raw.created_at || null,
        updated_at: raw.updated_at || null,
        bulb_count: raw.bulb_count || 1,
        electrical_issues: typeof raw.electrical_issues === 'object' ? {
          short_circuit: (raw.electrical_issues as any)?.short_circuit || false,
          wiring_issues: (raw.electrical_issues as any)?.wiring_issues || false,
          voltage_problems: (raw.electrical_issues as any)?.voltage_problems || false
        } : {
          short_circuit: false,
          wiring_issues: false,
          voltage_problems: false
        },
        ballast_issue: raw.ballast_issue || false,
        ballast_check_notes: raw.ballast_check_notes || null,
        emergency_circuit: false, // These fields are not in the schema yet
        backup_power_source: null,
        emergency_duration_minutes: null,
        maintenance_history: Array.isArray(raw.maintenance_history) 
          ? (raw.maintenance_history as any[]).map(record => ({
              id: record.id || '',
              date: record.date || '',
              type: record.type || '',
              notes: record.notes || ''
            }))
          : [],
        inspection_history: Array.isArray(raw.inspection_history)
          ? (raw.inspection_history as any[]).map(record => ({
              id: record.id || '',
              date: record.date || '',
              status: record.status || '',
              notes: record.notes || ''
            }))
          : []
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
      return true;
    } catch (error: any) {
      toast.error(error.message || "Failed to delete lighting fixture");
      return false;
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
      return true;
    } catch (error: any) {
      toast.error(error.message || "Failed to delete fixtures");
      return false;
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
