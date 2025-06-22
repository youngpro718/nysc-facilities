
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RoomCard } from "./rooms/RoomCard";
import { Room, CourtroomPhotos } from "./rooms/types/RoomTypes";
import { RoomTypeEnum, StatusEnum, StorageTypeEnum } from "./rooms/types/roomEnums";

interface RoomsListProps {
  floorId?: string;
  searchTerm?: string;
  selectedRoomType?: string;
  selectedStatus?: string;
  viewMode?: "grid" | "list";
}

export function RoomsList({ 
  floorId, 
  searchTerm = "", 
  selectedRoomType = "all", 
  selectedStatus = "all",
  viewMode = "grid"
}: RoomsListProps) {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const { data: rooms = [], isLoading, error } = useQuery({
    queryKey: ['rooms', floorId],
    queryFn: async () => {
      let query = supabase
        .from('rooms')
        .select(`
          *,
          floors!inner(
            id,
            name,
            building_id,
            buildings!inner(
              id,
              name
            )
          )
        `);

      if (floorId) {
        query = query.eq('floor_id', floorId);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      // Transform the data to match our Room type
      const transformedRooms: Room[] = (data || []).map(room => ({
        id: room.id,
        name: room.name,
        room_number: room.room_number,
        room_type: room.room_type as RoomTypeEnum,
        status: room.status as StatusEnum,
        description: room.description || "",
        phone_number: room.phone_number,
        is_storage: room.is_storage,
        storage_type: room.storage_type as StorageTypeEnum,
        storage_capacity: room.storage_capacity,
        storage_notes: room.storage_notes,
        parent_room_id: room.parent_room_id,
        current_function: room.current_function,
        floor_id: room.floor_id,
        position: room.position ? (typeof room.position === 'string' ? JSON.parse(room.position) : room.position) : { x: 0, y: 0 },
        size: room.size ? (typeof room.size === 'string' ? JSON.parse(room.size) : room.size) : { width: 150, height: 100 },
        rotation: room.rotation || 0,
        courtroom_photos: room.courtroom_photos ? 
          (typeof room.courtroom_photos === 'string' ? 
            JSON.parse(room.courtroom_photos) as CourtroomPhotos : 
            room.courtroom_photos as CourtroomPhotos) : null,
        created_at: room.created_at,
        updated_at: room.updated_at
      }));

      return transformedRooms;
    },
    enabled: true
  });

  const handleDelete = (id: string) => {
    // Add delete functionality here if needed
    console.log('Delete room:', id);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading rooms...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error loading rooms: {error.message}</div>;
  }

  // Filter rooms based on search and filters
  const filteredRooms = rooms.filter((room) => {
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.room_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedRoomType === "all" || room.room_type === selectedRoomType;
    const matchesStatus = selectedStatus === "all" || room.status === selectedStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  if (filteredRooms.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No rooms found matching your criteria.
      </div>
    );
  }

  return (
    <div className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
      {filteredRooms.map((room) => (
        <RoomCard
          key={room.id}
          room={room}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}

// Default export for compatibility
export default RoomsList;
