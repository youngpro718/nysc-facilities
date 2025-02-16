
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

interface LightingZonesListProps {
  selectedBuilding: string;
  selectedFloor: string;
}

export function LightingZonesList({ selectedBuilding, selectedFloor }: LightingZonesListProps) {
  const { data: zones, isLoading } = useQuery({
    queryKey: ['lighting-zones', selectedBuilding, selectedFloor],
    queryFn: async () => {
      let query = supabase
        .from('lighting_zones')
        .select('*')
        .order('name');

      if (selectedFloor !== 'all') {
        query = query.eq('floor_id', selectedFloor);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return <div>Loading zones...</div>;
  }

  if (!zones?.length) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          No lighting zones found. Create a zone to get started.
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {zones.map((zone) => (
        <Card key={zone.id} className="p-4">
          <h3 className="font-medium">{zone.name}</h3>
          <p className="text-sm text-muted-foreground">{zone.type}</p>
        </Card>
      ))}
    </div>
  );
}
