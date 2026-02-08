
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { CreateSpaceFormData } from "../../../schemas/createSpaceSchema";
import { UseFormReturn } from "react-hook-form";
import { logger } from "@/lib/logger";

interface FloorSelectorProps {
  form: UseFormReturn<CreateSpaceFormData>;
  selectedBuildingId: string | null;
}

export function FloorSelector({ form, selectedBuildingId }: FloorSelectorProps) {
  const { data: floors, isLoading } = useQuery({
    queryKey: ["floors", selectedBuildingId],
    queryFn: async () => {
      logger.debug("Fetching floors for building:", selectedBuildingId);
      const query = supabase
        .from("floors")
        .select(`
          id,
          name,
          floor_number,
          building_id,
          buildings:floors_building_id_fkey (
            id,
            name
          )
        `)
        .eq('status', 'active');

      if (selectedBuildingId) {
        query.eq('building_id', selectedBuildingId);
      }
      
      const { data, error } = await query.order('floor_number');
      
      if (error) {
        logger.error("Error fetching floors:", error);
        throw error;
      }
      logger.debug("Fetched floors:", data);
      return data;
    },
    enabled: !!selectedBuildingId
  });

  return (
    <FormField
      control={form.control}
      name="floorId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Floor</FormLabel>
          <Select
            disabled={!selectedBuildingId || isLoading}
            onValueChange={field.onChange}
            value={field.value || ""}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue 
                  placeholder={
                    !selectedBuildingId 
                      ? "Select a building first" 
                      : isLoading 
                      ? "Loading floors..." 
                      : "Select a floor"
                  } 
                />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {floors?.map((floor) => (
                <SelectItem key={floor.id} value={floor.id}>
                  Floor {floor.floor_number} ({floor.name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
