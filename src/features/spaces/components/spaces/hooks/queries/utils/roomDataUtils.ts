export const createOccupantsLookup = (occupantsData: any[] = []): Record<string, any[]> => {
  if (!Array.isArray(occupantsData)) return {};
  
  return occupantsData.reduce((acc: Record<string, any[]>, assignment: any) => {
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

export const createIssuesLookup = (issuesData: any[] = []): Record<string, any[]> => {
  if (!Array.isArray(issuesData)) return {};

  return issuesData.reduce((acc: Record<string, any[]>, issue: any) => {
    if (!acc[issue.room_id]) {
      acc[issue.room_id] = [];
    }
    acc[issue.room_id].push(issue);
    return acc;
  }, {});
};

export const createHistoryLookup = (historyData: any[] = []): Record<string, any[]> => {
  if (!Array.isArray(historyData)) return {};

  return historyData.reduce((acc: Record<string, any[]>, history: any) => {
    if (!acc[history.room_id]) {
      acc[history.room_id] = [];
    }
    acc[history.room_id].push(history);
    return acc;
  }, {});
};

export const createFixturesLookup = (fixturesData: any[] = []): Record<string, any> => {
  if (!Array.isArray(fixturesData)) return {};

  return fixturesData.reduce((acc: Record<string, any>, fixture: any) => {
    if (fixture.space_id) {
      acc[fixture.space_id] = fixture;
    }
    return acc;
  }, {});
};

export const createConnectionsLookup = (connectionsData: any[] = []): Record<string, any[]> => {
  if (!Array.isArray(connectionsData)) return {};

  return connectionsData.reduce((acc: Record<string, any[]>, connection: any) => {
    if (!acc[connection.from_space_id]) {
      acc[connection.from_space_id] = [];
    }
    
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
