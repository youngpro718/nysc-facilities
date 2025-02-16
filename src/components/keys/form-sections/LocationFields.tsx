
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { KeyFormData } from "../types/KeyTypes";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface LocationFieldsProps {
  form: UseFormReturn<KeyFormData>;
}

interface Building {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'under_maintenance';
}

interface Floor {
  id: string;
  name: string;
  building_id: string;
  floor_number: number;
  status: 'active' | 'inactive' | 'under_maintenance';
}

interface Door {
  id: string;
  name: string;
  floor_id: string;
  type: 'standard' | 'emergency' | 'secure' | 'maintenance';
  status: 'active' | 'inactive' | 'under_maintenance';
}

interface Room {
  id: string;
  name: string;
  room_number: string;
  floor_id: string;
  status: 'active' | 'inactive' | 'under_maintenance';
}

export function LocationFields({ form }: LocationFieldsProps) {
  const keyScope = form.watch("keyScope");
  const isPasskey = form.watch("isPasskey");

  const { data: buildings, isLoading: isLoadingBuildings } = useQuery({
    queryKey: ["buildings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("buildings")
        .select("*")
        .eq("status", "active")
        .order("name");

      if (error) throw error;
      return data as Building[];
    },
  });

  const { data: floors, isLoading: isLoadingFloors } = useQuery({
    queryKey: ["floors", form.watch("buildingId")],
    queryFn: async () => {
      const buildingId = form.watch("buildingId");
      if (!buildingId) return [];

      const { data, error } = await supabase
        .from("floors")
        .select("*")
        .eq("building_id", buildingId)
        .eq("status", "active")
        .order("floor_number");

      if (error) throw error;
      return data as Floor[];
    },
    enabled: !!form.watch("buildingId") && !isPasskey,
  });

  const { data: doors, isLoading: isLoadingDoors } = useQuery({
    queryKey: ["doors", form.watch("floorId")],
    queryFn: async () => {
      const floorId = form.watch("floorId");
      if (!floorId) return [];

      const { data, error } = await supabase
        .from("doors")
        .select("*")
        .eq("floor_id", floorId)
        .eq("status", "active")
        .order("name");

      if (error) throw error;
      return data as Door[];
    },
    enabled: !!form.watch("floorId") && keyScope === "door" && !isPasskey,
  });

  const { data: rooms, isLoading: isLoadingRooms } = useQuery({
    queryKey: ["rooms", form.watch("floorId")],
    queryFn: async () => {
      const floorId = form.watch("floorId");
      if (!floorId) return [];

      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("floor_id", floorId)
        .eq("status", "active")
        .order("name");

      if (error) throw error;
      return data as Room[];
    },
    enabled: !!form.watch("floorId") && keyScope === "room" && !isPasskey,
  });

  const handleBuildingChange = (value: string) => {
    form.setValue("buildingId", value);
    if (!isPasskey) {
      form.setValue("floorId", undefined);
      form.setValue("doorId", undefined);
      form.setValue("roomId", undefined);
    }
  };

  const handleFloorChange = (value: string) => {
    form.setValue("floorId", value);
    form.setValue("doorId", undefined);
    form.setValue("roomId", undefined);
  };

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="buildingId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Building</FormLabel>
            <Select
              onValueChange={handleBuildingChange}
              value={field.value}
              disabled={isLoadingBuildings}
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
            <FormDescription>
              {isPasskey 
                ? "This passkey will work on all appropriate doors in the selected building"
                : "Select the building where this key will be used"}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {!isPasskey && (
        <>
          <FormField
            control={form.control}
            name="floorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Floor</FormLabel>
                <Select
                  onValueChange={handleFloorChange}
                  value={field.value}
                  disabled={!form.watch("buildingId") || isLoadingFloors}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={!form.watch("buildingId") ? "Select building first" : "Select floor"} />
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

          {keyScope === "door" && (
            <FormField
              control={form.control}
              name="doorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Door</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!form.watch("floorId") || isLoadingDoors}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={!form.watch("floorId") ? "Select floor first" : "Select door"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {doors?.map((door) => (
                        <SelectItem key={door.id} value={door.id}>
                          {door.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {keyScope === "room" && (
            <FormField
              control={form.control}
              name="roomId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!form.watch("floorId") || isLoadingRooms}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={!form.watch("floorId") ? "Select floor first" : "Select room"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {rooms?.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.name} ({room.room_number})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </>
      )}
    </div>
  );
}
