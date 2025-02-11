
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { FormData } from "../types/IssueTypes";

interface IssueLocationFormProps {
  form: UseFormReturn<FormData>;
  selectedBuilding: string | null;
  selectedFloor: string | null;
  setSelectedBuilding: (building: string | null) => void;
  setSelectedFloor: (floor: string | null) => void;
}

export function IssueLocationForm({
  form,
  selectedBuilding,
  selectedFloor,
  setSelectedBuilding,
  setSelectedFloor,
}: IssueLocationFormProps) {
  const { data: buildings } = useQuery({
    queryKey: ['buildings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: floors } = useQuery({
    queryKey: ['floors', selectedBuilding],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('floors')
        .select('*')
        .eq('building_id', selectedBuilding)
        .eq('status', 'active')
        .order('floor_number');
      if (error) throw error;
      return data;
    },
    enabled: !!selectedBuilding,
  });

  const { data: rooms } = useQuery({
    queryKey: ['rooms', selectedFloor],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('floor_id', selectedFloor)
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!selectedFloor,
  });

  return (
    <div className="space-y-8">
      <FormField
        control={form.control}
        name="building_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base">Select Building</FormLabel>
            <Select
              onValueChange={(value) => {
                field.onChange(value);
                setSelectedBuilding(value);
                setSelectedFloor(null);
                form.setValue('floor_id', undefined);
                form.setValue('room_id', undefined);
              }}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger className="h-14">
                  <SelectValue placeholder="Choose a building" />
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
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="floor_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base">Select Floor</FormLabel>
            <Select
              onValueChange={(value) => {
                field.onChange(value);
                setSelectedFloor(value);
                form.setValue('room_id', undefined);
              }}
              value={field.value}
              disabled={!selectedBuilding}
            >
              <FormControl>
                <SelectTrigger className="h-14">
                  <SelectValue placeholder="Choose a floor" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {floors?.map((floor) => (
                  <SelectItem key={floor.id} value={floor.id}>
                    Floor {floor.floor_number} - {floor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="room_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base">Select Room</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={!selectedFloor}
            >
              <FormControl>
                <SelectTrigger className="h-14">
                  <SelectValue placeholder="Choose a room" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {rooms?.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    Room {room.room_number} - {room.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />
    </div>
  );
}
