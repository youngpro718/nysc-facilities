import { UseFormReturn } from "react-hook-form";
import { LightingZoneFormData } from "../schemas/lightingSchema";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { fetchFloorsForZones } from "@/services/supabase/lightingService";

interface CreateZoneFieldsProps {
  form: UseFormReturn<LightingZoneFormData>;
}

export function CreateZoneFields({ form }: CreateZoneFieldsProps) {
  const { data: floors } = useQuery({
    queryKey: ['floors'],
    queryFn: fetchFloorsForZones
  });

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Zone Name</FormLabel>
            <FormControl>
              <Input placeholder="Enter zone name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Zone Type</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select zone type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="restricted">Restricted</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="floorId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Floor</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select floor" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {floors?.map((floor) => (
                  <SelectItem key={floor.id} value={floor.id}>
                    {floor.name} (Floor {floor.floor_number})
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