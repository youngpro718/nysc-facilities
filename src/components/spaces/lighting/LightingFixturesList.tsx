
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

// Define raw database response type to match actual database structure
interface RawLightingFixture {
  id: string;
  name: string;
  type: "standard" | "emergency" | "motion_sensor";
  status: "functional" | "maintenance_needed" | "non_functional" | "pending_maintenance" | "scheduled_replacement";
  zone_name: string | null;
  building_name: string | null;
  floor_name: string | null;
  floor_id: string | null;
  backup_power_source: string | null;
  ballast_check_notes: string | null;
  ballast_issue: boolean;
  emergency_circuit: boolean;
  emergency_duration_minutes: number | null;
  technology: "LED" | "Fluorescent" | "Bulb" | null;
  bulb_count: number;
  space_id: string | null;
  space_type: 'room' | 'hallway' | null;
  position: 'ceiling' | 'wall' | 'floor' | 'desk' | 'recessed' | null;
  sequence_number: number | null;
  zone_id: string | null;
  space_name: string | null;
  room_number: string | null;
  electrical_issues: any;
  energy_usage_data: any;
  emergency_protocols: any;
  warranty_info: any;
  manufacturer_details: any;
  inspection_history: any;
  maintenance_history: any;
  connected_fixtures: string[] | null;
  created_at: string | null;
  updated_at: string | null;
}

export function LightingFixturesList({ selectedBuilding, selectedFloor }: LightingFixturesListProps) {
  const [selectedFixtures, setSelectedFixtures] = useState<string[]>([]);

  const { data: fixtures, isLoading, refetch } = useQuery({
    queryKey: ['lighting-fixtures', selectedBuilding, selectedFloor],
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
      
      const rawFixtures = data as unknown as RawLightingFixture[];
      
      return rawFixtures.map(fixture => ({
        ...fixture,
        electrical_issues: typeof fixture.electrical_issues === 'string' 
          ? JSON.parse(fixture.electrical_issues) 
          : fixture.electrical_issues || {
              short_circuit: false,
              wiring_issues: false,
              voltage_problems: false
            },
        energy_usage_data: {
          daily_usage: [],
          efficiency_rating: null,
          last_reading: null,
          ...(fixture.energy_usage_data ? 
            typeof fixture.energy_usage_data === 'string' ? 
              JSON.parse(fixture.energy_usage_data) : 
              fixture.energy_usage_data
            : {})
        },
        emergency_protocols: {
          emergency_contact: null,
          backup_system: false,
          evacuation_route: false,
          ...(fixture.emergency_protocols ? 
            typeof fixture.emergency_protocols === 'string' ? 
              JSON.parse(fixture.emergency_protocols) : 
              fixture.emergency_protocols
            : {})
        },
        warranty_info: {
          start_date: null,
          end_date: null,
          provider: null,
          terms: null,
          ...(fixture.warranty_info ? 
            typeof fixture.warranty_info === 'string' ? 
              JSON.parse(fixture.warranty_info) : 
              fixture.warranty_info
            : {})
        },
        manufacturer_details: {
          name: null,
          model: null,
          serial_number: null,
          support_contact: null,
          ...(fixture.manufacturer_details ? 
            typeof fixture.manufacturer_details === 'string' ? 
              JSON.parse(fixture.manufacturer_details) : 
              fixture.manufacturer_details
            : {})
        },
        inspection_history: fixture.inspection_history 
          ? (Array.isArray(fixture.inspection_history) 
              ? fixture.inspection_history 
              : typeof fixture.inspection_history === 'string' 
                ? JSON.parse(fixture.inspection_history) 
                : []
            ).map((entry: any) => ({
              date: entry.date || '',
              status: entry.status || '',
              notes: entry.notes
            }))
          : [],
        maintenance_history: fixture.maintenance_history 
          ? (Array.isArray(fixture.maintenance_history)
              ? fixture.maintenance_history
              : typeof fixture.maintenance_history === 'string'
                ? JSON.parse(fixture.maintenance_history)
                : []
            ).map((entry: any) => ({
              date: entry.date || '',
              type: entry.type || '',
              notes: entry.notes
            }))
          : [],
        connected_fixtures: fixture.connected_fixtures || [],
        // Ensure required fields are present
        emergency_circuit: fixture.emergency_circuit || false,
        technology: fixture.technology || null,
        ballast_issue: fixture.ballast_issue || false,
        bulb_count: fixture.bulb_count || 1
      })) satisfies LightingFixture[];
    }
  });

  const handleDeleteSelected = async () => {
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
            onClick={handleDeleteSelected}
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

      {fixtures?.length === 0 && (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            No lighting fixtures found. Add fixtures to get started.
          </div>
        </Card>
      )}
    </div>
  );
}
