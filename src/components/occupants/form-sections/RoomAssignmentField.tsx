
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import type { OccupantFormData } from "../schemas/occupantSchema";

interface RoomAssignmentFieldProps {
  form: UseFormReturn<OccupantFormData>;
}

export function RoomAssignmentField({ form }: RoomAssignmentFieldProps) {
  const { data: availableRooms, isLoading: isLoadingRooms } = useQuery({
    queryKey: ["available-rooms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select(`
          *,
          floors!rooms_floor_id_fkey (
            name,
            buildings!floors_building_id_fkey (
              name
            )
          )
        `)
        .eq("status", "active");

      if (error) throw error;
      return data;
    },
  });

  const handleRoomAdd = (roomId: string) => {
    const currentRooms = form.getValues("rooms");
    if (!currentRooms.includes(roomId)) {
      form.setValue("rooms", [...currentRooms, roomId]);
    }
  };

  const handleRoomRemove = (roomId: string) => {
    const currentRooms = form.getValues("rooms");
    form.setValue("rooms", currentRooms.filter(id => id !== roomId));
  };

  return (
    <FormField
      control={form.control}
      name="rooms"
      render={() => (
        <FormItem>
          <FormLabel>Room Assignments</FormLabel>
          <Select
            onValueChange={handleRoomAdd}
            disabled={isLoadingRooms}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={isLoadingRooms ? "Loading rooms..." : "Select rooms to assign"} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {availableRooms?.map((room) => (
                <SelectItem key={room.id} value={room.id}>
                  {room.name} - {room.floors?.name}, {room.floors?.buildings?.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-2 mt-2">
            {form.getValues("rooms").map((roomId) => {
              const room = availableRooms?.find(r => r.id === roomId);
              return (
                <Badge key={roomId} variant="secondary" className="flex items-center gap-1">
                  {room?.name}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => handleRoomRemove(roomId)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              );
            })}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
