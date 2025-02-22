export interface LightingFixture {
  id: string;
  bulb_count: number;
  status: 'working' | 'not_working';
}

export interface Room {
  id: string;
  name: string;
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

export const calculateBuildingStats = (building: Building): BuildingStats => {
  const floorCount = building.floors?.length || 0;
  const roomCount =
    building.floors?.reduce(
      (acc, floor) => acc + (floor.rooms?.length || 0),
      0
    ) || 0;

  let workingFixtures = 0;
  let totalFixtures = 0;

  building.floors?.forEach(floor => {
    floor.rooms?.forEach(room => {
      room.lighting_fixtures?.forEach(fixture => {
        const fixtureCount = fixture.bulb_count || 0;
        totalFixtures += fixtureCount;
        if (fixture.status === 'working') {
          workingFixtures += fixtureCount;
        }
      });
    });
  });

  return {
    floorCount,
    roomCount,
    workingFixtures,
    totalFixtures,
  };
};
