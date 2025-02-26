
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LightingDashboard } from "./LightingDashboard";
import { CreateLightingDialog } from "./CreateLightingDialog";
import LightingFixturesList from "./LightingFixturesList";
import { LightingZonesList } from "./LightingZonesList";
import { Lightbulb, LayoutGrid } from "lucide-react";

export const LightingManagement = () => {
  const [view, setView] = useState<'fixtures' | 'zones'>('fixtures');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [selectedFloor, setSelectedFloor] = useState<string>('all');

  const handleFixtureCreated = async () => {
    // Refetch fixtures list
    window.location.reload();
  };

  const handleZoneCreated = async () => {
    // Refetch zones list
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Lighting Management</h2>
        <div className="flex items-center gap-4">
          <Select value={view} onValueChange={(value: 'fixtures' | 'zones') => setView(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixtures">Fixtures</SelectItem>
              <SelectItem value="zones">Zones</SelectItem>
            </SelectContent>
          </Select>
          <CreateLightingDialog 
            onFixtureCreated={handleFixtureCreated}
            onZoneCreated={handleZoneCreated}
          />
        </div>
      </div>
      
      <LightingDashboard />

      <div className="mt-8">
        {view === 'fixtures' ? (
          <LightingFixturesList 
            selectedBuilding={selectedBuilding}
            selectedFloor={selectedFloor}
          />
        ) : (
          <LightingZonesList 
            selectedBuilding={selectedBuilding}
            selectedFloor={selectedFloor}
          />
        )}
      </div>
    </div>
  );
};
