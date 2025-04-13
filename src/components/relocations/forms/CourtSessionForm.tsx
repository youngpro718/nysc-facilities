import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRelocations } from "../hooks/useRelocations";

// Define the form schema
const courtSessionSchema = z.object({
  relocation_id: z.string().min(1, "Relocation is required"),
  date: z.date({
    required_error: "Date is required",
  }),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  session_type: z.string().min(1, "Session type is required"),
  judge: z.string().optional(),
  notes: z.string().optional(),
});

type CourtSessionFormData = z.infer<typeof courtSessionSchema>;

interface CourtSessionFormProps {
  relocationId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CourtSessionForm({ relocationId, onSuccess, onCancel }: CourtSessionFormProps) {
  const { relocations, addCourtSession, isAddingCourtSession } = useRelocations();
  
  const form = useForm<CourtSessionFormData>({
    resolver: zodResolver(courtSessionSchema),
    defaultValues: {
      relocation_id: relocationId || "",
      date: new Date(),
      start_time: "09:00",
      end_time: "17:00",
      session_type: "regular",
      judge: "",
      notes: "",
    },
  });

  const onSubmit = async (data: CourtSessionFormData) => {
    try {
      // Format the data
      const formattedData = {
        ...data,
        date: format(data.date, "yyyy-MM-dd"),
      };
      
      // Add the court session
      await addCourtSession(formattedData);
      
      // Call the success callback
      if (onSuccess) {
        onSuccess();
      }
      
      // Reset the form
      form.reset();
    } catch (error) {
      console.error("Error creating court session:", error);
    }
  };

  // Get the selected relocation
  const selectedRelocation = relocations.find(r => r.id === form.watch("relocation_id"));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Schedule Court Session</CardTitle>
        <CardDescription>
          Add court sessions to block off times when workers cannot be in the courtroom
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="relocation_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Courtroom Relocation</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={!!relocationId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a relocated courtroom" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {relocations
                        .filter(r => r.status === "active")
                        .map(relocation => (
                          <SelectItem key={relocation.id} value={relocation.id}>
                            {relocation.original_room?.name || "Unknown"} → {relocation.temporary_room?.name || "Unknown"}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the courtroom relocation for this court session
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedRelocation && (
              <div className="bg-muted p-3 rounded-md mb-4">
                <h4 className="font-medium mb-2">Relocation Details</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Original Room:</span>
                    <span>{selectedRelocation.original_room?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Temporary Room:</span>
                    <span>{selectedRelocation.temporary_room?.name}</span>
                  </div>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Court Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
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
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    The date when the court session will be held
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                    </div>
                    <FormDescription>
                      When court session begins
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                    </div>
                    <FormDescription>
                      When court session ends
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="session_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select session type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="regular">Regular Session</SelectItem>
                        <SelectItem value="special">Special Session</SelectItem>
                        <SelectItem value="hearing">Hearing</SelectItem>
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Type of court session
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="judge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Judge (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Judge name" {...field} />
                    </FormControl>
                    <FormDescription>
                      Name of the presiding judge
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional information about this court session..." 
                      className="min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Additional details about the court session
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isAddingCourtSession}
              >
                {isAddingCourtSession ? "Scheduling..." : "Schedule Court Session"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
