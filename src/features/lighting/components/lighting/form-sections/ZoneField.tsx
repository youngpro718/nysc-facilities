import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { LightingFixtureFormData } from "../schemas/lightingSchema";

interface ZoneFieldProps {
  form: UseFormReturn<LightingFixtureFormData>;
  zones?: Array<{ id: string; name: string }>;
}

export function ZoneField({ form, zones }: ZoneFieldProps) {
  return (
    <FormField
      control={form.control}
      name="zone_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Zone</FormLabel>
          <Select onValueChange={field.onChange} value={field.value || ""}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select zone" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {zones?.map((zone) => (
                <SelectItem key={zone.id} value={zone.id}>
                  {zone.name}
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
