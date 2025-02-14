
import { SelectContent, SelectItem, SelectTrigger, SelectValue, Select } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FormDescription } from "@/components/ui/form";

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

interface RoomSelectorProps {
  selectedRoom: string;
  onRoomSelect: (roomId: string) => void;
  availableRooms?: RoomDetails[];
  assignmentType: 'primary_office' | 'work_location' | 'support_space';
  onAssignmentTypeChange: (type: 'primary_office' | 'work_location' | 'support_space') => void;
  isPrimary: boolean;
  onIsPrimaryChange: (value: boolean) => void;
  currentOccupants?: CurrentOccupant[];
}

export function RoomSelector({ 
  selectedRoom, 
  onRoomSelect, 
  availableRooms,
  assignmentType,
  onAssignmentTypeChange,
  isPrimary,
  onIsPrimaryChange,
  currentOccupants 
}: RoomSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label>Assignment Type</Label>
          <Select value={assignmentType} onValueChange={onAssignmentTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select assignment type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="primary_office">Primary Office</SelectItem>
              <SelectItem value="work_location">Work Location</SelectItem>
              <SelectItem value="support_space">Support Space</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {assignmentType === 'work_location' && (
          <div className="flex items-center space-x-2">
            <Switch 
              checked={isPrimary} 
              onCheckedChange={onIsPrimaryChange} 
              id="primary-location"
            />
            <Label htmlFor="primary-location">Set as primary work location</Label>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Select Room</Label>
        <Select value={selectedRoom} onValueChange={onRoomSelect}>
          <SelectTrigger>
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
        
        {currentOccupants && currentOccupants.length > 0 && (
          <FormDescription>
            Current occupants: {currentOccupants.map(o => 
              `${o.first_name} ${o.last_name}`
            ).join(', ')}
          </FormDescription>
        )}
      </div>
    </div>
  );
}
