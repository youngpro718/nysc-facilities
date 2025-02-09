
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { RoomLightingConfig } from "@/components/lighting/types";

interface BasicConfigSectionProps {
  form: UseFormReturn<RoomLightingConfig>;
}

export function BasicConfigSection({ form }: BasicConfigSectionProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="technology"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Technology</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select technology" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="LED">LED</SelectItem>
                <SelectItem value="Fluorescent">Fluorescent</SelectItem>
                <SelectItem value="Bulb">Bulb</SelectItem>
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

      <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Status</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="functional">Functional</SelectItem>
                <SelectItem value="maintenance_needed">Needs Maintenance</SelectItem>
                <SelectItem value="non_functional">Non-functional</SelectItem>
                <SelectItem value="pending_maintenance">Pending Maintenance</SelectItem>
                <SelectItem value="scheduled_replacement">Scheduled Replacement</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="maintenance_notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Maintenance Notes</FormLabel>
            <FormControl>
              <Textarea {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="ballast_check_notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Ballast Check Notes</FormLabel>
            <FormControl>
              <Textarea {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
