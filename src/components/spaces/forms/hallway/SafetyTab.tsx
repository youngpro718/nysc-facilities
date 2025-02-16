
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EditSpaceFormData } from "../../schemas/editSpaceSchema";

interface SafetyTabProps {
  form: UseFormReturn<EditSpaceFormData>;
}

export function SafetyTab({ form }: SafetyTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Safety & Accessibility</h3>
        <p className="text-sm text-muted-foreground">
          Configure safety and accessibility settings.
        </p>
      </div>

      <div className="space-y-4">
        <FormField
          control={form.control}
          name="traffic_flow"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Traffic Flow</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="one_way">One Way</SelectItem>
                  <SelectItem value="two_way">Two Way</SelectItem>
                  <SelectItem value="restricted">Restricted</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Define the traffic flow pattern for this hallway
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="accessibility"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Accessibility</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="fully_accessible">Fully Accessible</SelectItem>
                  <SelectItem value="limited_access">Limited Access</SelectItem>
                  <SelectItem value="stairs_only">Stairs Only</SelectItem>
                  <SelectItem value="restricted">Restricted</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Specify the accessibility level of this hallway
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="security_level"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Security Level</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="restricted">Restricted</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Set the security level for this hallway
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
