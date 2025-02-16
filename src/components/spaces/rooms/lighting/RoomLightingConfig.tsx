
import { AssignFixtureDialog } from "./AssignFixtureDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LightingFixture } from "@/components/lighting/types";

interface RoomLightingSectionProps {
  roomId: string;
}

export function RoomLightingSection({ roomId }: RoomLightingSectionProps) {
  const { data: fixtures, isLoading, refetch } = useQuery({
    queryKey: ['room-lighting', roomId],
    queryFn: async () => {
      console.log("Fetching lighting fixtures for room:", roomId);
      
      const { data: fixtureData, error } = await supabase
        .from('lighting_fixture_details')
        .select('*')
        .eq('space_id', roomId)
        .eq('space_type', 'room');

      if (error) {
        console.error('Error fetching lighting fixtures:', error);
        throw error;
      }

      console.log("Fixture data:", fixtureData);

      return (fixtureData || []).map((raw: any): LightingFixture => ({
        id: raw.id,
        name: raw.name,
        type: raw.type,
        status: raw.status,
        building_name: raw.building_name || null,
        floor_name: raw.floor_name || null,
        floor_id: raw.floor_id || null,
        zone_name: raw.zone_name || null,
        space_id: raw.space_id || null,
        space_type: raw.space_type as 'room' | 'hallway' | null,
        position: raw.position || null,
        sequence_number: raw.sequence_number || null,
        zone_id: raw.zone_id || null,
        space_name: raw.space_name || null,
        room_number: raw.room_number || null,
        emergency_circuit: raw.emergency_circuit || false,
        technology: raw.technology || null,
        ballast_issue: raw.ballast_issue || false,
        bulb_count: raw.bulb_count || 1,
        electrical_issues: typeof raw.electrical_issues === 'object' ? raw.electrical_issues : {
          short_circuit: false,
          wiring_issues: false,
          voltage_problems: false
        },
        energy_usage_data: raw.energy_usage_data || null,
        emergency_protocols: raw.emergency_protocols || null,
        warranty_info: raw.warranty_info || null,
        manufacturer_details: raw.manufacturer_details || null,
        inspection_history: Array.isArray(raw.inspection_history) ? raw.inspection_history : [],
        maintenance_history: Array.isArray(raw.maintenance_history) ? raw.maintenance_history : [],
        connected_fixtures: Array.isArray(raw.connected_fixtures) ? raw.connected_fixtures : [],
        maintenance_notes: raw.maintenance_notes || null,
        ballast_check_notes: raw.ballast_check_notes || null,
        backup_power_source: raw.backup_power_source || null,
        emergency_duration_minutes: raw.emergency_duration_minutes || null,
        created_at: raw.created_at || null,
        updated_at: raw.updated_at || null
      }));
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Lighting</h3>
        <AssignFixtureDialog 
          roomId={roomId}
          onAssignmentComplete={refetch}
        />
      </div>
    </div>
  );
}
