
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchLightingZones } from "@/services/supabase/lightingService";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateLightingZoneDialog } from "./CreateLightingZoneDialog";
import { PlusCircle } from "lucide-react";

interface LightingZonesListProps {
  selectedBuilding?: string;
  selectedFloor?: string;
}

export function LightingZonesList({ selectedBuilding, selectedFloor }: LightingZonesListProps) {
  const [zoneFilter, setZoneFilter] = useState<string>("all");
  
  // Fetch zones based on selected building and floor
  const { data: zones, isLoading } = useQuery({
    queryKey: ['lighting-zones', selectedBuilding, selectedFloor],
    queryFn: () => fetchLightingZones(selectedBuilding, selectedFloor),
    enabled: !!selectedBuilding || !!selectedFloor
  });
  
  const handleZoneCreated = () => {
    // Refetch zones when a new one is created
  };
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Lighting Zones</h2>
        
        <div className="flex items-center gap-2">
          <Select value={zoneFilter} onValueChange={setZoneFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All zones</SelectItem>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="emergency">Emergency</SelectItem>
              <SelectItem value="restricted">Restricted</SelectItem>
            </SelectContent>
          </Select>
          
          <CreateLightingZoneDialog onZoneCreated={handleZoneCreated} />
        </div>
      </div>
      
      {isLoading ? (
        <div className="py-8 text-center">Loading zones...</div>
      ) : zones && zones.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.map(zone => (
            <Card key={zone.value} className="p-6">
              <h3 className="text-lg font-medium mb-2">{zone.label}</h3>
              <p className="text-sm text-muted-foreground">
                Zone ID: {zone.value.substring(0, 8)}...
              </p>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No lighting zones found. Create a zone to get started.
        </div>
      )}
    </div>
  );
}
