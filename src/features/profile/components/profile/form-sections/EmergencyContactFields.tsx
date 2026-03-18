
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { PersonalInfoValues } from "../schemas/profileSchema";

interface EmergencyContactFieldsProps {
  form: UseFormReturn<PersonalInfoValues>;
}

export function EmergencyContactFields({ form }: EmergencyContactFieldsProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium">Emergency Contact</h3>
      <div className="grid gap-4 md:grid-cols-3">
        <FormField
          control={form.control}
          name="emergency_contact.name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Name</FormLabel>
              <FormControl>
                <Input placeholder="Emergency contact name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="emergency_contact.phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Phone</FormLabel>
              <FormControl>
                <Input placeholder="Emergency contact phone" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="emergency_contact.relationship"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Relationship</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Spouse, Parent" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
