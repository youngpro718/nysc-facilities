
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CreateSpaceFormData } from "../../schemas/createSpaceSchema";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CreateDoorFieldsProps {
  form: UseFormReturn<CreateSpaceFormData>;
}

export function CreateDoorFields({ form }: CreateDoorFieldsProps) {
  const floorId = form.watch("floorId");
  const isHallwayConnection = form.watch("is_hallway_connection");

  const { data: rooms } = useQuery({
    queryKey: ["rooms", floorId],
    queryFn: async () => {
      if (!floorId) return [];
      
      const { data, error } = await supabase
        .from("rooms")
        .select("id, name, room_number")
        .eq("floor_id", floorId)
        .order("room_number");
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!floorId && !isHallwayConnection
  });

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="doorType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Door Type</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="secure">Secure</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="securityLevel"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Security Level</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="restricted">Restricted</SelectItem>
                <SelectItem value="high_security">High Security</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="passkeyEnabled"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Passkey Enabled</FormLabel>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="is_hallway_connection"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Hallway Connection</FormLabel>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />

      {!isHallwayConnection && (
        <FormField
          control={form.control}
          name="problematic_room_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Problematic Room</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a room" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {rooms?.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.room_number} - {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}
