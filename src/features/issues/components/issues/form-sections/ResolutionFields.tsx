
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { FormData } from "../types/formTypes";

interface ResolutionFieldsProps {
  form: UseFormReturn<FormData>;
}

export function ResolutionFields({ form }: ResolutionFieldsProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="resolution_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Resolution Type</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select resolution type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="fixed">Fixed</SelectItem>
                <SelectItem value="replaced">Replaced</SelectItem>
                <SelectItem value="maintenance_performed">Maintenance Performed</SelectItem>
                <SelectItem value="no_action_needed">No Action Needed</SelectItem>
                <SelectItem value="deferred">Deferred</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="resolution_notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Resolution Notes</FormLabel>
            <FormControl>
              <Textarea {...field} placeholder="Provide details about the resolution..." />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
