
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { FormData } from "../types/IssueTypes";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface IssueLocationFormProps {
  form: UseFormReturn<FormData>;
  selectedBuilding: string | null;
  selectedFloor: string | null;
  setSelectedBuilding: (value: string | null) => void;
  setSelectedFloor: (value: string | null) => void;
}

export function IssueLocationForm({ 
  form, 
  selectedBuilding, 
  selectedFloor,
  setSelectedBuilding,
  setSelectedFloor 
}: IssueLocationFormProps) {
  const { data: buildings } = useQuery({
    queryKey: ['buildings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('buildings').select('*');
      if (error) throw error;
      return data;
    }
  });

  const { data: floors } = useQuery({
    queryKey: ['floors', selectedBuilding],
    enabled: !!selectedBuilding,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('floors')
        .select('*')
        .eq('building_id', selectedBuilding);
      if (error) throw error;
      return data;
    }
  });

  const { data: rooms } = useQuery({
    queryKey: ['rooms', selectedFloor],
    enabled: !!selectedFloor,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('floor_id', selectedFloor);
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="space-y-4 px-4">
      <FormField
        control={form.control}
        name="building_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base">Building</FormLabel>
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
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Select building" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {buildings?.map((building) => (
                  <SelectItem key={building.id} value={building.id} className="text-base">
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
            <FormLabel className="text-base">Floor</FormLabel>
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
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Select floor" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {floors?.map((floor) => (
                  <SelectItem key={floor.id} value={floor.id} className="text-base">
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
            <FormLabel className="text-base">Room</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              value={field.value}
              disabled={!selectedFloor}
            >
              <FormControl>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {rooms?.map((room) => (
                  <SelectItem key={room.id} value={room.id} className="text-base">
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
