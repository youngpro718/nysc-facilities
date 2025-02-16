
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

type FetchFixturesResponse = Awaited<ReturnType<typeof fetchFixtures>>;

async function fetchFixtures(selectedBuilding: string, selectedFloor: string) {
  let query = supabase
    .from('lighting_fixture_details')
    .select('*')
    .order('name');

  if (selectedFloor !== 'all') {
    query = query.eq('floor_id', selectedFloor);
  }
  if (selectedBuilding !== 'all') {
    query = query.eq('building_id', selectedBuilding);
  }

  const { data, error } = await query;
  if (error) throw error;
  if (!data) return [];

  return data.map((raw: any): LightingFixture => ({
    id: raw.id,
    name: raw.name,
    type: raw.type,
    status: raw.status,
    zone_name: raw.zone_name ?? null,
    building_name: raw.building_name ?? null,
    floor_name: raw.floor_name ?? null,
    floor_id: raw.floor_id ?? null,
    space_id: raw.space_id ?? null,
    space_type: raw.space_type === 'room' || raw.space_type === 'hallway' ? raw.space_type : null,
    position: raw.position ?? null,
    sequence_number: raw.sequence_number ?? null,
    zone_id: raw.zone_id ?? null,
    space_name: raw.space_name ?? null,
    room_number: raw.room_number ?? null,
    emergency_circuit: raw.emergency_circuit ?? false,
    technology: raw.technology ?? null,
    ballast_issue: raw.ballast_issue ?? false,
    bulb_count: raw.bulb_count ?? 1,
    electrical_issues: {
      short_circuit: raw.electrical_issues?.short_circuit ?? false,
      wiring_issues: raw.electrical_issues?.wiring_issues ?? false,
      voltage_problems: raw.electrical_issues?.voltage_problems ?? false
    },
    energy_usage_data: {
      daily_usage: [],
      efficiency_rating: null,
      last_reading: null,
      ...(raw.energy_usage_data || {})
    },
    emergency_protocols: {
      emergency_contact: null,
      backup_system: false,
      evacuation_route: false,
      ...(raw.emergency_protocols || {})
    },
    warranty_info: {
      start_date: null,
      end_date: null,
      provider: null,
      terms: null,
      ...(raw.warranty_info || {})
    },
    manufacturer_details: {
      name: null,
      model: null,
      serial_number: null,
      support_contact: null,
      ...(raw.manufacturer_details || {})
    },
    inspection_history: Array.isArray(raw.inspection_history) ? raw.inspection_history : [],
    maintenance_history: Array.isArray(raw.maintenance_history) ? raw.maintenance_history : [],
    connected_fixtures: Array.isArray(raw.connected_fixtures) ? raw.connected_fixtures : [],
    maintenance_notes: raw.maintenance_notes ?? null,
    ballast_check_notes: raw.ballast_check_notes ?? null,
    backup_power_source: raw.backup_power_source ?? null,
    emergency_duration_minutes: raw.emergency_duration_minutes ?? null,
    created_at: raw.created_at ?? null,
    updated_at: raw.updated_at ?? null
  }));
}

export function LightingFixturesList({ selectedBuilding, selectedFloor }: LightingFixturesListProps) {
  const [selectedFixtures, setSelectedFixtures] = useState<string[]>([]);

  const { data: fixtures, isLoading, refetch } = useQuery({
    queryKey: ['lighting-fixtures', selectedBuilding, selectedFloor] as const,
    queryFn: () => fetchFixtures(selectedBuilding, selectedFloor)
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
      refetch();
    } catch (error) {
      console.error('Error deleting fixtures:', error);
      toast.error('Failed to delete fixtures');
    }
  };

  if (isLoading) {
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
        {fixtures?.map((fixture) => (
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
            onDelete={() => refetch()}
            onFixtureUpdated={() => refetch()}
          />
        ))}
      </div>

      {(!fixtures || fixtures.length === 0) && (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            No lighting fixtures found. Add fixtures to get started.
          </div>
        </Card>
      )}
    </div>
  );
}
