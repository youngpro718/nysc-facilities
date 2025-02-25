import { useState } from "react";
import { useLightingFixtures } from "./hooks/useLightingFixtures";
import { LightingFixtureCard } from "./card/LightingFixtureCard";
import { LightingHeader } from "./components/LightingHeader";
import { LightingFixture } from "./types";
import { LightingFilters } from "./components/LightingFilters";

interface LightingFixturesListProps {
  selectedBuilding: string;
  selectedFloor: string;
}

export default function LightingFixturesList({ selectedBuilding, selectedFloor }: LightingFixturesListProps) {
  const [selectedFixtures, setSelectedFixtures] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    search: "",
    type: "all",
    status: "all",
    zone_id: "all"
  });

  const { 
    fixtures, 
    refetch, 
    handleDelete, 
    handleBulkDelete, 
    handleBulkStatusUpdate 
  } = useLightingFixtures();

  const handleSelectAll = () => {
    if (selectedFixtures.length === filteredFixtures.length) {
      setSelectedFixtures([]);
    } else {
      setSelectedFixtures(filteredFixtures.map(f => f.id));
    }
  };

  const handleBulkAction = async (status: LightingFixture['status']) => {
    const success = await handleBulkStatusUpdate(selectedFixtures, status);
    if (success) {
      setSelectedFixtures([]);
      await refetch();
    }
  };

  const handleBulkDeleteAction = async () => {
    const success = await handleBulkDelete(selectedFixtures);
    if (success) {
      setSelectedFixtures([]);
      await refetch();
    }
  };

  const filteredFixtures = fixtures?.filter(fixture => {
    if (filters.search && !fixture.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.type !== "all" && fixture.type !== filters.type) {
      return false;
    }
    if (filters.status !== "all" && fixture.status !== filters.status) {
      return false;
    }
    if (filters.zone_id === "unassigned" && fixture.zone_id) {
      return false;
    }
    if (filters.zone_id !== "all" && filters.zone_id !== "unassigned" && fixture.zone_id !== filters.zone_id) {
      return false;
    }
    return true;
  }) || [];

  return (
    <div className="container mx-auto p-6">
      <LightingHeader 
        selectedFixtures={selectedFixtures}
        fixtures={filteredFixtures}
        onSelectAll={handleSelectAll}
        onBulkStatusUpdate={handleBulkAction}
        onBulkDelete={handleBulkDeleteAction}
        onFixtureCreated={refetch}
      />

      <div className="mb-6">
        <LightingFilters
          filters={filters}
          onFilterChange={(newFilters) => setFilters({ ...filters, ...newFilters })}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFixtures.map((fixture) => (
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

      {(!filteredFixtures || filteredFixtures.length === 0) && (
        <div className="text-center py-8 text-gray-500">
          {fixtures?.length ? 'No fixtures match the current filters' : 'No lighting fixtures found'}
        </div>
      )}
    </div>
  );
}
