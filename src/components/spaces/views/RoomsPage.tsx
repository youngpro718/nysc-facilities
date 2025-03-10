
import { useState } from "react";
import { useRoomsQuery } from "../hooks/queries/useRoomsQuery";
import { Room } from "../rooms/types/RoomTypes";
import { RoomsList } from "../RoomsList";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EditSpaceDialog } from "../EditSpaceDialog";
import { useToast } from "@/hooks/use-toast";
import { deleteSpace } from "../services/deleteSpace";

// Define SortOption type for the sorting dropdown
export type SortOption = "name_asc" | "name_desc" | "room_number_asc" | "room_number_desc" | "type_asc" | "type_desc";

interface RoomsPageProps {
  selectedBuilding?: string;
  selectedFloor?: string;
}

export function RoomsPage({ selectedBuilding, selectedFloor }: RoomsPageProps) {
  const { toast } = useToast();
  const [sortOption, setSortOption] = useState<SortOption>("name_asc");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { data: rooms = [], isLoading } = useRoomsQuery({
    buildingId: selectedBuilding !== "all" ? selectedBuilding : undefined,
    floorId: selectedFloor !== "all" ? selectedFloor : undefined,
  });
  
  const sortedRooms = [...rooms].sort((a, b) => {
    if (sortOption === "name_asc") {
      return a.name.localeCompare(b.name);
    }
    if (sortOption === "name_desc") {
      return b.name.localeCompare(a.name);
    }
    if (sortOption === "room_number_asc") {
      return a.room_number.localeCompare(b.room_number);
    }
    if (sortOption === "room_number_desc") {
      return b.room_number.localeCompare(a.room_number);
    }
    if (sortOption === "type_asc") {
      return a.room_type.localeCompare(b.room_type);
    }
    if (sortOption === "type_desc") {
      return b.room_type.localeCompare(a.room_type);
    }
    return 0;
  });

  const handleDeleteRoom = async (id: string) => {
    if (!id) return;
    
    try {
      setIsDeleting(true);
      await deleteSpace(id, 'room');
      toast({
        title: "Room deleted",
        description: "The room has been successfully deleted",
      });
      // Clear selection if the deleted room was selected
      if (selectedRoom?.id === id) {
        setSelectedRoom(null);
      }
    } catch (error) {
      console.error("Error deleting room:", error);
      toast({
        title: "Error",
        description: "Failed to delete room",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h3 className="text-xl font-medium">
          {rooms.length} Room{rooms.length !== 1 ? "s" : ""}
        </h3>
        <div className="flex items-center gap-2">
          <Select 
            value={sortOption} 
            onValueChange={(value: SortOption) => setSortOption(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name_asc">Name (A-Z)</SelectItem>
              <SelectItem value="name_desc">Name (Z-A)</SelectItem>
              <SelectItem value="room_number_asc">Room # (Asc)</SelectItem>
              <SelectItem value="room_number_desc">Room # (Desc)</SelectItem>
              <SelectItem value="type_asc">Type (A-Z)</SelectItem>
              <SelectItem value="type_desc">Type (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <RoomsList
        rooms={sortedRooms}
        isLoading={isLoading}
        onSelectRoom={setSelectedRoom}
        selectedRoomId={selectedRoom?.id}
        onDeleteRoom={handleDeleteRoom}
        isDeleting={isDeleting}
      />

      {selectedRoom && (
        <div className="mt-6 bg-card rounded-lg p-4 border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">{selectedRoom.name}</h3>
            <div className="flex gap-2">
              <EditSpaceDialog 
                id={selectedRoom.id} 
                type="room" 
                initialData={selectedRoom}
              />
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => handleDeleteRoom(selectedRoom.id)}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Room Number</p>
              <p>{selectedRoom.room_number}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="capitalize">{selectedRoom.room_type.replace(/_/g, ' ')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="capitalize">{selectedRoom.status.replace(/_/g, ' ')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Floor</p>
              <p>{selectedRoom.floor?.name}</p>
            </div>
            {selectedRoom.description && (
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Description</p>
                <p>{selectedRoom.description}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
