
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { EditSpaceFormData } from "../../../schemas/editSpaceSchema";

interface MaintenanceScheduleFieldProps {
  form: UseFormReturn<EditSpaceFormData>;
}

export function MaintenanceScheduleField({ form }: MaintenanceScheduleFieldProps) {
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium">Maintenance Schedule</h4>
        <Button
          type="button"
          variant="outline"
          onClick={handleAddSchedule}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Schedule
        </Button>
      </div>

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
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`maintenanceSchedule.${index}.type`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
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
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`maintenanceSchedule.${index}.status`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
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
    </div>
  );
}
