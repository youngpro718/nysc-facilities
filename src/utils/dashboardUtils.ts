
interface Floor {
  rooms?: Array<{
    room_lighting_status?: Array<{
      working_fixtures: number;
      total_fixtures: number;
    }>;
  }>;
}

interface Building {
  floors?: Floor[];
}

export const calculateBuildingStats = (building: Building) => {
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
