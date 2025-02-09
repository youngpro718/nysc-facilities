
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { LightingFixtureFormData } from "../schemas/lightingSchema";
import { Space } from "../types";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { generateFixtureName } from "../schemas/lightingSchema";
import { useEffect } from "react";

interface BasicSettingsFieldsProps {
  form: UseFormReturn<LightingFixtureFormData>;
  onSpaceOrPositionChange?: () => void;
}

export function BasicSettingsFields({ form, onSpaceOrPositionChange }: BasicSettingsFieldsProps) {
  const { data: spaces } = useQuery({
    queryKey: ['spaces'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spaces')
        .select('*');
      if (error) throw error;
      return data as Space[];
    }
  });

  const spaceId = form.watch('space_id');
  const position = form.watch('position');
  const spaceType = form.watch('space_type');

  useEffect(() => {
    updateName();
  }, [spaceId, position, spaceType]);

  const updateName = async () => {
    if (spaceId && position && spaces) {
      const space = spaces.find(s => s.id === spaceId);
      if (space) {
        try {
          const { data: sequenceData, error } = await supabase
            .rpc('get_next_lighting_sequence', {
              p_space_id: spaceId
            });
          
          if (error) {
            console.error('Error getting sequence:', error);
            return;
          }

          const sequence = typeof sequenceData === 'number' ? sequenceData : 1;
          
          const name = generateFixtureName(
            space.space_type as 'room' | 'hallway',
            space.name,
            space.room_number,
            position,
            sequence
          );

          form.setValue('name', name, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true
          });

          onSpaceOrPositionChange?.();
        } catch (error) {
          console.error('Error in updateName:', error);
        }
      }
    }
  };

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="space_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Space Type</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              value={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select space type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="room">Room</SelectItem>
                <SelectItem value="hallway">Hallway</SelectItem>
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
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select space" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {spaces?.filter(space => space.space_type === spaceType).map((space) => (
                  <SelectItem key={space.id} value={space.id}>
                    {space.space_type === 'room' ? `Room ${space.room_number}` : space.name}
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
        name="position"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Position</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              value={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="ceiling">Ceiling</SelectItem>
                <SelectItem value="wall">Wall</SelectItem>
                <SelectItem value="floor">Floor</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input {...field} readOnly className="bg-muted text-foreground" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
