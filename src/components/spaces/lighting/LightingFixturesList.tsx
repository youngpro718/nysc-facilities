
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
  InspectionEntry, 
  MaintenanceEntry, 
  ElectricalIssues,
  EnergyUsageData,
  EmergencyProtocols,
  WarrantyInfo,
  ManufacturerDetails 
} from "@/components/lighting/types";

interface LightingFixturesListProps {
  selectedBuilding: string;
  selectedFloor: string;
}

interface DatabaseFixture {
  id: string;
  name: string;
  type: LightingFixture['type'];
  status: LightingFixture['status'];
  zone_name: string | null;
  building_name: string | null;
  floor_name: string | null;
  floor_id: string | null;
  space_id: string | null;
  space_type: string | null;
  position: string | null;
  sequence_number: number | null;
  zone_id: string | null;
  space_name: string | null;
  room_number: string | null;
  emergency_circuit: boolean;
  technology: string | null;
  ballast_issue: boolean;
  bulb_count: number;
  electrical_issues: {
    short_circuit: boolean;
    wiring_issues: boolean;
    voltage_problems: boolean;
  } | null;
  energy_usage_data: Partial<EnergyUsageData> | null;
  emergency_protocols: Partial<EmergencyProtocols> | null;
  warranty_info: Partial<WarrantyInfo> | null;
  manufacturer_details: Partial<ManufacturerDetails> | null;
  inspection_history: InspectionEntry[];
  maintenance_history: MaintenanceEntry[];
  connected_fixtures: string[];
  maintenance_notes: string | null;
  ballast_check_notes: string | null;
  backup_power_source: string | null;
  emergency_duration_minutes: number | null;
  created_at: string | null;
  updated_at: string | null;
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

      return data.map((item: DatabaseFixture): LightingFixture => ({
        id: item.id,
        name: item.name,
        type: item.type,
        status: item.status,
        zone_name: item.zone_name,
        building_name: item.building_name,
        floor_name: item.floor_name,
        floor_id: item.floor_id,
        space_id: item.space_id,
        space_type: item.space_type === 'room' || item.space_type === 'hallway' ? item.space_type : null,
        position: item.position,
        sequence_number: item.sequence_number,
        zone_id: item.zone_id,
        space_name: item.space_name,
        room_number: item.room_number,
        emergency_circuit: item.emergency_circuit ?? false,
        technology: item.technology,
        ballast_issue: item.ballast_issue ?? false,
        bulb_count: item.bulb_count ?? 1,
        electrical_issues: item.electrical_issues ?? {
          short_circuit: false,
          wiring_issues: false,
          voltage_problems: false
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
        inspection_history: item.inspection_history || [],
        maintenance_history: item.maintenance_history || [],
        connected_fixtures: item.connected_fixtures || [],
        maintenance_notes: item.maintenance_notes,
        ballast_check_notes: item.ballast_check_notes,
        backup_power_source: item.backup_power_source,
        emergency_duration_minutes: item.emergency_duration_minutes,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));
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
