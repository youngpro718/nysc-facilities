
export const createOccupantsLookup = (occupantsData: any[] = []): Record<string, any[]> => {
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

export const createIssuesLookup = (issuesData: any[] = []): Record<string, any[]> => {
  if (!Array.isArray(issuesData)) return {};

  return issuesData.reduce((acc, issue) => {
    if (!acc[issue.room_id]) {
      acc[issue.room_id] = [];
    }
    acc[issue.room_id].push(issue);
    return acc;
  }, {});
};

export const createHistoryLookup = (historyData: any[] = []): Record<string, any[]> => {
  if (!Array.isArray(historyData)) return {};

  return historyData.reduce((acc, history) => {
    if (!acc[history.room_id]) {
      acc[history.room_id] = [];
    }
    acc[history.room_id].push(history);
    return acc;
  }, {});
};

export const createFixturesLookup = (fixturesData: any[] = []): Record<string, any> => {
  if (!Array.isArray(fixturesData)) return {};

  return fixturesData.reduce((acc, fixture) => {
    if (fixture.space_id) {
      acc[fixture.space_id] = fixture;
    }
    return acc;
  }, {});
};
