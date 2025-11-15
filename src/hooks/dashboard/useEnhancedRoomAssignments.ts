import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { UserAssignment } from "@/types/dashboard";

export const useEnhancedRoomAssignments = (userId?: string) => {
  const { data: assignedRooms = [], isLoading } = useQuery<UserAssignment[]>({
    queryKey: ['enhancedRoomAssignments', userId],
    queryFn: async () => {
      if (!userId) throw new Error('No user ID available');
      
      console.log('Fetching enhanced room assignments for user:', userId);
      
      try {
        // Get room assignments with priority sorting
        const { data: assignments, error: assignmentsError } = await supabase
          .from('occupant_room_assignments')
          .select(`
            id,
            assigned_at,
            is_primary,
            assignment_type,
            room_id
          `)
          .eq('occupant_id', userId)
          .order('is_primary', { ascending: false }) // Primary rooms first
          .order('assigned_at', { ascending: false });

        if (assignmentsError) {
          console.error('Error fetching room assignments:', assignmentsError);
          return [];
        }

        if (!assignments || assignments.length === 0) {
          console.log('No room assignments found for user');
          return [];
        }

        // Get room details with occupant counts
        const roomIds = assignments.map(a => a.room_id);
        const { data: rooms, error: roomsError } = await supabase
          .from('rooms')
          .select(`
            id,
            name,
            room_number,
            status,
            floor_id
          `)
          .in('id', roomIds);

        if (roomsError) {
          console.error('Error fetching room details:', roomsError);
          return [];
        }

        // Get floor and building information
        const floorIds = rooms?.map(r => r.floor_id).filter(Boolean) || [];
        const { data: floors, error: floorsError } = await supabase
          .from('floors')
          .select(`
            id,
            name,
            building_id
          `)
          .in('id', floorIds);

        if (floorsError) {
          console.error('Error fetching floor details:', floorsError);
          return [];
        }

        // Get building information
        const buildingIds = floors?.map(f => f.building_id).filter(Boolean) || [];
        const { data: buildings, error: buildingsError } = await supabase
          .from('buildings')
          .select(`
            id,
            name
          `)
          .in('id', buildingIds);

        if (buildingsError) {
          console.error('Error fetching building details:', buildingsError);
          return [];
        }

        // Get occupant counts for each room
        const { data: occupantCounts, error: occupantCountsError } = await supabase
          .from('occupant_room_assignments')
          .select('room_id')
          .in('room_id', roomIds);

        if (occupantCountsError) {
          console.error('Error fetching occupant counts:', occupantCountsError);
        }

        // Count occupants per room
        const roomOccupantCounts = roomIds.reduce((acc, roomId) => {
          acc[roomId] = occupantCounts?.filter(oc => oc.room_id === roomId).length || 0;
          return acc;
        }, {} as Record<string, number>);

        // Combine the data
        const formattedAssignments = assignments.map(assignment => {
          const room = rooms?.find(r => r.id === assignment.room_id);
          if (!room) return null;
          
          const floor = floors?.find(f => f.id === room.floor_id);
          const building = buildings?.find(b => b.id === floor?.building_id);
          
          return {
            id: assignment.id,
            room_id: assignment.room_id,
            room_name: room.name || 'Unknown Room',
            room_number: room.room_number || 'N/A',
            floor_id: room.floor_id,
            building_id: floor?.building_id,
            building_name: building?.name || 'Unknown Building',
            floor_name: floor?.name || 'Unknown Floor',
            assigned_at: assignment.assigned_at,
            is_primary: assignment.is_primary,
            assignment_type: assignment.assignment_type,
            room_status: room.status,
            occupant_count: roomOccupantCounts[assignment.room_id] || 0
          };
        }).filter(assignment => assignment !== null);
        
        console.log('Enhanced room assignments:', formattedAssignments);
        
        return formattedAssignments;
      } catch (error) {
        console.error('Error in enhanced room assignments query:', error);
        return [];
      }
    },
    enabled: !!userId,
    staleTime: 60000, // Cache for 1 minute
  });

  // Get primary room
  const primaryRoom = assignedRooms.find(room => room.is_primary);
  
  // Get secondary rooms
  const secondaryRooms = assignedRooms.filter(room => !room.is_primary);

  return { 
    assignedRooms, 
    primaryRoom, 
    secondaryRooms, 
    isLoading,
    totalRooms: assignedRooms.length
  };
};