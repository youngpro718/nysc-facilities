
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { FormData } from "../types/formTypes";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building, Floor, Room } from "../types/locationTypes";

interface LocationFieldsProps {
  form: UseFormReturn<FormData, any, undefined>;
}

export function LocationFields({ form }: LocationFieldsProps) {
  const { data: buildings } = useQuery<Building[]>({
    queryKey: ['buildings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data as Building[];
    }
  });

  const { data: floors } = useQuery<Floor[]>({
    queryKey: ['floors', form.watch('building_id')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('floors')
        .select('*')
        .eq('building_id', form.watch('building_id'))
        .eq('status', 'active')
        .order('floor_number');
      if (error) throw error;
      return data as Floor[];
    },
    enabled: !!form.watch('building_id'),
  });

  const { data: rooms } = useQuery<Room[]>({
    queryKey: ['rooms', form.watch('floor_id')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('floor_id', form.watch('floor_id'))
        .eq('status', 'active')
        .order('room_number');
      if (error) throw error;
      return data as Room[];
    },
    enabled: !!form.watch('floor_id'),
  });

  return (
    <>
      <FormField
        control={form.control}
        name="building_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Building</FormLabel>
            <Select 
              onValueChange={(value) => {
                field.onChange(value);
                form.setValue('floor_id', undefined);
                form.setValue('room_id', undefined);
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
              onValueChange={(value) => {
                field.onChange(value);
                form.setValue('room_id', undefined);
              }} 
              value={field.value}
              disabled={!form.watch('building_id')}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select floor" />
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
              disabled={!form.watch('floor_id')}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select room" />
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
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
