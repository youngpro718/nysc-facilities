import { Droplets } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { RoomFormData } from "./RoomFormSchema";

interface AmenitiesFieldsProps {
  form: UseFormReturn<RoomFormData>;
}

export function AmenitiesFields({ form }: AmenitiesFieldsProps) {
  const coolerCount = form.watch("waterCoolerCount") ?? 0;
  const hasWaterCoolers = coolerCount > 0;

  const handleToggle = (enabled: boolean) => {
    form.setValue("waterCoolerCount", enabled ? Math.max(1, coolerCount) : 0, {
      shouldDirty: true,
      shouldValidate: true,
    });
    if (!enabled) {
      form.setValue("waterCoolerNotes", "", { shouldDirty: true });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 rounded-md bg-sky-500/10 p-2 text-sky-700 dark:text-sky-300">
            <Droplets className="h-4 w-4" />
          </span>
          <div>
            <FormLabel htmlFor="water-cooler-toggle" className="text-sm font-medium">
              Water coolers
            </FormLabel>
            <p className="mt-1 text-xs text-muted-foreground">
              Record the exact number physically located in this room.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Switch
            id="water-cooler-toggle"
            checked={hasWaterCoolers}
            onCheckedChange={handleToggle}
            aria-label="Room has water coolers"
          />
          {hasWaterCoolers && (
            <FormField
              control={form.control}
              name="waterCoolerCount"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs">Quantity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={50}
                      inputMode="numeric"
                      className="h-9 w-20 font-mono"
                      value={field.value ?? 1}
                      onChange={(event) => field.onChange(Number(event.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
      </div>

      {hasWaterCoolers && (
        <FormField
          control={form.control}
          name="waterCoolerNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Placement notes</FormLabel>
              <FormControl>
                <Input
                  placeholder="Optional, e.g. outside the calendar unit"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}
