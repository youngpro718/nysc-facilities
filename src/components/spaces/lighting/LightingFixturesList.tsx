
import { useState } from "react";
import { useLightingFixtures } from "@/components/lighting/hooks/useLightingFixtures";
import { LightingFixtureCard } from "@/components/lighting/card/LightingFixtureCard";
import { LightingHeader } from "@/components/lighting/components/LightingHeader";

export const LightingFixturesList = () => {
  const [selectedFixtures, setSelectedFixtures] = useState<string[]>([]);
  const { 
    fixtures, 
    isLoading,
    addFixture,
    deleteFixture,
    isAdding,
    isDeleting
  } = useLightingFixtures();
  
  const handleSelectAll = () => {
    if (selectedFixtures.length === fixtures?.length) {
      setSelectedFixtures([]);
    } else {
      setSelectedFixtures(fixtures?.map(f => f.id) || []);
    }
  };

  const handleBulkDelete = async (fixtureIds: string[]) => {
    for (const id of fixtureIds) {
      await deleteFixture(id);
    }
    setSelectedFixtures([]);
  };

  return (
    <div className="container mx-auto p-6">
      <LightingHeader 
        selectedFixtures={selectedFixtures}
        fixtures={fixtures}
        onSelectAll={handleSelectAll}
        onBulkDelete={handleBulkDelete}
        onFixtureCreated={addFixture}
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
            onDelete={() => deleteFixture()}
            onFixtureUpdated={() => {}} // Will be implemented when needed
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
};

export default LightingFixturesList;
