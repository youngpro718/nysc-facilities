
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { LightingFixtureCard } from "@/components/lighting/card/LightingFixtureCard";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { LightingFixture } from "@/components/lighting/types";

interface LightingFixturesListProps {
  selectedBuilding: string;
  selectedFloor: string;
}

async function fetchLightingFixtures(buildingId: string, floorId: string) {
  let query = supabase
    .from('lighting_fixture_details')
    .select('*')
    .order('name');

  if (floorId !== 'all') {
    query = query.eq('floor_id', floorId);
  }
  if (buildingId !== 'all') {
    query = query.eq('building_id', buildingId);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  return data || [];
}

export function LightingFixturesList({ selectedBuilding, selectedFloor }: LightingFixturesListProps) {
  const [selectedFixtures, setSelectedFixtures] = useState<string[]>([]);

  const query = useQuery({
    queryKey: ['lighting-fixtures', selectedBuilding, selectedFloor],
    queryFn: async () => {
      const data = await fetchLightingFixtures(selectedBuilding, selectedFloor);
      return data.map(item => ({
        id: item.id,
        name: item.name,
        type: item.type,
        status: item.status,
        zone_name: item.zone_name ?? null,
        building_name: item.building_name ?? null,
        floor_name: item.floor_name ?? null,
        floor_id: item.floor_id ?? null,
        space_id: item.space_id ?? null,
        space_type: item.space_type === 'room' || item.space_type === 'hallway' ? item.space_type : null,
        position: item.position ?? null,
        sequence_number: item.sequence_number ?? null,
        zone_id: item.zone_id ?? null,
        space_name: item.space_name ?? null,
        room_number: item.room_number ?? null,
        emergency_circuit: item.emergency_circuit ?? false,
        technology: item.technology ?? null,
        ballast_issue: item.ballast_issue ?? false,
        bulb_count: item.bulb_count ?? 1,
        electrical_issues: {
          short_circuit: item.electrical_issues?.short_circuit ?? false,
          wiring_issues: item.electrical_issues?.wiring_issues ?? false,
          voltage_problems: item.electrical_issues?.voltage_problems ?? false
        },
        energy_usage_data: {
          daily_usage: [],
          efficiency_rating: null,
          last_reading: null,
          ...(item.energy_usage_data || {})
        },
        emergency_protocols: {
          emergency_contact: null,
          backup_system: false,
          evacuation_route: false,
          ...(item.emergency_protocols || {})
        },
        warranty_info: {
          start_date: null,
          end_date: null,
          provider: null,
          terms: null,
          ...(item.warranty_info || {})
        },
        manufacturer_details: {
          name: null,
          model: null,
          serial_number: null,
          support_contact: null,
          ...(item.manufacturer_details || {})
        },
        inspection_history: Array.isArray(item.inspection_history) ? item.inspection_history : [],
        maintenance_history: Array.isArray(item.maintenance_history) ? item.maintenance_history : [],
        connected_fixtures: Array.isArray(item.connected_fixtures) ? item.connected_fixtures : [],
        maintenance_notes: item.maintenance_notes ?? null,
        ballast_check_notes: item.ballast_check_notes ?? null,
        backup_power_source: item.backup_power_source ?? null,
        emergency_duration_minutes: item.emergency_duration_minutes ?? null,
        created_at: item.created_at ?? null,
        updated_at: item.updated_at ?? null
      } as LightingFixture));
    }
  });

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('lighting_fixtures')
        .delete()
        .in('id', selectedFixtures);

      if (error) throw error;

      toast.success(`${selectedFixtures.length} fixtures deleted successfully`);
      setSelectedFixtures([]);
      query.refetch();
    } catch (error) {
      console.error('Error deleting fixtures:', error);
      toast.error('Failed to delete fixtures');
    }
  };

  if (query.isLoading) {
    return <div>Loading fixtures...</div>;
  }

  return (
    <div className="space-y-4">
      {selectedFixtures.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <span>{selectedFixtures.length} fixtures selected</span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected
          </Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {query.data?.map((fixture) => (
          <LightingFixtureCard
            key={fixture.id}
            fixture={fixture}
            isSelected={selectedFixtures.includes(fixture.id)}
            onSelect={(checked) => {
              setSelectedFixtures(prev => 
                checked 
                  ? [...prev, fixture.id]
                  : prev.filter(id => id !== fixture.id)
              );
            }}
            onDelete={() => query.refetch()}
            onFixtureUpdated={() => query.refetch()}
          />
        ))}
      </div>

      {(!query.data || query.data.length === 0) && (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            No lighting fixtures found. Add fixtures to get started.
          </div>
        </Card>
      )}
    </div>
  );
}
