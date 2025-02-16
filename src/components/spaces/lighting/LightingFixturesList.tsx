
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LightingFixtureCard } from "@/components/lighting/card/LightingFixtureCard";
import { toast } from "sonner";
import { CreateLightingDialog } from "@/components/lighting/CreateLightingDialog";
import { useLightingFixtures } from "./hooks/useLightingFixtures";
import { NoFixturesFound } from "./components/NoFixturesFound";
import { SelectedFixturesBar } from "./components/SelectedFixturesBar";

interface LightingFixturesListProps {
  selectedBuilding: string;
  selectedFloor: string;
}

export function LightingFixturesList({ selectedBuilding, selectedFloor }: LightingFixturesListProps) {
  const [selectedFixtures, setSelectedFixtures] = useState<string[]>([]);
  const query = useLightingFixtures({ selectedBuilding, selectedFloor });

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
      <div className="flex items-center justify-between">
        <CreateLightingDialog 
          onFixtureCreated={() => query.refetch()}
          onZoneCreated={() => query.refetch()}
        />
      </div>

      {selectedFixtures.length > 0 && (
        <SelectedFixturesBar 
          count={selectedFixtures.length}
          onDelete={handleDelete}
        />
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

      {(!query.data || query.data.length === 0) && <NoFixturesFound />}
    </div>
  );
}
