
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { LightingFixtureCard } from "@/components/lighting/card/LightingFixtureCard";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { 
  LightingFixture, 
  LightingPosition,
  LightingTechnology,
  LightingType,
  LightStatus
} from "@/components/lighting/types";

interface LightingFixturesListProps {
  selectedBuilding: string;
  selectedFloor: string;
}

type DatabaseLightingFixture = {
  id: string;
  name: string;
  type: LightingType;
  status: LightStatus;
  zone_name: string | null;
  building_name: string | null;
  floor_name: string | null;
  floor_id: string | null;
  space_id: string | null;
  space_type: string | null;
  position: LightingPosition | null;
  sequence_number: number | null;
  zone_id: string | null;
  space_name: string | null;
  room_number: string | null;
  emergency_circuit: boolean;
  technology: LightingTechnology | null;
  ballast_issue: boolean;
  bulb_count: number;
  electrical_issues: string | null;
  energy_usage_data: string | null;
  emergency_protocols: string | null;
  warranty_info: string | null;
  manufacturer_details: string | null;
  inspection_history: string | null;
  maintenance_history: string | null;
  connected_fixtures: string[];
  maintenance_notes: string | null;
  ballast_check_notes: string | null;
  backup_power_source: string | null;
  emergency_duration_minutes: number | null;
  created_at: string | null;
  updated_at: string | null;
};

function parseJsonField<T>(field: string | null, defaultValue: T): T {
  if (!field) return defaultValue;
  try {
    return JSON.parse(field) as T;
  } catch {
    return defaultValue;
  }
}

export function LightingFixturesList({ selectedBuilding, selectedFloor }: LightingFixturesListProps) {
  const [selectedFixtures, setSelectedFixtures] = useState<string[]>([]);

  const query = useQuery({
    queryKey: ['lighting-fixtures', selectedBuilding, selectedFloor] as const,
    queryFn: async () => {
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

      return data.map((raw: DatabaseLightingFixture): LightingFixture => {
        // Parse JSON fields with their default values
        const electrical_issues = parseJsonField(raw.electrical_issues, {
          short_circuit: false,
          wiring_issues: false,
          voltage_problems: false
        });

        const energy_usage_data = parseJsonField(raw.energy_usage_data, {
          daily_usage: [],
          efficiency_rating: null,
          last_reading: null
        });

        const emergency_protocols = parseJsonField(raw.emergency_protocols, {
          emergency_contact: null,
          backup_system: false,
          evacuation_route: false
        });

        const warranty_info = parseJsonField(raw.warranty_info, {
          start_date: null,
          end_date: null,
          provider: null,
          terms: null
        });

        const manufacturer_details = parseJsonField(raw.manufacturer_details, {
          name: null,
          model: null,
          serial_number: null,
          support_contact: null
        });

        const inspection_history = parseJsonField(raw.inspection_history, []);
        const maintenance_history = parseJsonField(raw.maintenance_history, []);

        return {
          id: raw.id,
          name: raw.name,
          type: raw.type,
          status: raw.status,
          zone_name: raw.zone_name,
          building_name: raw.building_name,
          floor_name: raw.floor_name,
          floor_id: raw.floor_id,
          space_id: raw.space_id,
          space_type: raw.space_type === 'room' || raw.space_type === 'hallway' ? raw.space_type : null,
          position: raw.position,
          sequence_number: raw.sequence_number,
          zone_id: raw.zone_id,
          space_name: raw.space_name,
          room_number: raw.room_number,
          emergency_circuit: raw.emergency_circuit ?? false,
          technology: raw.technology,
          ballast_issue: raw.ballast_issue ?? false,
          bulb_count: raw.bulb_count ?? 1,
          electrical_issues,
          energy_usage_data,
          emergency_protocols,
          warranty_info,
          manufacturer_details,
          inspection_history,
          maintenance_history,
          connected_fixtures: raw.connected_fixtures || [],
          maintenance_notes: raw.maintenance_notes,
          ballast_check_notes: raw.ballast_check_notes,
          backup_power_source: raw.backup_power_source,
          emergency_duration_minutes: raw.emergency_duration_minutes,
          created_at: raw.created_at,
          updated_at: raw.updated_at
        };
      });
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
