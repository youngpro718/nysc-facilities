
import { UseFormReturn } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { CreateSpaceFormData } from "../../schemas/createSpaceSchema";

interface ConnectionFieldsProps {
  form: UseFormReturn<CreateSpaceFormData>;
  floorId: string;
}

export function ConnectionFields({ form, floorId }: ConnectionFieldsProps) {
  const { data: spaces } = useQuery({
    queryKey: ["floor-spaces", floorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("new_spaces")
        .select("id, name, type")
        .eq("floor_id", floorId)
        .eq("status", "active");

      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="connections.toSpaceId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Connect to Space</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select space to connect to" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {spaces?.map((space) => (
                  <SelectItem key={space.id} value={space.id}>
                    {space.name} ({space.type})
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
        name="connections.connectionType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Connection Type</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select connection type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="door">Door</SelectItem>
                <SelectItem value="hallway">Hallway</SelectItem>
                <SelectItem value="direct">Direct</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="connections.direction"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Direction</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select direction" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="north">North</SelectItem>
                <SelectItem value="south">South</SelectItem>
                <SelectItem value="east">East</SelectItem>
                <SelectItem value="west">West</SelectItem>
                <SelectItem value="adjacent">Adjacent</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
