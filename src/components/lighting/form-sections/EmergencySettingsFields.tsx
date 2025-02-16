
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { UseFormWatch } from "react-hook-form";
import { EditLightingFormData } from "../schemas/editLightingSchema";

interface EmergencySettingsFieldsProps {
  form: any;
  watch: UseFormWatch<EditLightingFormData>;
}

export function EmergencySettingsFields({ form, watch }: EmergencySettingsFieldsProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="emergency_circuit"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Emergency Circuit</FormLabel>
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
      {watch("emergency_circuit") && (
        <>
          <FormField
            control={form.control}
            name="backup_power_source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Backup Power Source</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="emergency_duration_minutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Emergency Duration (minutes)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={e => field.onChange(e.target.valueAsNumber)}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
    </>
  );
}
