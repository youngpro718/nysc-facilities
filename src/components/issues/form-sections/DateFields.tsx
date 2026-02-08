
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { logger } from '@/lib/logger';
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { FormData } from "../types/formTypes";

interface DateFieldsProps {
  form: UseFormReturn<FormData>;
}

export function DateFields({ form }: DateFieldsProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="due_date"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Due Date</FormLabel>
            <FormControl>
              <Input 
                type="datetime-local" 
                {...field}
                onChange={(e) => {
                  logger.debug('New date value:', e.target.value);
                  field.onChange(e.target.value);
                }}
                value={field.value || ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="date_info"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Date Information</FormLabel>
            <FormControl>
              <Input 
                placeholder="Why is this date being set? (e.g., scheduled painting, repairs)" 
                {...field}
                value={field.value || ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
