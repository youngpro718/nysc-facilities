
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { FormData } from "../types/formTypes";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building, Floor, Room } from "../types/locationTypes";
import { Loader2 } from "lucide-react";

interface LocationFieldsProps {
  form: UseFormReturn<FormData>;
  disableFields?: boolean;
}

export function LocationFields({ form, disableFields = false }: LocationFieldsProps) {
  const buildingId = form.watch('building_id') || "";
  const floorId = form.watch('floor_id') || "";

  const { data: buildings, isLoading: isLoadingBuildings } = useQuery({
    queryKey: ['buildings'],
    queryFn: async (): Promise<Building[]> => {
      const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data as Building[];
    }
  });

  const { data: floors, isLoading: isLoadingFloors } = useQuery({
    queryKey: ['floors', buildingId],
    queryFn: async (): Promise<Floor[]> => {
      if (!buildingId) return [];
      const { data, error } = await supabase
        .from('floors')
        .select('*')
        .eq('building_id', buildingId)
        .eq('status', 'active')
        .order('floor_number');
      if (error) throw error;
      return data as Floor[];
    },
    enabled: !!buildingId,
  });

  const { data: rooms, isLoading: isLoadingRooms } = useQuery({
    queryKey: ['rooms', floorId],
    queryFn: async (): Promise<Room[]> => {
      if (!floorId) return [];
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('floor_id', floorId)
        .eq('status', 'active')
        .order('room_number');
      if (error) throw error;
      return data as Room[];
    },
    enabled: !!floorId,
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
                // Clear dependent fields when building changes
                form.setValue('floor_id', "");
                form.setValue('room_id', "");
              }} 
              value={field.value || ""}
              disabled={disableFields || isLoadingBuildings}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingBuildings ? "Loading buildings..." : "Select building"} />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="z-[100] bg-background">
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
                // Clear dependent field when floor changes
                form.setValue('room_id', "");
              }} 
              value={field.value || ""}
              disabled={disableFields || !buildingId || isLoadingFloors}
            >
              <FormControl>
                <SelectTrigger>
                  {isLoadingFloors ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading floors...</span>
                    </div>
                  ) : (
                    <SelectValue placeholder="Select floor" />
                  )}
                </SelectTrigger>
              </FormControl>
              <SelectContent className="z-[90] bg-background">
                {floors?.length ? (
                  floors.map((floor) => (
                    <SelectItem key={floor.id} value={floor.id}>
                      Floor {floor.floor_number} - {floor.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    No floors available
                  </div>
                )}
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
            <FormLabel className="flex items-center gap-1">
              Room
              <span className="text-destructive">*</span>
            </FormLabel>
            <Select 
              onValueChange={field.onChange} 
              value={field.value || ""}
              disabled={disableFields || !floorId || isLoadingRooms}
              required
            >
              <FormControl>
                <SelectTrigger>
                  {isLoadingRooms ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading rooms...</span>
                    </div>
                  ) : (
                    <SelectValue placeholder="Select room" />
                  )}
                </SelectTrigger>
              </FormControl>
              <SelectContent className="z-[80] bg-background">
                {rooms?.length ? (
                  rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      Room {room.room_number} - {room.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    No rooms available
                  </div>
                )}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
