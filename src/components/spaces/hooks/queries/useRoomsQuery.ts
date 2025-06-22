
import { useQuery } from "@tanstack/react-query";
import { Room } from "../types/RoomTypes";
import { useToast } from "@/hooks/use-toast";
import { fetchRoomsData, fetchRelatedRoomData } from "./api/roomQueries";
import { transformRoomData } from "./transformers/roomTransformers";
import { 
  createOccupantsLookup, 
  createIssuesLookup, 
  createHistoryLookup, 
  createFixturesLookup,
  createConnectionsLookup
} from "./utils/roomDataUtils";

interface UseRoomsQueryProps {
  buildingId?: string;
  floorId?: string;
}

export function useRoomsQuery({ buildingId, floorId }: UseRoomsQueryProps = {}) {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['rooms', buildingId, floorId], // Include filters in query key
    queryFn: async () => {
      console.log("Fetching rooms data with filters:", { buildingId, floorId });
      
      const { data: roomsData, error: roomsError } = await fetchRoomsData(buildingId, floorId);

      if (roomsError) {
        console.error('Error fetching rooms:', roomsError);
        toast({
          title: "Error",
          description: "Failed to fetch rooms. Please try again.",
          variant: "destructive",
        });
        throw roomsError;
      }

      if (!roomsData || roomsData.length === 0) return [];

      // Fetch additional data in parallel
      const [
        { data: occupantsData, error: occupantsError },
        { data: issuesData, error: issuesError },
        { data: historyData, error: historyError },
        { data: fixturesData, error: fixturesError },
        { data: connectionsData, error: connectionsError }
      ] = await fetchRelatedRoomData(roomsData.map(room => room.id));

      if (occupantsError || issuesError || historyError || fixturesError || connectionsError) {
        console.error('Error fetching related data:', { 
          occupantsError, 
          issuesError, 
          historyError, 
          fixturesError,
          connectionsError
        });
        // Continue with partial data but log the errors
      }

      console.log("Connections data:", connectionsData);

      // Create lookup maps for the related data
      const occupantsByRoomId = createOccupantsLookup(occupantsData || []);
      const issuesByRoomId = createIssuesLookup(issuesData || []);
      const historyByRoomId = createHistoryLookup(historyData || []);
      const fixturesByRoomId = createFixturesLookup(fixturesData || []);
      const connectionsByRoomId = createConnectionsLookup(connectionsData || []);

      // Transform the data
      const transformedRooms = transformRoomData(
        roomsData,
        fixturesByRoomId,
        issuesByRoomId,
        historyByRoomId,
        occupantsByRoomId,
        connectionsByRoomId
      );

      console.log("Transformed room data:", transformedRooms);
      return transformedRooms;
    },
    staleTime: 1000 * 60 * 5, // Cache data for 5 minutes
    retry: 2
  });
}
