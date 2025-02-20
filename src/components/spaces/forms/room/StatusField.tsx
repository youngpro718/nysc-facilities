
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EditSpaceFormData } from "../../schemas/editSpaceSchema";
import { StatusEnum } from "../../rooms/types/roomEnums";

interface StatusFieldProps {
  form: UseFormReturn<EditSpaceFormData>;
}

export function StatusField({ form }: StatusFieldProps) {
  return (
    <FormField
      control={form.control}
      name="status"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Status</FormLabel>
          <Select 
            onValueChange={field.onChange} 
            value={field.value}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value={StatusEnum.ACTIVE}>Active</SelectItem>
              <SelectItem value={StatusEnum.INACTIVE}>Inactive</SelectItem>
              <SelectItem value={StatusEnum.UNDER_MAINTENANCE}>Under Maintenance</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
