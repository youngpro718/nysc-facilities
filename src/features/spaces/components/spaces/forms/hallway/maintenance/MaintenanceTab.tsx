
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EditSpaceFormData } from "../../../schemas/editSpaceSchema";
import { MaintenanceScheduleField } from "./MaintenanceScheduleField";

interface MaintenanceTabProps {
  form: UseFormReturn<EditSpaceFormData>;
}

export function MaintenanceTab({ form }: MaintenanceTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Maintenance</h3>
        <p className="text-sm text-muted-foreground">
          Manage maintenance schedules and related information.
        </p>
      </div>

      <div className="space-y-4">
        <FormField
          control={form.control}
          name="maintenancePriority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Maintenance Priority</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || "low"}>
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
          name="maintenanceNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Maintenance Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter maintenance notes"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <MaintenanceScheduleField form={form} />
      </div>
    </div>
  );
}
