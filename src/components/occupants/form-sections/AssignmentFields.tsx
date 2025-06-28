
import { UseFormReturn } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { OccupantFormData } from "../schemas/occupantSchema";

interface AssignmentFieldsProps {
  form: UseFormReturn<OccupantFormData>;
}

export function AssignmentFields({ form }: AssignmentFieldsProps) {
  // Fetch available rooms
  const { data: rooms } = useQuery({
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

  // Fetch available keys
  const { data: keys } = useQuery({
    queryKey: ["available-keys"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("keys")
        .select("*")
        .eq("status", "available");

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="rooms"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Assigned Rooms</FormLabel>
            <Select
              onValueChange={(value) => {
                const currentRooms = new Set(field.value);
                currentRooms.add(value);
                field.onChange([...currentRooms]);
              }}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select rooms" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {rooms?.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name} - {room.floors?.name}, {room.floors?.buildings?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mt-2 flex flex-wrap gap-2">
              {field.value.map((roomId) => {
                const room = rooms?.find((r) => r.id === roomId);
                return room ? (
                  <div
                    key={roomId}
                    className="flex items-center gap-2 bg-secondary p-2 rounded-md"
                  >
                    <span>{room.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newRooms = field.value.filter((id) => id !== roomId);
                        field.onChange(newRooms);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : null;
              })}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="keys"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Assigned Keys</FormLabel>
            <Select
              onValueChange={(value) => {
                const currentKeys = new Set(field.value);
                currentKeys.add(value);
                field.onChange([...currentKeys]);
              }}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select keys" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {keys?.map((key) => (
                  <SelectItem key={key.id} value={key.id}>
                    {key.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mt-2 flex flex-wrap gap-2">
              {field.value.map((keyId) => {
                const key = keys?.find((k) => k.id === keyId);
                return key ? (
                  <div
                    key={keyId}
                    className="flex items-center gap-2 bg-secondary p-2 rounded-md"
                  >
                    <span>{key.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newKeys = field.value.filter((id) => id !== keyId);
                        field.onChange(newKeys);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : null;
              })}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
