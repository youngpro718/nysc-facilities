
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRooms } from "@/hooks/useRooms";
import { Loader2 } from "lucide-react";
import { FormValues } from "../types";

interface RoomSelectionFieldsProps {
  form: UseFormReturn<FormValues>;
}

export function RoomSelectionFields({ form }: RoomSelectionFieldsProps) {
  const { data: rooms, isLoading: roomsLoading } = useRooms();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FormField
        control={form.control}
        name="original_room_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Original Room</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={roomsLoading ? "Loading rooms..." : "Select room"} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {roomsLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : rooms?.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    Room {room.room_number} - {room.floors.buildings.name}, {room.floors.name}
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
        name="temporary_room_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Temporary Room</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={roomsLoading ? "Loading rooms..." : "Select room"} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {roomsLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : rooms?.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    Room {room.room_number} - {room.floors.buildings.name}, {room.floors.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

