
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { LightingFixtureFormData } from "../schemas/lightingSchema";

interface StatusAndMaintenanceFieldsProps {
  form: UseFormReturn<LightingFixtureFormData>;
}

export function StatusAndMaintenanceFields({ form }: StatusAndMaintenanceFieldsProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Status</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="functional">Functional</SelectItem>
                <SelectItem value="maintenance_needed">Maintenance Needed</SelectItem>
                <SelectItem value="non_functional">Non Functional</SelectItem>
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
        name="maintenance_priority"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Maintenance Priority</FormLabel>
            <Select onValueChange={field.onChange} value={field.value || ''}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
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
              <Textarea {...field} value={field.value || ''} />
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
              <Textarea {...field} value={field.value || ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
