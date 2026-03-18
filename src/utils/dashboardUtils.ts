// @ts-nocheck
export interface LightingFixture {
  id: string;
  bulb_count: number;
  status: 'working' | 'not_working' | 'maintenance' | 'functional' | 'maintenance_needed' | 'non_functional' | 'pending_maintenance' | 'scheduled_replacement';
}

export interface Room {
  id: string;
  name: string;
  room_number?: string;
  lighting_fixtures?: LightingFixture[];
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

export interface BuildingStats {
  floorCount: number;
  roomCount: number;
  workingFixtures: number;
  totalFixtures: number;
}

const isWorkingStatus = (status: string | null | undefined) => {
  const s = (status ?? '').toString().toLowerCase();
  return s === 'working' || s === 'functional';
};

export const calculateBuildingStats = (building: Record<string, unknown>): BuildingStats => {
  // Add defensive checks
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

  let workingFixtures = 0;
  let totalFixtures = 0;

  building.floors?.forEach(floor => {
    if (floor && floor.rooms) {
      floor.rooms.forEach(room => {
        if (room && room.lighting_fixtures) {
          room.lighting_fixtures.forEach(fixture => {
            if (fixture) {
              const fixtureCount = fixture.bulb_count || 0;
              totalFixtures += fixtureCount;
              if (isWorkingStatus(fixture.status)) {
                workingFixtures += fixtureCount;
              }
            }
          });
        }
      });
    }
  });

  return {
    floorCount,
    roomCount,
    workingFixtures,
    totalFixtures,
  };
};
