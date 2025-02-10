
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { FormData } from "../../types/IssueTypes";

interface LocationSelectionProps {
  form: UseFormReturn<FormData>;
}

export function LocationSelection({ form }: LocationSelectionProps) {
  const { data: buildings } = useQuery({
    queryKey: ["buildings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("buildings").select("*");
      if (error) throw error;
      return data;
    },
  });

  const buildingId = form.watch("building_id");

  const { data: floors } = useQuery({
    queryKey: ["floors", buildingId],
    enabled: !!buildingId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("floors")
        .select("*")
        .eq("building_id", buildingId);
      if (error) throw error;
      return data;
    },
  });

  const floorId = form.watch("floor_id");

  const { data: rooms } = useQuery({
    queryKey: ["rooms", floorId],
    enabled: !!floorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("floor_id", floorId);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="building_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Building</FormLabel>
            <Select
              onValueChange={value => {
                field.onChange(value);
                form.setValue("floor_id", undefined);
                form.setValue("room_id", undefined);
              }}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select building" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {buildings?.map((building) => (
                  <SelectItem key={building.id} value={building.id}>
                    {building.name}
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
        name="floor_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Floor</FormLabel>
            <Select
              onValueChange={value => {
                field.onChange(value);
                form.setValue("room_id", undefined);
              }}
              value={field.value}
              disabled={!buildingId}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select floor" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {floors?.map((floor) => (
                  <SelectItem key={floor.id} value={floor.id}>
                    {floor.name}
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
        name="room_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Room</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={!floorId}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {rooms?.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name}
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
