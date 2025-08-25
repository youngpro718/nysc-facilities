
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LightingDashboard } from "./dashboard/LightingDashboard";
import { CreateLightingDialog } from "./CreateLightingDialog";
import { LightingFixturesList } from "./LightingFixturesList";
import { LightingZonesList } from "./LightingZonesList";
import { BulkLightingActions } from "./bulk/BulkLightingActions";
import { EnhancedLightingCreation } from "./enhanced/EnhancedLightingCreation";
import { Lightbulb, LayoutGrid, Settings } from "lucide-react";

export const LightingManagement = () => {
  const [view, setView] = useState<'fixtures' | 'zones' | 'bulk-management' | 'enhanced-creation'>('fixtures');
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
          <Select value={view} onValueChange={(value: 'fixtures' | 'zones' | 'bulk-management' | 'enhanced-creation') => setView(value)}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixtures">Fixtures</SelectItem>
              <SelectItem value="zones">Zones</SelectItem>
              <SelectItem value="enhanced-creation">Enhanced Creation</SelectItem>
              <SelectItem value="bulk-management">Bulk Management</SelectItem>
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
        {view === 'fixtures' && (
          <LightingFixturesList 
            selectedBuilding={selectedBuilding}
            selectedFloor={selectedFloor}
          />
        )}
        
        {view === 'zones' && (
          <LightingZonesList 
            selectedBuilding={selectedBuilding}
            selectedFloor={selectedFloor}
          />
        )}
        
        {view === 'enhanced-creation' && (
          <EnhancedLightingCreation 
            onFixtureCreated={handleFixtureCreated}
          />
        )}
        
        {view === 'bulk-management' && (
          <BulkLightingActions 
            onClearComplete={handleFixtureCreated}
            onImportComplete={handleFixtureCreated}
          />
        )}
      </div>
    </div>
  );
};
