
import { useState, useEffect } from "react";
import { useLightingFixtures } from "@/components/lighting/hooks/useLightingFixtures";
import { LightingFixtureCard } from "@/components/lighting/card/LightingFixtureCard";
import { LightingHeader } from "@/components/lighting/components/LightingHeader";
import { LightingFixture } from "@/components/lighting/types";
import { MobileLightingList } from "@/components/lighting/mobile/MobileLightingList";

interface LightingFixturesListProps {
  selectedBuilding?: string;
  selectedFloor?: string;
}

export const LightingFixturesList = ({ selectedBuilding, selectedFloor }: LightingFixturesListProps) => {
  const [selectedFixtures, setSelectedFixtures] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  
  const { 
    fixtures, 
    isLoading,
    handleDelete,
    handleBulkDelete,
    refetch
  } = useLightingFixtures();

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const handleSelectAll = () => {
    if (selectedFixtures.length === fixtures?.length) {
      setSelectedFixtures([]);
    } else {
      setSelectedFixtures(fixtures?.map(f => f.id) || []);
    }
  };

  const handleBulkDeleteAction = async () => {
    if (selectedFixtures.length > 0) {
      await handleBulkDelete(selectedFixtures);
      setSelectedFixtures([]);
    }
  };

  // Convert fixtures to mobile format
  const mobileFixtures = fixtures?.map(fixture => ({
    id: fixture.id,
    name: fixture.name || `Fixture ${fixture.id.slice(0, 8)}`,
    type: fixture.type || 'LED',
    status: fixture.status || 'functional',
    location: fixture.space_name || fixture.room_number || 'Unknown',
    wattage: undefined, // Not available in current type
    lastMaintenance: fixture.last_maintenance_date,
    nextMaintenance: fixture.next_maintenance_date,
    energyConsumption: undefined, // Not available in current type
    issues: 0 // Will be calculated from issues data
  })) || [];

  if (isMobile) {
    return (
      <MobileLightingList
        fixtures={mobileFixtures}
        selectedBuilding={selectedBuilding}
        selectedFloor={selectedFloor}
        onFixtureSelect={setSelectedFixtures}
        onAddFixture={() => {/* Handle add fixture */}}
        onBulkAction={(action, fixtureIds) => {
          if (action === "schedule_maintenance") {
            // Handle bulk maintenance scheduling
          } else if (action === "toggle_status") {
            // Handle bulk status toggle
          }
        }}
      />
    );
  }

  return (
    <div className="container mx-auto p-6">
      <LightingHeader 
        selectedFixtures={selectedFixtures}
        fixtures={fixtures}
        onSelectAll={handleSelectAll}
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
};

export default LightingFixturesList;
