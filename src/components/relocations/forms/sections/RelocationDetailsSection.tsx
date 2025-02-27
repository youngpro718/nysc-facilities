
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { CreateRelocationFormData } from "../../types/relocationTypes";

interface RelocationDetailsSectionProps {
  form: UseFormReturn<CreateRelocationFormData>;
}

export function RelocationDetailsSection({ form }: RelocationDetailsSectionProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="relocation_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Type</FormLabel>
            <FormControl>
              <select
                {...field}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="maintenance">Maintenance</option>
                <option value="emergency">Emergency</option>
                <option value="construction">Construction</option>
                <option value="other">Other</option>
              </select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="reason"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Reason</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter reason for relocation" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Notes (Optional)</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Additional notes" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
