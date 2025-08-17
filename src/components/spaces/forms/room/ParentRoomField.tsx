import { UseFormReturn } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { RoomFormData } from "./RoomFormSchema";
import { RoomTypeEnum, roomTypeToString } from "../../rooms/types/roomEnums";

// Room types that can be parent rooms (typically larger spaces)
export const PARENT_ROOM_TYPES: RoomTypeEnum[] = [
  RoomTypeEnum.OFFICE,
  RoomTypeEnum.COURTROOM,
  RoomTypeEnum.CHAMBER,
  RoomTypeEnum.JUDGES_CHAMBERS,
  RoomTypeEnum.ADMINISTRATIVE_OFFICE,
  RoomTypeEnum.CONFERENCE_ROOM,
  RoomTypeEnum.RECORDS_ROOM,
];

// Room types that can have parent rooms (typically smaller subdivisions)
export const CAN_HAVE_PARENT_ROOM_TYPES: RoomTypeEnum[] = [
  RoomTypeEnum.OFFICE,
  RoomTypeEnum.ADMINISTRATIVE_OFFICE,
  RoomTypeEnum.BREAK_ROOM,
  RoomTypeEnum.IT_ROOM,
  RoomTypeEnum.UTILITY_ROOM,
  RoomTypeEnum.CONFERENCE,
  RoomTypeEnum.CONFERENCE_ROOM,
  RoomTypeEnum.RECORDS_ROOM,
  RoomTypeEnum.FILING_ROOM,
];

interface ParentRoomFieldProps {
  form: UseFormReturn<RoomFormData>;
  floorId: string;
  currentRoomId?: string; // To prevent self-selection during edit
}

export function ParentRoomField({ form, floorId, currentRoomId }: ParentRoomFieldProps) {
  const roomType = form.watch("roomType");
  
  // Only show parent room field for room types that can have parents
  const canHaveParent = CAN_HAVE_PARENT_ROOM_TYPES.includes(roomType as RoomTypeEnum);
  
  const { data: potentialParents, isLoading } = useQuery({
    queryKey: ["potential-parent-rooms", floorId, currentRoomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('id, name, room_number, room_type')
        .eq('floor_id', floorId)
        .neq('id', currentRoomId || '') // Exclude current room if editing
        .in('room_type', PARENT_ROOM_TYPES.map(type => roomTypeToString(type)))
        .eq('status', 'active')
        .order('room_number');
        
      if (error) throw error;
      return data || [];
    },
    enabled: canHaveParent && !!floorId,
  });

  if (!canHaveParent) {
    return null;
  }

  return (
    <FormField
      control={form.control}
      name="parentRoomId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Office Suite (Optional)</FormLabel>
          <Select
            onValueChange={(value) => field.onChange(value === 'none' ? null : value)}
            value={field.value || 'none'}
            disabled={isLoading}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select an office suite..." />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="none">No office suite</SelectItem>
              {potentialParents?.map((room) => (
                <SelectItem key={room.id} value={room.id}>
                  {room.room_number} - {room.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormDescription>
            Select an office suite if this is a sub room or subdivision of a larger space.
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}