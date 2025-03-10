
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Room } from "../rooms/types/RoomTypes";
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

      return data as Room[];
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
