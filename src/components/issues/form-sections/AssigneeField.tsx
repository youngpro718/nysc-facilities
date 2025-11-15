
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { FormData } from "../types/formTypes";

interface AssigneeFieldProps {
  form: UseFormReturn<FormData>;
}

export function AssigneeField({ form }: AssigneeFieldProps) {
  return (
    <FormField
      control={form.control}
      name="assigned_to"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Assign To</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="DCAS">DCAS</SelectItem>
              <SelectItem value="OCA">OCA</SelectItem>
              <SelectItem value="Self">Self</SelectItem>
              <SelectItem value="Outside_Vendor">Outside Vendor</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
