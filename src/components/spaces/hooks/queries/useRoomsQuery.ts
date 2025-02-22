
import { useQuery } from "@tanstack/react-query";
import type { Room } from "../../rooms/types/RoomTypes";
import { useToast } from "@/hooks/use-toast";
import { fetchRoomsData, fetchRelatedRoomData } from "./api/roomQueries";
import { transformRoomData } from "./transformers/roomTransformers";
import { 
  createOccupantsLookup, 
  createIssuesLookup, 
  createHistoryLookup, 
  createFixturesLookup 
} from "./utils/roomDataUtils";

interface UseRoomsQueryProps {
  buildingId?: string;
  floorId?: string;
}

export function useRoomsQuery({ buildingId, floorId }: UseRoomsQueryProps = {}) {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['rooms', buildingId, floorId],
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
        { data: fixturesData, error: fixturesError }
      ] = await fetchRelatedRoomData(roomsData.map(room => room.id));

      if (occupantsError || issuesError || historyError || fixturesError) {
        console.error('Error fetching related data:', { occupantsError, issuesError, historyError, fixturesError });
      }

      // Create lookup maps for the related data
      const occupantsByRoomId = createOccupantsLookup(occupantsData || []);
      const issuesByRoomId = createIssuesLookup(issuesData || []);
      const historyByRoomId = createHistoryLookup(historyData || []);
      const fixturesByRoomId = createFixturesLookup(fixturesData || []);

      // Transform the data
      const transformedRooms = transformRoomData(
        roomsData,
        fixturesByRoomId,
        issuesByRoomId,
        historyByRoomId,
        occupantsByRoomId
      );

      console.log("Transformed room data:", transformedRooms);
      return transformedRooms;
    },
    staleTime: 1000 * 60 * 5, // Cache data for 5 minutes
    retry: 2
  });
}
