
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface BasicConfigSectionProps {
  form: UseFormReturn<any>;
}

export function BasicConfigSection({ form }: BasicConfigSectionProps) {
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

  const buildingId = form.watch('building_id');

  const { data: floors } = useQuery({
    queryKey: ['floors', buildingId],
    queryFn: async () => {
      if (!buildingId) return [];
      const { data, error } = await supabase
        .from('floors')
        .select('*')
        .eq('building_id', buildingId)
        .eq('status', 'active')
        .order('floor_number');
      if (error) throw error;
      return data;
    },
    enabled: !!buildingId
  });

  const floorId = form.watch('floor_id');

  const { data: spaces } = useQuery({
    queryKey: ['spaces', floorId],
    queryFn: async () => {
      if (!floorId) return [];
      const { data, error } = await supabase
        .from('spaces')
        .select('*')
        .eq('floor_id', floorId)
        .eq('status', 'active');
      if (error) throw error;
      return data;
    },
    enabled: !!floorId
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
              onValueChange={(value) => {
                field.onChange(value);
                form.setValue('floor_id', undefined);
                form.setValue('space_id', undefined);
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
                form.setValue('space_id', undefined);
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
        name="space_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Space</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              value={field.value}
              disabled={!floorId}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select space" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {spaces?.map((space) => (
                  <SelectItem key={space.id} value={space.id}>
                    {space.type === 'room' ? `Room ${space.room_number} - ${space.name}` : space.name}
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
