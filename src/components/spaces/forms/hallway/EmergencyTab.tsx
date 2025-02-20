
import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { FormSpace, EmergencyExit } from "../types/formTypes";
import { addArrayItem, getArrayFieldValue, removeArrayItem } from "../utils/formArrayHelpers";

interface EmergencyTabProps {
  form: UseFormReturn<FormSpace>;
}

export function EmergencyTab({ form }: EmergencyTabProps) {
  const emergencyExits = getArrayFieldValue<EmergencyExit[]>(form, "emergencyExits");

  const handleAddExit = () => {
    addArrayItem<EmergencyExit[]>(form, "emergencyExits", {
      location: "",
      type: "",
      notes: ""
    });
  };

  const handleRemoveExit = (index: number) => {
    removeArrayItem<EmergencyExit[]>(form, "emergencyExits", index);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Emergency Routes & Exits</h3>
        <p className="text-sm text-muted-foreground">
          Configure emergency routes and manage exit points.
        </p>
      </div>

      <div className="space-y-4">
        <FormField
          control={form.control}
          name="emergencyRoute"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Emergency Route</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                  <SelectItem value="not_designated">Not Designated</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <h4 className="text-sm font-medium">Emergency Exits</h4>
          {emergencyExits.map((exit, index) => (
            <div key={index} className="flex gap-4 items-start">
              <div className="flex-1 space-y-4">
                <FormField
                  control={form.control}
                  name={`emergencyExits.${index}.location` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Exit location" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`emergencyExits.${index}.type` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <FormControl>
                        <Input placeholder="Exit type" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`emergencyExits.${index}.notes` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Input placeholder="Additional notes" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => handleRemoveExit(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={handleAddExit}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Emergency Exit
          </Button>
        </div>
      </div>
    </div>
  );
}
