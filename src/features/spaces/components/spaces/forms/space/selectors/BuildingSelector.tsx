
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { QUERY_CONFIG } from '@/config';
import { QUERY_KEYS } from '@/lib/queryKeys';
import { UseFormReturn } from "react-hook-form";
import { CreateSpaceFormData } from "../../../schemas/createSpaceSchema";
import { logger } from "@/lib/logger";

interface BuildingSelectorProps {
  form: UseFormReturn<CreateSpaceFormData>;
  onBuildingChange?: (buildingId: string) => void;
}

export function BuildingSelector({ form, onBuildingChange }: BuildingSelectorProps) {
  const { data: buildings, isLoading } = useQuery({
    queryKey: QUERY_KEYS.buildings(),
    queryFn: async () => {
      logger.debug("Fetching buildings...");
      const { data, error } = await supabase
        .from("buildings")
        .select("id, name, address, status")
        .eq('status', 'active')
        .order('name');
      
      if (error) {
        logger.error("Error fetching buildings:", error);
        throw error;
      }
      logger.debug("Fetched buildings:", data);
      return data;
    },
    staleTime: QUERY_CONFIG.stale.long,
    gcTime: QUERY_CONFIG.gc.long,
  });

  return (
    <FormField
      control={form.control}
      name="buildingId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Building</FormLabel>
          <Select
            disabled={isLoading}
            onValueChange={(value) => {
              field.onChange(value);
              onBuildingChange?.(value);
            }}
            value={field.value || ""}
            defaultValue={field.value || ""}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={isLoading ? "Loading buildings..." : "Select a building"} />
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
  );
}
