
import { useState } from "react";

interface LightingZonesListProps {
  selectedBuilding?: string;
  selectedFloor?: string;
}

export function LightingZonesList({ selectedBuilding, selectedFloor }: LightingZonesListProps) {
  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Lighting Zones</h2>
      
      <div className="text-center py-8 text-gray-500">
        No lighting zones found. Create a zone to get started.
      </div>
    </div>
  );
}
