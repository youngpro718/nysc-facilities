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
import { Building2, Users, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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

interface CurrentOccupant {
  id: string;
  first_name: string;
  last_name: string;
}

export function AssignRoomsDialog({
  open,
  onOpenChange,
  selectedOccupants,
  onSuccess,
}: AssignRoomsDialogProps) {
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>();

  const { data: availableRooms, isLoading: isLoadingRooms } = useQuery({
    queryKey: ["available-rooms"],
    queryFn: async () => {
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('occupant_room_assignments')
        .select('room_id');

      if (assignmentsError) throw assignmentsError;

      const occupancyCounts = (assignmentsData || []).reduce((acc: Record<string, number>, curr) => {
        acc[curr.room_id] = (acc[curr.room_id] || 0) + 1;
        return acc;
      }, {});

      const { data: roomsData, error: roomsError } = await supabase
        .from("rooms")
        .select(`
          id,
          name,
          room_number,
          capacity,
          floors(
            name,
            buildings(name)
          )
        `)
        .eq("status", "active")
        .order("name");

      if (roomsError) throw roomsError;

      return (roomsData || []).map(room => ({
        ...room,
        current_occupancy: occupancyCounts[room.id] || 0
      })) as RoomDetails[];
    },
  });

  const { data: currentOccupants } = useQuery({
    queryKey: ["room-occupants", selectedRoom],
    enabled: !!selectedRoom,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("occupant_room_assignments")
        .select(`
          occupants (
            id,
            first_name,
            last_name
          )
        `)
        .eq("room_id", selectedRoom);

      if (error) throw error;
      return data?.map(d => d.occupants) as CurrentOccupant[];
    }
  });

  const handleAssign = async () => {
    if (!selectedRoom) {
      toast.error("Please select a room to assign");
      return;
    }

    if (!startDate) {
      toast.error("Please select a start date");
      return;
    }

    const selectedRoomDetails = availableRooms?.find(r => r.id === selectedRoom);
    
    if (selectedRoomDetails?.capacity && 
        selectedRoomDetails.current_occupancy + selectedOccupants.length > selectedRoomDetails.capacity) {
      toast.error("This assignment would exceed the room's capacity");
      return;
    }

    try {
      setIsAssigning(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Call the RPC function with proper typing
      const { data, error: batchError } = await supabase.rpc('create_assignment_batch', {
        creator_id: user.id,
        batch_metadata: {
          occupant_count: selectedOccupants.length,
          room_id: selectedRoom
        }
      });

      if (batchError) throw batchError;
      if (!data) throw new Error("Failed to create batch");

      const assignments = selectedOccupants.map((occupantId) => ({
        occupant_id: occupantId,
        room_id: selectedRoom,
        assigned_at: new Date().toISOString(),
        start_date: startDate.toISOString(),
        end_date: endDate?.toISOString() || null,
        batch_id: data,
        is_primary: true,
        approval_status: 'pending'
      }));

      const { error: assignmentError } = await supabase
        .from("occupant_room_assignments")
        .insert(assignments);

      if (assignmentError) throw assignmentError;

      toast.success("Room assignments submitted for approval");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign Rooms to Selected Occupants</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <label className="text-sm font-medium">Select Room</label>
            <Select
              value={selectedRoom}
              onValueChange={setSelectedRoom}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a room" />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="max-h-[300px]">
                  {availableRooms?.map((room) => (
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
          </div>

          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">End Date (Optional)</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => setEndDate(date)}
                    initialFocus
                    disabled={(date) =>
                      date < startDate || date < new Date()
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {selectedRoom && currentOccupants && currentOccupants.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Occupants</label>
              <div className="rounded-md border p-4 space-y-2">
                {currentOccupants.map((occupant) => (
                  <div key={occupant.id} className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{occupant.first_name} {occupant.last_name}</span>
                  </div>
                ))}
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
            disabled={isAssigning || !selectedRoom || !startDate}
          >
            {isAssigning ? "Assigning..." : "Submit for Approval"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
