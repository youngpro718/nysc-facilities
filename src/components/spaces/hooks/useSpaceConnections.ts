
import { useConnectionQueries } from "./queries/useConnectionQueries";
import { useConnectionMutations } from "./mutations/useConnectionMutations";

export function useSpaceConnections(spaceId: string, spaceType: "room" | "hallway" | "door") {
  const { data: connections, isLoading: isLoadingConnections } = useConnectionQueries(spaceId, spaceType);
  const { 
    deleteConnection, 
    isDeletingConnection,
    createConnection,
    isCreatingConnection 
  } = useConnectionMutations(spaceType);

  return {
    connections,
    isLoadingConnections,
    deleteConnection,
    isDeletingConnection,
    createConnection,
    isCreatingConnection
  };
}
