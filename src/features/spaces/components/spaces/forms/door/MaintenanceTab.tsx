
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { EditSpaceFormData } from "../../schemas/editSpaceSchema";
import { CalendarIcon, AlertCircle, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { IssueDialog } from "@features/issues/components/issues/IssueDialog";

interface MaintenanceTabProps {
  form: UseFormReturn<EditSpaceFormData>;
  roomId?: string;
}

export function MaintenanceTab({ form, roomId }: MaintenanceTabProps) {
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);

  // Check if any hardware needs attention
  const hardwareStatus = form.watch('hardwareStatus');
  const closerStatus = form.watch('closerStatus');
  const windPressureIssues = form.watch('windPressureIssues');
  
  const hasHardwareIssues = 
    hardwareStatus?.hinges === 'needs_repair' || hardwareStatus?.hinges === 'needs_replacement' ||
    hardwareStatus?.doorknob === 'needs_repair' || hardwareStatus?.doorknob === 'needs_replacement' ||
    hardwareStatus?.lock === 'needs_repair' || hardwareStatus?.lock === 'needs_replacement' ||
    hardwareStatus?.frame === 'needs_repair' || hardwareStatus?.frame === 'needs_replacement' ||
    closerStatus === 'needs_adjustment' || closerStatus === 'not_working' ||
    windPressureIssues;

  return (
    <div>
      <div>
        <h3 className="text-lg font-medium">Maintenance Status</h3>
        <p className="text-sm text-muted-foreground">
          Track maintenance needs and schedule inspections.
        </p>
      </div>

      <div className="space-y-4 mt-4">
        {/* Issue Reporting Prompt */}
        {hasHardwareIssues && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 shrink-0" />
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                  Hardware issues detected
                </p>
                <p className="text-xs text-orange-700 dark:text-orange-300">
                  Consider reporting this for maintenance tracking and assignment.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIssueDialogOpen(true)}
                  className="mt-2 border-orange-300 hover:bg-orange-100 dark:border-orange-800 dark:hover:bg-orange-900/30"
                >
                  Report Door Hardware Issue
                </Button>
              </div>
            </div>
          </div>
        )}
        <FormField
          control={form.control}
          name="closerStatus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Door Closer Status</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="functioning">Functioning</SelectItem>
                  <SelectItem value="needs_adjustment">Needs Adjustment</SelectItem>
                  <SelectItem value="not_working">Not Working</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="windPressureIssues"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Wind Pressure Issues</FormLabel>
                <FormDescription>
                  Door affected by wind pressure
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

        <div className="space-y-4">
          <h4 className="text-sm font-medium">Hardware Status</h4>
          {(['hinges', 'doorknob', 'lock', 'frame'] as const).map((part) => (
            <FormField
              key={part}
              control={form.control}
              name={`hardwareStatus.${part}`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="capitalize">{part}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="functional">Functional</SelectItem>
                      <SelectItem value="needs_repair">Needs Repair</SelectItem>
                      <SelectItem value="needs_replacement">Needs Replacement</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>

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

      {/* Issue Dialog */}
      <IssueDialog
        open={issueDialogOpen}
        onOpenChange={setIssueDialogOpen}
        onSuccess={() => {
          setIssueDialogOpen(false);
        }}
      />
    </div>
  );
}
