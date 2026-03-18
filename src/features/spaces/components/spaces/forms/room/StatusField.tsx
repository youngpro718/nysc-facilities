
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusEnum } from "../../rooms/types/roomEnums";
import { RoomFormProps } from "./types";

export function StatusField({ form }: RoomFormProps) {
  return (
    <FormField
      control={form.control}
      name="status"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Status</FormLabel>
          <Select 
            onValueChange={(value: StatusEnum) => field.onChange(value)} 
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
