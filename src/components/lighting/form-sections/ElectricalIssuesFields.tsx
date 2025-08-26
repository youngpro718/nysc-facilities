import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { LightingFixtureFormData } from "../schemas/lightingSchema";

interface ElectricalIssuesFieldsProps {
  form: UseFormReturn<LightingFixtureFormData>;
}

export function ElectricalIssuesFields({ form }: ElectricalIssuesFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <FormLabel className="text-sm font-medium">Electrical Issues</FormLabel>
        
        <FormField
          control={form.control}
          name="electrical_issues.short_circuit"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm">Short Circuit</FormLabel>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="electrical_issues.wiring_issues"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm">Wiring Issues</FormLabel>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="electrical_issues.voltage_problems"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm">Voltage Problems</FormLabel>
              </div>
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="ballast_issue"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel className="text-sm">Ballast Issue</FormLabel>
            </div>
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
              <Textarea 
                {...field} 
                value={field.value || ""}
                placeholder="Enter ballast inspection notes..."
                className="min-h-[60px]"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}