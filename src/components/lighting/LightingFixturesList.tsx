
import { useState } from "react";
import { useLightingFixtures } from "./hooks/useLightingFixtures";
import { LightingFixtureCard } from "./card/LightingFixtureCard";
import { LightingHeader } from "./components/LightingHeader";
import { LightingFixture } from "./types";

export default function LightingFixturesList() {
  const [selectedFixtures, setSelectedFixtures] = useState<string[]>([]);
  const { 
    fixtures, 
    refetch, 
    handleDelete, 
    handleBulkDelete, 
    handleBulkStatusUpdate 
  } = useLightingFixtures();
  
  const handleSelectAll = () => {
    if (selectedFixtures.length === fixtures?.length) {
      setSelectedFixtures([]);
    } else {
      setSelectedFixtures(fixtures?.map(f => f.id) || []);
    }
  };

  const handleBulkAction = async (status: LightingFixture['status']) => {
    const success = await handleBulkStatusUpdate(selectedFixtures, status);
    if (success) {
      setSelectedFixtures([]);
      refetch();
    }
  };

  const handleBulkDeleteAction = async () => {
    const success = await handleBulkDelete(selectedFixtures);
    if (success) {
      setSelectedFixtures([]);
      refetch();
    }
  };

  return (
    <div className="container mx-auto p-6">
      <LightingHeader 
        selectedFixtures={selectedFixtures}
        fixtures={fixtures}
        onSelectAll={handleSelectAll}
        onBulkStatusUpdate={handleBulkAction}
        onBulkDelete={handleBulkDeleteAction}
        onFixtureCreated={refetch}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {fixtures?.map((fixture) => (
          <LightingFixtureCard
            key={fixture.id}
            fixture={fixture}
            isSelected={selectedFixtures.includes(fixture.id)}
            onSelect={(checked) => {
              if (checked) {
                setSelectedFixtures([...selectedFixtures, fixture.id]);
              } else {
                setSelectedFixtures(selectedFixtures.filter(id => id !== fixture.id));
              }
            }}
            onDelete={() => handleDelete(fixture.id)}
            onFixtureUpdated={refetch}
          />
        ))}
      </div>

      {(!fixtures || fixtures.length === 0) && (
        <div className="text-center py-8 text-gray-500">
          No lighting fixtures found
        </div>
      )}
    </div>
  );
}
