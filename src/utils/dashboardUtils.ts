
export interface RoomLightingStatus {
  working_fixtures: number;
  total_fixtures: number;
}

export interface Room {
  room_lighting_status?: RoomLightingStatus[];
}

export interface Floor {
  rooms?: Room[];
}

export interface Building {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'maintenance';
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

  const workingFixtures =
    building.floors?.reduce(
      (acc, floor) =>
        acc +
        (floor.rooms?.reduce(
          (roomAcc, room) =>
            roomAcc + (room.room_lighting_status?.[0]?.working_fixtures || 0),
          0
        ) || 0),
      0
    ) || 0;

  const totalFixtures =
    building.floors?.reduce(
      (acc, floor) =>
        acc +
        (floor.rooms?.reduce(
          (roomAcc, room) =>
            roomAcc + (room.room_lighting_status?.[0]?.total_fixtures || 0),
          0
        ) || 0),
      0
    ) || 0;

  return {
    floorCount,
    roomCount,
    workingFixtures,
    totalFixtures,
  };
};
