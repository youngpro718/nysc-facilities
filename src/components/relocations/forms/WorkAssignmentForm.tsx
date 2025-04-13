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
import { CalendarIcon, Clock, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRelocations } from "../hooks/useRelocations";

// Define the form schema
const workAssignmentSchema = z.object({
  relocation_id: z.string().min(1, "Relocation is required"),
  worker_name: z.string().min(1, "Worker name is required"),
  work_date: z.date({
    required_error: "Work date is required",
  }),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  work_description: z.string().min(1, "Work description is required"),
  notify_completion: z.boolean().default(true),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

type WorkAssignmentFormData = z.infer<typeof workAssignmentSchema>;

interface WorkAssignmentFormProps {
  relocationId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function WorkAssignmentForm({ relocationId, onSuccess, onCancel }: WorkAssignmentFormProps) {
  const [workers, setWorkers] = useState([
    { id: "1", name: "John Smith" },
    { id: "2", name: "Maria Garcia" },
    { id: "3", name: "David Johnson" },
    { id: "4", name: "Sarah Lee" },
    { id: "5", name: "Michael Brown" },
  ]);
  
  const { relocations, addWorkAssignment, isLoading } = useRelocations();
  
  const form = useForm<WorkAssignmentFormData>({
    resolver: zodResolver(workAssignmentSchema),
    defaultValues: {
      relocation_id: relocationId || "",
      worker_name: "",
      work_date: new Date(),
      start_time: "09:00",
      end_time: "17:00",
      work_description: "",
      notify_completion: true,
      priority: "medium",
    },
  });

  const onSubmit = async (data: WorkAssignmentFormData) => {
    try {
      // Format the data
      const formattedData = {
        ...data,
        work_date: format(data.work_date, "yyyy-MM-dd"),
      };
      
      // Add the work assignment
      await addWorkAssignment(formattedData);
      
      // Call the success callback
      if (onSuccess) {
        onSuccess();
      }
      
      // Reset the form
      form.reset();
    } catch (error) {
      console.error("Error creating work assignment:", error);
    }
  };

  // Get the selected relocation
  const selectedRelocation = relocations.find(r => r.id === form.watch("relocation_id"));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Assign Work to Courtroom</CardTitle>
        <CardDescription>
          Schedule workers for renovation tasks in a specific courtroom
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
                    Select the courtroom relocation for this work assignment
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
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="outline">{selectedRelocation.status}</Badge>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="worker_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Worker Name</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a worker" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {workers.map(worker => (
                          <SelectItem key={worker.id} value={worker.name}>
                            {worker.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The worker assigned to this task
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <FormDescription>
                      Set the priority level for this work
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="work_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Work Date</FormLabel>
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
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      The date when the work will be performed
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                      When work begins
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
                      When work ends
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="work_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Work Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the work to be done..." 
                      className="min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Detailed description of the work to be performed
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notify_completion"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Notify on Completion
                    </FormLabel>
                    <FormDescription>
                      Send a notification when this work is marked as completed
                    </FormDescription>
                  </div>
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
                disabled={isLoading}
              >
                {isLoading ? "Creating..." : "Create Work Assignment"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
