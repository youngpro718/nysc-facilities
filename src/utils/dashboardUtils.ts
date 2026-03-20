export interface Room {
  id: string;
  name: string;
  room_number?: string;
}

export interface Floor {
  id: string;
  name: string;
  floor_number: number;
  rooms?: Room[];
}

export interface Building {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'inactive' | 'under_maintenance';
  floors?: Floor[];
}

export interface BuildingWithLighting extends Building {
  lightingWorkingFixtures?: number;
  lightingTotalFixtures?: number;
  _lightingDebug?: unknown;
}

export interface BuildingStats {
  floorCount: number;
  roomCount: number;
  workingFixtures: number;
  totalFixtures: number;
}

export const calculateBuildingStats = (building: BuildingWithLighting | null | undefined): BuildingStats => {
  if (!building) {
    return {
      floorCount: 0,
      roomCount: 0,
      workingFixtures: 0,
      totalFixtures: 0,
    };
  }

  const floorCount = building.floors?.length || 0;
  const roomCount =
    building.floors?.reduce(
      (acc, floor) => acc + (floor.rooms?.length || 0),
      0
    ) || 0;

  // Calculate fixture counts from building data if available
  const workingFixtures = (building as any).lightingWorkingFixtures || 0;
  const totalFixtures = (building as any).lightingTotalFixtures || 0;

  return {
    floorCount,
    roomCount,
    workingFixtures,
    totalFixtures,
  };
};
