
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { FormData } from "../../types/IssueTypes";
import { CollapsibleSection } from "@/components/occupants/details/CollapsibleSection";

interface AdvancedFieldsProps {
  form: UseFormReturn<FormData>;
}

export function AdvancedFields({ form }: AdvancedFieldsProps) {
  return (
    <div className="space-y-6">
      <CollapsibleSection title="Additional Details" defaultOpen={false}>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="area_affected"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">Area Affected</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    className="h-12 text-base bg-background/50 border-white/10" 
                    placeholder="Specify the affected area"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maintenance_priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">Maintenance Priority</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    className="h-12 text-base bg-background/50 border-white/10" 
                    placeholder="Set maintenance priority"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="resolution_notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">Resolution Notes</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    className="min-h-[120px] text-base leading-relaxed bg-background/50 border-white/10" 
                    placeholder="Add notes about resolution steps or requirements"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cost_estimate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">Cost Estimate</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="number"
                    className="h-12 text-base bg-background/50 border-white/10" 
                    placeholder="Estimated cost (if applicable)"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CollapsibleSection>
    </div>
  );
}
