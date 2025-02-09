
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { EditSpaceFormData } from "../../schemas/editSpaceSchema";
import { CalendarIcon, Wrench } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface MaintenanceTabProps {
  form: UseFormReturn<EditSpaceFormData>;
}

export function MaintenanceTab({ form }: MaintenanceTabProps) {
  return (
    <div>
      <div>
        <h3 className="text-lg font-medium">Maintenance Schedule</h3>
        <p className="text-sm text-muted-foreground">
          Set up maintenance schedules and track maintenance history.
        </p>
      </div>

      <div className="space-y-4">
        <FormField
          control={form.control}
          name="nextMaintenanceDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Next Maintenance Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(new Date(field.value), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => field.onChange(date?.toISOString())}
                    disabled={(date) =>
                      date < new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
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
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
