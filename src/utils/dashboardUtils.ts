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

export interface RoomLightingStatus {
  room_id: string;
  room_name: string;
  room_number: string | null;
  total_fixtures: number;
  working_fixtures: number;
  non_working_fixtures: number;
}

const isWorkingStatus = (status: string) => {
  return status === 'working' || status === 'functional';
};

export const calculateRoomLightingStatus = (room: Room): RoomLightingStatus => {
  const total_fixtures = room.lighting_fixtures?.length || 0;
  const working_fixtures = room.lighting_fixtures?.filter(fixture => isWorkingStatus(fixture.status)).length || 0;
  const non_working_fixtures = total_fixtures - working_fixtures;

  return {
    room_id: room.id,
    room_name: room.name,
    room_number: room.room_number || null,
    total_fixtures,
    working_fixtures,
    non_working_fixtures
  };
};

export const calculateBuildingStats = (building: any): BuildingStats => {
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
