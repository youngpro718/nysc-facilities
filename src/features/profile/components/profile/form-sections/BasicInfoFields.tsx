import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { PersonalInfoValues } from "../schemas/profileSchema";

interface BasicInfoFieldsProps {
  form: UseFormReturn<PersonalInfoValues>;
}

export function BasicInfoFields({ form }: BasicInfoFieldsProps) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={form.control}
          name="first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter first name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="last_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter last name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="department"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Department / Part / Office</FormLabel>
            <FormControl>
              <Input placeholder="e.g. Court Operations, Part 41, DCM Office" {...field} value={field.value ?? ""} />
            </FormControl>
            <FormDescription>
              Used so supply staff know where to deliver your orders.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
