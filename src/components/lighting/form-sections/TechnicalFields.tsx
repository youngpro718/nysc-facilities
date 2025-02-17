
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { LightingFixtureFormData } from "../schemas/lightingSchema";

interface TechnicalFieldsProps {
  form: UseFormReturn<LightingFixtureFormData>;
}

export function TechnicalFields({ form }: TechnicalFieldsProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Type</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="motion_sensor">Motion Sensor</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="technology"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Technology</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || ''}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select technology" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="LED">LED</SelectItem>
                <SelectItem value="Fluorescent">Fluorescent</SelectItem>
                <SelectItem value="Bulb">Standard Bulb</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="bulb_count"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Bulb Count</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                min={1} 
                {...field}
                onChange={e => field.onChange(parseInt(e.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
