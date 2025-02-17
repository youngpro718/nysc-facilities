import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LightingFixture } from "@/components/lighting/types";

export function useLightingFixtures() {
  const queryClient = useQueryClient();

  const { data: fixtures, isLoading } = useQuery({
    queryKey: ['lighting-fixtures'],
    queryFn: async () => {
      const { data: rawFixtures, error } = await supabase
        .from('lighting_fixture_details')
        .select('*');

      if (error) throw error;

      return (rawFixtures || []).map((raw: any) => ({
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
        maintenance_history: (raw.maintenance_history || []).map((record: any) => ({
          id: record.id,
          date: record.date,
          type: record.type,
          notes: record.notes
        })),
        inspection_history: (raw.inspection_history || []).map((record: any) => ({
          id: record.id,
          date: record.date,
          status: record.status,
          notes: record.notes
        })),
        spatial_assignment: raw.spatial_assignment ? {
          id: raw.spatial_assignment.id,
          sequence_number: raw.spatial_assignment.sequence_number,
          position: raw.spatial_assignment.position,
          space_type: raw.spatial_assignment.space_type
        } : undefined
      })) as LightingFixture[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (fixture: Omit<LightingFixture, 'id'>) => {
      const { data, error } = await supabase
        .from('lighting_fixtures')
        .insert({
          name: fixture.name,
          type: fixture.type,
          status: fixture.status,
          space_type: fixture.space_type,
          zone_id: fixture.zone_id,
          electrical_issues: fixture.electrical_issues || {},
          backup_power_source: fixture.backup_power_source,
          bulb_count: fixture.bulb_count || 1,
          connected_fixtures: fixture.connected_fixtures || [],
          maintenance_history: []
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lighting-fixtures'] });
      toast({
        title: "Success",
        description: "Lighting fixture added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    fixtures: fixtures || [],
    isLoading,
    addFixture: createMutation.mutateAsync,
    updateFixture: async () => {}, // Implement if needed
    deleteFixture: async () => {}, // Implement if needed
    isAdding: createMutation.isPending,
    isUpdating: false,
    isDeleting: false,
  };
}
