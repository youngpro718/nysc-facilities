
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { EditSpaceFormData } from "../../schemas/editSpaceSchema";
import { AlertCircle } from "lucide-react";

interface SecurityTabProps {
  form: UseFormReturn<EditSpaceFormData>;
}

export function SecurityTab({ form }: SecurityTabProps) {
  return (
    <div>
      <div>
        <h3 className="text-lg font-medium">Security Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure security and access control settings.
        </p>
      </div>

      <div className="space-y-4">
        <FormField
          control={form.control}
          name="securityLevel"
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
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="passkeyEnabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Passkey Enabled</FormLabel>
                <FormDescription>
                  Enable if this door requires electronic access
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
