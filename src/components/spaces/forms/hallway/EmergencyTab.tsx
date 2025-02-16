
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { EditSpaceFormData } from "../../schemas/editSpaceSchema";

interface EmergencyTabProps {
  form: UseFormReturn<EditSpaceFormData>;
}

export function EmergencyTab({ form }: EmergencyTabProps) {
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
          name="emergency_route"
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
          {form.watch("emergency_exits")?.map((_, index) => (
            <div key={index} className="flex gap-4 items-start">
              <div className="flex-1 space-y-4">
                <FormField
                  control={form.control}
                  name={`emergency_exits.${index}.location`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Exit location" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`emergency_exits.${index}.type`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Exit type" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`emergency_exits.${index}.notes`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Additional notes" />
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
                onClick={() => {
                  const exits = form.getValues("emergency_exits");
                  form.setValue("emergency_exits", exits.filter((_, i) => i !== index));
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const exits = form.getValues("emergency_exits") || [];
              form.setValue("emergency_exits", [
                ...exits,
                { location: "", type: "", notes: "" }
              ]);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Emergency Exit
          </Button>
        </div>
      </div>
    </div>
  );
}
