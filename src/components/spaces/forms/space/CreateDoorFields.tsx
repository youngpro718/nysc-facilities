
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CreateSpaceFormData } from "../../schemas/createSpaceSchema";

interface CreateDoorFieldsProps {
  form: UseFormReturn<CreateSpaceFormData>;
}

export function CreateDoorFields({ form }: CreateDoorFieldsProps) {
  const floorId = form.watch("floorId");

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="doorType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Door Type</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select door type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="secure">Secure</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="transition">Transition (Public→Private)</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="securityLevel"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Security Level</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select security level" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="restricted">Restricted</SelectItem>
                <SelectItem value="high_security">High Security</SelectItem>
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
  );
}
