// @ts-nocheck
export const createOccupantsLookup = (occupantsData: unknown[] = []): Record<string, unknown[]> => {
  if (!Array.isArray(occupantsData)) return {};
  
  return occupantsData.reduce((acc, assignment) => {
    if (!acc[assignment.room_id]) {
      acc[assignment.room_id] = [];
    }
    if (assignment.occupant) {
      acc[assignment.room_id].push({
        first_name: assignment.occupant.first_name,
        last_name: assignment.occupant.last_name,
        title: assignment.occupant.title
      });
    }
    return acc;
  }, {});
};

export const createIssuesLookup = (issuesData: unknown[] = []): Record<string, unknown[]> => {
  if (!Array.isArray(issuesData)) return {};

  return issuesData.reduce((acc, issue) => {
    if (!acc[issue.room_id]) {
      acc[issue.room_id] = [];
    }
    acc[issue.room_id].push(issue);
    return acc;
  }, {});
};

export const createHistoryLookup = (historyData: unknown[] = []): Record<string, unknown[]> => {
  if (!Array.isArray(historyData)) return {};

  return historyData.reduce((acc, history) => {
    if (!acc[history.room_id]) {
      acc[history.room_id] = [];
    }
    acc[history.room_id].push(history);
    return acc;
  }, {});
};

export const createFixturesLookup = (fixturesData: unknown[] = []): Record<string, unknown> => {
  if (!Array.isArray(fixturesData)) return {};

  return fixturesData.reduce((acc, fixture) => {
    if (fixture.space_id) {
      acc[fixture.space_id] = fixture;
    }
    return acc;
  }, {});
};

export const createConnectionsLookup = (connectionsData: unknown[] = []): Record<string, unknown[]> => {
  if (!Array.isArray(connectionsData)) return {};

  return connectionsData.reduce((acc, connection) => {
    // For from_space connections
    if (!acc[connection.from_space_id]) {
      acc[connection.from_space_id] = [];
    }
    
    // Add connection with direction 
    acc[connection.from_space_id].push({
      id: connection.id,
      connection_type: connection.connection_type,
      direction: connection.direction,
      from_space_id: connection.from_space_id,
      to_space_id: connection.to_space_id,
      to_space: connection.to_space
    });
    
    return acc;
  }, {});
};
