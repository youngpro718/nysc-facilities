
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Room, RoomConnection } from "../rooms/types/RoomTypes";
import { toast } from "sonner";

interface UseRoomDataProps {
  selectedBuilding?: string;
  selectedFloor?: string;
}

export function useRoomData({ selectedBuilding, selectedFloor }: UseRoomDataProps = {}) {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("");

  const { data: rooms, isLoading, isError, error } = useQuery({
    queryKey: ['rooms', selectedBuilding, selectedFloor, filter],
    queryFn: async () => {
      let query = supabase
        .from('rooms')
        .select(`
          *,
          floor:floors(id, name, buildings:building_id(id, name)),
          space_connections(id, connection_type, to_space_id, direction, status, to_space:to_space_id(id, name, type))
        `)
        .eq('status', 'active');

      if (selectedFloor) {
        query = query.eq('floor_id', selectedFloor);
      } else if (selectedBuilding) {
        query = query.eq('floors.building_id', selectedBuilding);
      }

      if (filter) {
        query = query.ilike('name', `%${filter}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching rooms:", error);
        throw error;
      }

      // Apply proper type casting with transformation to match Room interface
      return (data || []).map((room: any): Room => {
        // Transform space connections to match RoomConnection type
        const connections: RoomConnection[] = (room.space_connections || []).map((conn: any) => {
          // Handle the case where to_space might have an error
          let toSpace = null;
          if (conn.to_space && typeof conn.to_space === 'object' && !conn.to_space.error) {
            toSpace = {
              id: conn.to_space.id || '',
              name: conn.to_space.name || '',
              type: conn.to_space.type || ''
            };
          }
          
          return {
            id: conn.id,
            from_space_id: conn.from_space_id || room.id,
            to_space_id: conn.to_space_id,
            connection_type: conn.connection_type,
            direction: conn.direction,
            status: conn.status,
            to_space: toSpace
          };
        });
        
        return {
          ...room,
          space_connections: connections,
          // Ensure proper nesting for floor object
          floor: room.floor ? {
            id: room.floor.id,
            name: room.floor.name,
            building: room.floor.buildings ? {
              id: room.floor.buildings.id,
              name: room.floor.buildings.name
            } : undefined
          } : undefined
        };
      }) as Room[];
    }
  });

  const deleteRoom = async (id: string) => {
    const { error } = await supabase
      .from('rooms')
      .update({ status: 'inactive' })
      .eq('id', id);

    if (error) {
      console.error("Error deleting room:", error);
      throw error;
    }

    return;
  };

  const deleteMutation = useMutation({
    mutationFn: deleteRoom,
    onSuccess: () => {
      toast.success("Room deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
    onError: (error) => {
      toast.error("Failed to delete room");
      console.error("Error deleting room:", error);
    }
  });

  const handleDeleteRoom = (id: string) => {
    deleteMutation.mutate(id);
  };

  return {
    rooms,
    isLoading,
    isError,
    error,
    setFilter,
    deleteRoom: handleDeleteRoom
  };
}
