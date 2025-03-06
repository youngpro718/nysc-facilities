
import { useQuery } from "@tanstack/react-query";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { RoomFormData } from "./RoomFormSchema";

interface ParentRoomFieldProps {
  form: UseFormReturn<RoomFormData>;
  floorId: string;
  currentRoomId?: string;
}

export function ParentRoomField({ form, floorId, currentRoomId }: ParentRoomFieldProps) {
  const { data: parentRooms } = useQuery({
    queryKey: ["parent-rooms", floorId, currentRoomId],
    queryFn: async () => {
      let query = supabase
        .from("rooms")
        .select("id, name, room_number")
        .eq("floor_id", floorId)
        .eq("room_type", "office") // Only offices can be parent rooms
        .order("name");
      
      if (currentRoomId) {
        query = query.neq("id", currentRoomId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!floorId,
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
                  {room.name} ({room.room_number})
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
