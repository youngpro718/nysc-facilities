
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LightingFixture, LightStatus } from "@/types/lighting";

export function useLightingFixtures() {
  const queryClient = useQueryClient();

  const { data: fixtures, isLoading } = useQuery({
    queryKey: ['lighting-fixtures'],
    queryFn: async () => {
      const { data: rawFixtures, error } = await supabase
        .from('lighting_fixtures')
        .select(`
          *,
          spatial_assignment:spatial_assignments(*)
        `);

      if (error) throw error;

      return (rawFixtures || []).map((raw: any): LightingFixture => ({
        id: raw.id,
        name: raw.name,
        type: raw.type,
        status: raw.status,
        zone_name: raw.zone_name || null,
        building_name: raw.building_name || null,
        floor_name: raw.floor_name || null,
        floor_id: raw.floor_id || null,
        space_id: raw.space_id || null,
        space_type: raw.space_type,
        position: raw.position || null,
        sequence_number: raw.sequence_number || null,
        zone_id: raw.zone_id || null,
        space_name: raw.space_name || null,
        room_number: raw.room_number || null,
        technology: raw.technology || null,
        maintenance_notes: raw.maintenance_notes || null,
        created_at: raw.created_at || null,
        updated_at: raw.updated_at || null,
        bulb_count: raw.bulb_count || 1,
        electrical_issues: raw.electrical_issues || {
          short_circuit: false,
          wiring_issues: false,
          voltage_problems: false
        },
        ballast_issue: raw.ballast_issue || false,
        ballast_check_notes: raw.ballast_check_notes || null,
        emergency_circuit: raw.emergency_circuit || false,
        backup_power_source: raw.backup_power_source || null,
        emergency_duration_minutes: raw.emergency_duration_minutes || null,
        maintenance_history: raw.maintenance_history || [],
        inspection_history: raw.inspection_history || [],
        spatial_assignment: raw.spatial_assignment ? {
          id: raw.spatial_assignment.id,
          sequence_number: raw.spatial_assignment.sequence_number,
          position: raw.spatial_assignment.position,
          space_type: raw.spatial_assignment.space_type
        } : undefined
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
