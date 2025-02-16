
import React from "react";
import { useRoomsQuery } from "./hooks/queries/useRoomsQuery";
import { RoomCard } from "./rooms/RoomCard";
import { RoomTable } from "./rooms/RoomTable";
import { Skeleton } from "@/components/ui/skeleton";
import { Room } from "./rooms/types/RoomTypes";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RoomsListProps {
  selectedBuilding: string;
  selectedFloor: string;
}

export default function RoomsList({ selectedBuilding, selectedFloor }: RoomsListProps) {
  const queryClient = useQueryClient();
  const { data: rooms, isLoading } = useRoomsQuery();

  const deleteRoomMutation = useMutation({
    mutationFn: async (roomId: string) => {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success("Room deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const handleDelete = (id: string) => {
    deleteRoomMutation.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[300px]" />
          ))}
        </div>
      </div>
    );
  }

  if (!rooms || rooms.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        No rooms found matching your criteria
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {rooms.map((room) => (
        <RoomCard
          key={room.id}
          room={room}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
