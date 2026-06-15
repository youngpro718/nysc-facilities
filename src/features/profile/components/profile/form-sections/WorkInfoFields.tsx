import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { PersonalInfoValues } from "../schemas/profileSchema";

interface WorkInfoFieldsProps {
  form: UseFormReturn<PersonalInfoValues>;
}

export function WorkInfoFields({ form }: WorkInfoFieldsProps) {
  return (
    <FormField
      control={form.control}
      name="phone"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Phone Number</FormLabel>
          <FormControl>
            <Input placeholder="Enter phone number" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
