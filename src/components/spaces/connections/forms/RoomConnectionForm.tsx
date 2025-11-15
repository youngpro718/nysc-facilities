import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Direction } from "../types/ConnectionTypes";

interface Space {
  id: string;
  name: string;
  type: string;
  room_number?: string;
}

interface RoomConnectionFormProps {
  form: any;
  availableSpaces: Space[];
  isDisabled?: boolean;
}

export function RoomConnectionForm({
  form,
  availableSpaces,
  isDisabled
}: RoomConnectionFormProps) {
  // Filter spaces to only include rooms
  const availableRooms = availableSpaces.filter(space => 
    space.type.includes("room") || 
    space.type.includes("chamber") || 
    space.type === "office"
  );

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="roomId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Select Room</FormLabel>
            <Select 
              value={field.value} 
              onValueChange={field.onChange}
              disabled={isDisabled}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a room" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {availableRooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name} {room.room_number ? `(${room.room_number})` : ""} - {room.type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="direction"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Direction</FormLabel>
            <Select 
              value={field.value} 
              onValueChange={field.onChange}
              disabled={isDisabled}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select direction" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="north">North</SelectItem>
                <SelectItem value="south">South</SelectItem>
                <SelectItem value="east">East</SelectItem>
                <SelectItem value="west">West</SelectItem>
                <SelectItem value="adjacent">Adjacent</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
