import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { RoomTable } from "../rooms/RoomTable";
import { CreateSpaceDialog } from "../CreateSpaceDialog";
import { useToast } from "@/hooks/use-toast";
import { deleteSpace } from "../services/deleteSpace";
import { Room } from "../rooms/types/RoomTypes";
import { SortOption } from '../types/sortTypes';

export default function RoomsPage() {
  const [sortOption, setSortOption] = useState<SortOption>("room_number_asc");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: rooms, isLoading, isError } = useQuery({
    queryKey: ["rooms"],
    queryFn: () => {
      // Simulate API call with sorting and searching
      return new Promise<Room[]>((resolve) => {
        setTimeout(() => {
          const mockRooms: Room[] = [
            {
              id: "1",
              name: "Room 101",
              room_number: "101",
              room_type: "office",
              status: "active",
              floor_id: "1",
              created_at: "2024-01-01",
              updated_at: "2024-01-01",
            },
            {
              id: "2",
              name: "Meeting Room A",
              room_number: "201",
              room_type: "meeting",
              status: "inactive",
              floor_id: "2",
              created_at: "2024-01-01",
              updated_at: "2024-01-01",
            },
          ] as any[];

          let sortedRooms = [...mockRooms];

          if (sortOption === "room_number_asc") {
            sortedRooms.sort((a, b) => a.room_number.localeCompare(b.room_number));
          } else if (sortOption === "room_number_desc") {
            sortedRooms.sort((a, b) => b.room_number.localeCompare(a.room_number));
          }

          const searchedRooms = sortedRooms.filter((room) =>
            room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            room.room_number.toLowerCase().includes(searchQuery.toLowerCase())
          );

          resolve(searchedRooms);
        }, 500);
      });
    },
  });

  const deleteRoomMutation = useMutation({
    mutationFn: deleteSpace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast({
        title: "Success",
        description: "Room deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete room: ${error}`,
        variant: "destructive",
      });
    },
  });

  const handleSortChange = (value: string) => {
    setSortOption(value as SortOption);
  };

  const handleDelete = async (id: string) => {
    await deleteRoomMutation.mutateAsync(id);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error fetching rooms.</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Input
          type="text"
          placeholder="Search rooms..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Select onValueChange={handleSortChange} value={sortOption}>
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="room_number_asc">Room Number (Asc)</SelectItem>
            <SelectItem value="room_number_desc">Room Number (Desc)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <RoomTable rooms={rooms || []} onDelete={handleDelete} />
    </div>
  );
}
