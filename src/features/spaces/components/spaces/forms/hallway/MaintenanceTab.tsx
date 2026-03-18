
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EditSpaceFormData } from "../../schemas/editSpaceSchema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";

interface MaintenanceTabProps {
  form: UseFormReturn<EditSpaceFormData>;
}

export function MaintenanceTab({ form }: MaintenanceTabProps) {
  const maintenanceSchedule = form.watch("maintenanceSchedule") || [];

  const handleAddSchedule = () => {
    const currentSchedule = form.getValues("maintenanceSchedule") || [];
    form.setValue("maintenanceSchedule", [
      ...currentSchedule,
      { date: "", type: "routine", status: "scheduled", assignedTo: "" }
    ]);
  };

  const handleRemoveSchedule = (index: number) => {
    const currentSchedule = form.getValues("maintenanceSchedule") || [];
    form.setValue(
      "maintenanceSchedule",
      currentSchedule.filter((_, i) => i !== index)
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Maintenance</h3>
        <p className="text-sm text-muted-foreground">
          Manage maintenance schedules and related information.
        </p>
      </div>

      <div className="space-y-4">
        <FormField
          control={form.control}
          name="maintenancePriority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Maintenance Priority</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || "low"}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="maintenanceNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Maintenance Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter maintenance notes"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          {maintenanceSchedule.map((_, index) => (
            <div key={index} className="flex gap-4 items-start p-4 border rounded-md">
              <div className="flex-1 space-y-4">
                <FormField
                  control={form.control}
                  name={`maintenanceSchedule.${index}.date`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`maintenanceSchedule.${index}.type`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="routine">Routine</SelectItem>
                          <SelectItem value="inspection">Inspection</SelectItem>
                          <SelectItem value="repair">Repair</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`maintenanceSchedule.${index}.status`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`maintenanceSchedule.${index}.assignedTo`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned To</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Person responsible" />
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
                onClick={() => handleRemoveSchedule(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={handleAddSchedule}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Maintenance Schedule
          </Button>
        </div>
      </div>
    </div>
  );
}
