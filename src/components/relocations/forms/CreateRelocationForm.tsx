import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { useRelocations } from "../hooks/useRelocations";
import { useRoomsQuery } from "@/components/spaces/hooks/queries/useRoomsQuery";
import { Room } from "@/components/spaces/rooms/types/RoomTypes";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CreateRelocationFormData } from "../types/relocationTypes";

// Define the form schema with Zod
const formSchema = z.object({
  original_room_id: z.string({
    required_error: "Please select the original room",
  }),
  temporary_room_id: z.string({
    required_error: "Please select the temporary room",
  }),
  start_date: z.date({
    required_error: "Please select a start date",
  }),
  expected_end_date: z.date().optional(),
  reason: z.string().min(5, {
    message: "Reason must be at least 5 characters",
  }),
  notes: z.string().optional(),
  schedule_changes: z.array(
    z.object({
      original_court_part: z.string().min(1, {
        message: "Please enter the original court part",
      }),
      temporary_assignment: z.string().min(1, {
        message: "Please enter the temporary assignment",
      }),
      special_instructions: z.string().optional(),
    })
  ).optional(),
});

export function CreateRelocationForm() {
  const { createRelocation, isCreating } = useRelocations();
  const { data: rooms, isLoading: isLoadingRooms } = useRoomsQuery();
  const [scheduleChanges, setScheduleChanges] = useState<
    Array<{
      original_court_part: string;
      temporary_assignment: string;
      special_instructions?: string;
    }>
  >([]);

  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: "",
      notes: "",
      schedule_changes: [],
    },
  });

  // Handle form submission
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Format the data for the API
    const formData: CreateRelocationFormData = {
      original_room_id: values.original_room_id,
      temporary_room_id: values.temporary_room_id,
      start_date: values.start_date.toISOString(),
      expected_end_date: values.expected_end_date
        ? values.expected_end_date.toISOString()
        : undefined,
      reason: values.reason,
      notes: values.notes,
      schedule_changes: scheduleChanges.length > 0 ? scheduleChanges : undefined,
    };

    // Submit the form
    createRelocation(formData);
  };

  // Add a new schedule change
  const addScheduleChange = () => {
    setScheduleChanges([
      ...scheduleChanges,
      {
        original_court_part: "",
        temporary_assignment: "",
        special_instructions: "",
      },
    ]);
  };

  // Remove a schedule change
  const removeScheduleChange = (index: number) => {
    setScheduleChanges(scheduleChanges.filter((_, i) => i !== index));
  };

  // Update a schedule change
  const updateScheduleChange = (
    index: number,
    field: string,
    value: string
  ) => {
    const updatedChanges = [...scheduleChanges];
    updatedChanges[index] = {
      ...updatedChanges[index],
      [field]: value,
    };
    setScheduleChanges(updatedChanges);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Original Room */}
          <FormField
            control={form.control}
            name="original_room_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Original Room</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoadingRooms}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a room" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {rooms?.map((room: Room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name || room.room_number || "Unnamed Room"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  The room that is being temporarily relocated
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Temporary Room */}
          <FormField
            control={form.control}
            name="temporary_room_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Temporary Room</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoadingRooms}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a room" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {rooms?.map((room: Room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name || room.room_number || "Unnamed Room"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  The room that will temporarily host the activities
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Start Date */}
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
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
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  When the relocation will begin
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Expected End Date */}
          <FormField
            control={form.control}
            name="expected_end_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Expected End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
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
                      selected={field.value || undefined}
                      onSelect={field.onChange}
                      disabled={(date) => {
                        const startDate = form.getValues("start_date");
                        return (
                          startDate && date < startDate
                        );
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  When the relocation is expected to end (optional)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Reason */}
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason for Relocation</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter the reason for this temporary relocation"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Explain why this relocation is necessary
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter any additional notes or instructions"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Any additional information about this relocation (optional)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Schedule Changes */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Schedule Changes</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addScheduleChange}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Schedule Change
            </Button>
          </div>

          {scheduleChanges.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No schedule changes added yet. Click the button above to add one.
            </p>
          ) : (
            <div className="space-y-4">
              {scheduleChanges.map((change, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <FormLabel htmlFor={`original-court-${index}`}>
                          Original Court Part
                        </FormLabel>
                        <Input
                          id={`original-court-${index}`}
                          value={change.original_court_part}
                          onChange={(e) =>
                            updateScheduleChange(
                              index,
                              "original_court_part",
                              e.target.value
                            )
                          }
                          placeholder="Enter the original court part"
                        />
                      </div>

                      <div className="space-y-2">
                        <FormLabel htmlFor={`temporary-assignment-${index}`}>
                          Temporary Assignment
                        </FormLabel>
                        <Input
                          id={`temporary-assignment-${index}`}
                          value={change.temporary_assignment}
                          onChange={(e) =>
                            updateScheduleChange(
                              index,
                              "temporary_assignment",
                              e.target.value
                            )
                          }
                          placeholder="Enter the temporary assignment"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <FormLabel htmlFor={`special-instructions-${index}`}>
                          Special Instructions
                        </FormLabel>
                        <Textarea
                          id={`special-instructions-${index}`}
                          value={change.special_instructions}
                          onChange={(e) =>
                            updateScheduleChange(
                              index,
                              "special_instructions",
                              e.target.value
                            )
                          }
                          placeholder="Enter any special instructions (optional)"
                          className="resize-none"
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeScheduleChange(index)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isCreating}>
            {isCreating ? "Creating..." : "Create Relocation"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 