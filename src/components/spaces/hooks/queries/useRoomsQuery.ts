import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Room, StorageType, RoomType } from "../../rooms/types/RoomTypes";
import { useToast } from "@/hooks/use-toast";

export function useRoomsQuery() {
  const { toast } = useToast();

  return useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      console.log("Fetching rooms data...");
      
      // First, fetch basic room data with essential relations
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select(`
          id,
          name,
          room_number,
          room_type,
          description,
          status,
          floor_id,
          parent_room_id,
          is_storage,
          storage_capacity,
          storage_type,
          storage_notes,
          phone_number,
          created_at,
          current_function,
          previous_functions,
          function_change_date,
          floors:floor_id (
            name,
            buildings:building_id (
              id,
              name
            )
          ),
          parent_room:parent_room_id (
            name
          )
        `);

      if (roomsError) {
        console.error('Error fetching rooms:', roomsError);
        toast({
          title: "Error",
          description: "Failed to fetch rooms. Please try again.",
          variant: "destructive",
        });
        throw roomsError;
      }

      if (!roomsData) return [];

      // Fetch additional data in parallel
      const [
        { data: occupantsData, error: occupantsError },
        { data: issuesData, error: issuesError },
        { data: historyData, error: historyError },
        { data: fixturesData, error: fixturesError }
      ] = await Promise.all([
        // Fetch occupants
        supabase
          .from('occupant_room_assignments')
          .select(`
            room_id,
            assignment_type,
            is_primary,
            schedule,
            occupant:occupant_id (
              first_name,
              last_name,
              title
            )
          `)
          .in('room_id', roomsData.map(room => room.id)),

        // Fetch issues
        supabase
          .from('issues')
          .select('id, title, status, type, priority, created_at, room_id')
          .in('room_id', roomsData.map(room => room.id)),

        // Fetch room history
        supabase
          .from('room_history')
          .select('room_id, change_type, previous_values, new_values, created_at')
          .in('room_id', roomsData.map(room => room.id)),

        // Fetch lighting fixtures
        supabase
          .from('lighting_fixture_details')
          .select('*')
          .in('space_id', roomsData.map(room => room.id))
      ]);

      if (occupantsError || issuesError || historyError || fixturesError) {
        console.error('Error fetching related data:', { occupantsError, issuesError, historyError, fixturesError });
      }

      // Create lookup maps for the related data
      const occupantsByRoomId = (occupantsData || []).reduce((acc, assignment) => {
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
      }, {} as Record<string, any[]>);

      const issuesByRoomId = (issuesData || []).reduce((acc, issue) => {
        if (!acc[issue.room_id]) {
          acc[issue.room_id] = [];
        }
        acc[issue.room_id].push(issue);
        return acc;
      }, {} as Record<string, any[]>);

      const historyByRoomId = (historyData || []).reduce((acc, history) => {
        if (!acc[history.room_id]) {
          acc[history.room_id] = [];
        }
        acc[history.room_id].push(history);
        return acc;
      }, {} as Record<string, any[]>);

      const fixturesByRoomId = (fixturesData || []).reduce((acc, fixture) => {
        if (fixture.space_id) {
          acc[fixture.space_id] = fixture;
        }
        return acc;
      }, {} as Record<string, any>);

      // Transform the data
      const transformedRooms: Room[] = roomsData.map(room => ({
        ...room,
        room_type: room.room_type as RoomType,
        storage_type: room.storage_type ? (room.storage_type as StorageType) : null,
        lighting_fixture: fixturesByRoomId[room.id] ? {
          id: fixturesByRoomId[room.id].id,
          type: fixturesByRoomId[room.id].type,
          status: fixturesByRoomId[room.id].status,
          technology: fixturesByRoomId[room.id].technology,
          electrical_issues: fixturesByRoomId[room.id].electrical_issues,
          ballast_issue: fixturesByRoomId[room.id].ballast_issue,
          maintenance_notes: fixturesByRoomId[room.id].maintenance_notes
        } : null,
        space_connections: [],
        issues: (issuesByRoomId[room.id] || []).map(issue => ({
          id: issue.id,
          title: issue.title,
          status: issue.status,
          type: issue.type,
          priority: issue.priority,
          created_at: issue.created_at
        })),
        room_history: historyByRoomId[room.id] || [],
        current_occupants: occupantsByRoomId[room.id] || []
      }));

      console.log("Transformed room data:", transformedRooms);
      return transformedRooms;
    },
    staleTime: 1000 * 60 * 5, // Cache data for 5 minutes
    retry: 2
  });
}
