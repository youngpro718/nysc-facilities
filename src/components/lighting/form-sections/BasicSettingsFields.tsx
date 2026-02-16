// @ts-nocheck
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { logger } from '@/lib/logger';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { LightingFixtureFormData } from "../schemas/lightingSchema";
import { Space } from "@/types/lighting";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { generateFixtureName } from "../schemas/lightingSchema";
import { useEffect } from "react";

interface BasicSettingsFieldsProps {
  form: UseFormReturn<LightingFixtureFormData>;
  onSpaceOrPositionChange?: () => void;
}

export function BasicSettingsFields({ form, onSpaceOrPositionChange }: BasicSettingsFieldsProps) {
  const { data: spaces } = useQuery({
    queryKey: ['spaces-with-building-floor'],
    queryFn: async () => {
      // Get rooms and hallways with building and floor information
      const [roomsResult, hallwaysResult] = await Promise.all([
        supabase
          .from('rooms')
          .select(`
            id, name, room_number, floor_id,
            floors:floor_id (
              id, name, floor_number,
              buildings:building_id (id, name)
            )
          `)
          .eq('status', 'active'),
        supabase
          .from('hallways')
          .select(`
            id, name, floor_id,
            floors:floor_id (
              id, name, floor_number,
              buildings:building_id (id, name)
            )
          `)
          .eq('status', 'active')
      ]);
      
      if (roomsResult.error) throw roomsResult.error;
      if (hallwaysResult.error) throw hallwaysResult.error;
      
      const rooms = (roomsResult.data || []).map((room: Record<string, unknown>) => ({
        id: room.id,
        name: room.name,
        room_number: room.room_number,
        floor_id: room.floor_id,
        type: 'room' as const,
        floor: room.floors,
        building: room.floors?.buildings
      }));
      
      const hallways = (hallwaysResult.data || []).map((hallway: Record<string, unknown>) => ({
        id: hallway.id,
        name: hallway.name,
        room_number: null,
        floor_id: hallway.floor_id,
        type: 'hallway' as const,
        floor: hallway.floors,
        building: hallway.floors?.buildings
      }));
      
      return [...rooms, ...hallways];
    }
  });

  const spaceId = form.watch('space_id');
  const position = form.watch('position');
  const spaceType = form.watch('space_type');
  const selectedSpace = (spaces || [])?.find(s => s.id === spaceId);

  useEffect(() => {
    updateName();
  }, [spaceId, position, spaceType]);

  const updateName = async () => {
    if (spaceId && position && spaces) {
      const space = spaces.find(s => s.id === spaceId);
      if (space) {
        let sequence = 1;
        
        try {
          const { data: sequenceData, error } = await supabase
            .rpc('get_next_lighting_sequence', {
              p_space_id: spaceId
            });
          
          if (error) {
            logger.warn('Could not get sequence, using fallback:', error);
          } else {
            sequence = typeof sequenceData === 'number' ? sequenceData : 1;
          }
        } catch (error) {
          logger.warn('Error getting sequence, using fallback:', error);
        }
        
        const name = generateFixtureName(
          space.type as 'room' | 'hallway',
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
            <FormLabel>{spaceType === 'room' ? 'Room' : 'Hallway'}</FormLabel>
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
                {spaces?.filter(space => space.type === spaceType).map((space: Record<string, unknown>) => (
                  <SelectItem key={space.id} value={space.id}>
                    <div className="flex flex-col">
                      <span>
                        {space.type === 'room'
                          ? `Room ${space.room_number || ''}${space.name ? ` — ${space.name}` : ''}`
                          : space.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {space.building?.name} • {space.floor?.name}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSpace && (
              <div className="text-xs text-muted-foreground mt-1">
                Selected: {selectedSpace.type === 'room'
                  ? `Room ${selectedSpace.room_number || ''}${selectedSpace.name ? ` — ${selectedSpace.name}` : ''}`
                  : selectedSpace.name}
              </div>
            )}
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
                <SelectItem value="desk">Desk</SelectItem>
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
            <div className="text-xs text-muted-foreground mt-1">
              Auto-generated from the chosen space and position (e.g., "Room 1317 — Ceiling Light 1").
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
