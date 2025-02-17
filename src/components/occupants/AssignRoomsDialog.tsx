
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Building2, Loader2, Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";

interface AssignRoomsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOccupants: string[];
  onSuccess: () => void;
}

interface RoomDetails {
  id: string;
  name: string;
  room_number: string;
  capacity: number | null;
  current_occupancy: number;
  floors: {
    name: string;
    buildings: {
      name: string;
    };
  } | null;
}

interface SpaceSelectItem {
  id: string;
  name: string;
  room_number: string;
  capacity: number | null;
  current_occupancy: number;
  floors: RoomDetails['floors'];
}

interface CurrentOccupant {
  id: string;
  first_name: string;
  last_name: string;
  is_primary: boolean;
}

interface OccupantAssignmentResponse {
  is_primary: boolean;
  occupant: {
    id: string;
    first_name: string;
    last_name: string;
  }
}

function generateSpaceSelectItem(room: RoomDetails): SpaceSelectItem {
  return {
    id: room.id,
    name: room.name,
    room_number: room.room_number,
    capacity: room.capacity ?? null,
    current_occupancy: room.current_occupancy ?? 0,
    floors: room.floors
  };
}

export function AssignRoomsDialog({
  open,
  onOpenChange,
  selectedOccupants,
  onSuccess,
}: AssignRoomsDialogProps) {
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [isPrimaryAssignment, setIsPrimaryAssignment] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: availableRooms, isLoading: isLoadingRooms } = useQuery({
    queryKey: ["available-rooms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select(`
          id,
          name,
          room_number,
          capacity,
          current_occupancy,
          floors (
            name,
            buildings (
              name
            )
          )
        `)
        .eq("status", "active")
        .order("name");

      if (error) throw error;
      return (data || []) as RoomDetails[];
    },
  });

  const { data: currentOccupants, isLoading: isLoadingOccupants } = useQuery({
    queryKey: ["room-occupants", selectedRoom],
    enabled: !!selectedRoom,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("occupant_room_assignments")
        .select(`
          is_primary,
          occupant:occupants (
            id,
            first_name,
            last_name
          )
        `)
        .eq("room_id", selectedRoom);

      if (error) throw error;
      
      if (!data) return [];

      return data.map((assignment: OccupantAssignmentResponse) => ({
        id: assignment.occupant.id,
        first_name: assignment.occupant.first_name,
        last_name: assignment.occupant.last_name,
        is_primary: assignment.is_primary
      })) as CurrentOccupant[];
    }
  });

  const { data: existingPrimaryAssignments } = useQuery({
    queryKey: ["primary-assignments", selectedOccupants],
    enabled: isPrimaryAssignment,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("occupant_room_assignments")
        .select("occupant_id")
        .in("occupant_id", selectedOccupants)
        .eq("is_primary", true);

      if (error) throw error;
      return data;
    }
  });

  const filteredRooms = availableRooms?.filter(room => {
    const searchStr = searchQuery.toLowerCase();
    return (
      room.name.toLowerCase().includes(searchStr) ||
      room.room_number.toLowerCase().includes(searchStr) ||
      room.floors?.name.toLowerCase().includes(searchStr) ||
      room.floors?.buildings?.name.toLowerCase().includes(searchStr)
    );
  });

  const handleAssign = async () => {
    if (!selectedRoom) {
      toast.error("Please select a room to assign");
      return;
    }

    const selectedRoomDetails = availableRooms?.find(r => r.id === selectedRoom);
    
    if (selectedRoomDetails?.capacity && 
        selectedRoomDetails.current_occupancy + selectedOccupants.length > selectedRoomDetails.capacity) {
      toast.error("This assignment would exceed the room's capacity");
      return;
    }

    if (isPrimaryAssignment && existingPrimaryAssignments?.length) {
      toast.error("Some selected occupants already have primary room assignments");
      return;
    }

    try {
      setIsAssigning(true);

      const assignments = selectedOccupants.map((occupantId) => ({
        occupant_id: occupantId,
        room_id: selectedRoom,
        assigned_at: new Date().toISOString(),
        is_primary: isPrimaryAssignment
      }));

      const { error: assignmentError } = await supabase
        .from("occupant_room_assignments")
        .insert(assignments);

      if (assignmentError) throw assignmentError;

      toast.success(`Room${selectedOccupants.length > 1 ? 's' : ''} assigned successfully`);
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to assign rooms");
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Assign Room{selectedOccupants.length > 1 ? 's' : ''} to {selectedOccupants.length} Occupant{selectedOccupants.length > 1 ? 's' : ''}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <label className="text-sm font-medium">Search and Select Room</label>
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search rooms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select
              value={selectedRoom}
              onValueChange={setSelectedRoom}
              disabled={isLoadingRooms}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={isLoadingRooms ? "Loading rooms..." : "Select a room"} />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="max-h-[300px]">
                  {filteredRooms?.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      <div className="flex items-center justify-between w-full pr-4">
                        <span>
                          {room.name} - {room.floors?.name}, {room.floors?.buildings?.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            !room.capacity ? "secondary" :
                            room.current_occupancy >= room.capacity ? "destructive" :
                            room.current_occupancy >= room.capacity * 0.8 ? "outline" :
                            "default"
                          }>
                            <Users className="w-3 h-3 mr-1" />
                            {room.current_occupancy}{room.capacity ? `/${room.capacity}` : ''}
                          </Badge>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Primary Assignment</label>
              <Select
                value={isPrimaryAssignment ? "yes" : "no"}
                onValueChange={(value) => setIsPrimaryAssignment(value === "yes")}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedRoom && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Occupants</label>
              <div className="rounded-md border p-4 space-y-2">
                {isLoadingOccupants ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading occupants...
                  </div>
                ) : currentOccupants && currentOccupants.length > 0 ? (
                  currentOccupants.map((occupant) => (
                    <div key={occupant.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{occupant.first_name} {occupant.last_name}</span>
                      </div>
                      {occupant.is_primary && (
                        <Badge variant="outline">Primary</Badge>
                      )}
                    </div>
                  ))
                ) : (
                  <span className="text-muted-foreground">No current occupants</span>
                )}
              </div>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            Selected occupants: {selectedOccupants.length}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAssign} 
            disabled={isAssigning || !selectedRoom}
          >
            {isAssigning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <Building2 className="mr-2 h-4 w-4" />
                Assign Room{selectedOccupants.length > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
