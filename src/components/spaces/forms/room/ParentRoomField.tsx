
import { useQuery } from "@tanstack/react-query";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { RoomFormData } from "./RoomFormSchema";
import { RoomTypeEnum } from "../../rooms/types/roomEnums";

// Define which room types can be parents
export const PARENT_ROOM_TYPES = [
  RoomTypeEnum.OFFICE,
  RoomTypeEnum.STORAGE,
  RoomTypeEnum.UTILITY
];

// Define which room types can have parents
export const CAN_HAVE_PARENT_ROOM_TYPES = [
  RoomTypeEnum.OFFICE,
  RoomTypeEnum.RECEPTION,
  RoomTypeEnum.MEETING,
  RoomTypeEnum.STORAGE
];

interface ParentRoomFieldProps {
  form: UseFormReturn<RoomFormData>;
  floorId: string;
  currentRoomId?: string;
}

export function ParentRoomField({ form, floorId, currentRoomId }: ParentRoomFieldProps) {
  const roomType = form.watch("roomType");
  
  // Determine if this room type can have a parent
  const canHaveParent = CAN_HAVE_PARENT_ROOM_TYPES.includes(roomType);
  
  // If this room type can't have a parent, return null
  if (!canHaveParent) {
    // Clear parent room value if it was previously set
    if (form.getValues("parentRoomId")) {
      form.setValue("parentRoomId", undefined);
    }
    return null;
  }

  // Convert enum values to simple strings for the Supabase query
  const parentRoomTypeStrings = PARENT_ROOM_TYPES.map(type => type.toString());

  const { data: parentRooms, isLoading } = useQuery({
    queryKey: ["parent-rooms", floorId, currentRoomId, roomType],
    queryFn: async () => {
      let query = supabase
        .from("rooms")
        .select("id, name, room_number, room_type")
        .eq("floor_id", floorId)
        .in("room_type", parentRoomTypeStrings as any) // Use type assertion here
        .order("name");
      
      if (currentRoomId) {
        query = query.neq("id", currentRoomId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!floorId && canHaveParent,
  });

  return (
    <FormField
      control={form.control}
      name="parentRoomId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Parent Room (Optional)</FormLabel>
          <Select 
            onValueChange={(value) => field.onChange(value === "none" ? null : value)} 
            value={field.value || "none"}
            disabled={isLoading}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select a parent room (optional)" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {parentRooms?.map((room) => (
                <SelectItem key={room.id} value={room.id}>
                  {room.name} ({room.room_number}) - {room.room_type.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
