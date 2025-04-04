
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { CreateSpaceFormData } from "../../../schemas/createSpaceSchema";

interface SpaceTypeSelectorProps {
  form: UseFormReturn<CreateSpaceFormData>;
}

export function SpaceTypeSelector({ form }: SpaceTypeSelectorProps) {
  return (
    <FormField
      control={form.control}
      name="type"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Type</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="room">Room</SelectItem>
              <SelectItem value="hallway">Hallway</SelectItem>
              <SelectItem value="door">Door</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
