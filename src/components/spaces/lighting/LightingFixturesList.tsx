
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { LightingFixtureCard } from "@/components/lighting/card/LightingFixtureCard";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { LightingFixture } from "@/components/lighting/types";
import { PostgrestResponse } from "@supabase/supabase-js";

interface LightingFixturesListProps {
  selectedBuilding: string;
  selectedFloor: string;
}

type DatabaseFixture = {
  id: string;
  name: string;
  type: "standard" | "emergency" | "motion_sensor";
  status: "functional" | "maintenance_needed" | "non_functional" | "pending_maintenance" | "scheduled_replacement";
  space_type: "room" | "hallway" | null;
  [key: string]: any;
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

      const { data, error }: PostgrestResponse<DatabaseFixture> = await query;
      if (error) throw error;
      if (!data) return [];
      
      return data.map(fixture => {
        // Helper function to safely parse JSON strings
        const parseJson = <T,>(value: any, defaultValue: T): T => {
          if (typeof value === 'string') {
            try {
              return JSON.parse(value);
            } catch {
              return defaultValue;
            }
          }
          return value || defaultValue;
        };

        const transformed: LightingFixture = {
          id: fixture.id,
          name: fixture.name,
          type: fixture.type,
          status: fixture.status,
          zone_name: fixture.zone_name ?? null,
          building_name: fixture.building_name ?? null,
          floor_name: fixture.floor_name ?? null,
          floor_id: fixture.floor_id ?? null,
          space_id: fixture.space_id ?? null,
          space_type: fixture.space_type ?? null,
          position: fixture.position ?? null,
          sequence_number: fixture.sequence_number ?? null,
          zone_id: fixture.zone_id ?? null,
          space_name: fixture.space_name ?? null,
          room_number: fixture.room_number ?? null,
          emergency_circuit: fixture.emergency_circuit ?? false,
          technology: fixture.technology ?? null,
          ballast_issue: fixture.ballast_issue ?? false,
          bulb_count: fixture.bulb_count ?? 1,
          electrical_issues: parseJson(fixture.electrical_issues, {
            short_circuit: false,
            wiring_issues: false,
            voltage_problems: false
          }),
          energy_usage_data: parseJson(fixture.energy_usage_data, {
            daily_usage: [],
            efficiency_rating: null,
            last_reading: null
          }),
          emergency_protocols: parseJson(fixture.emergency_protocols, {
            emergency_contact: null,
            backup_system: false,
            evacuation_route: false
          }),
          warranty_info: parseJson(fixture.warranty_info, {
            start_date: null,
            end_date: null,
            provider: null,
            terms: null
          }),
          manufacturer_details: parseJson(fixture.manufacturer_details, {
            name: null,
            model: null,
            serial_number: null,
            support_contact: null
          }),
          inspection_history: parseJson(fixture.inspection_history, []).map((entry: any) => ({
            date: entry.date || '',
            status: entry.status || '',
            notes: entry.notes
          })),
          maintenance_history: parseJson(fixture.maintenance_history, []).map((entry: any) => ({
            date: entry.date || '',
            type: entry.type || '',
            notes: entry.notes
          })),
          connected_fixtures: fixture.connected_fixtures ?? [],
          created_at: fixture.created_at ?? null,
          updated_at: fixture.updated_at ?? null
        };

        return transformed;
      });
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
