
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const scheduleSchema = z.object({
  fixture_id: z.string({
    required_error: "Please select a fixture",
  }),
  maintenance_type: z.string({
    required_error: "Please select a maintenance type",
  }),
  scheduled_date: z.date({
    required_error: "Please select a date",
  }),
  estimated_duration: z.number().min(1).optional(),
  priority_level: z.enum(["low", "medium", "high"], {
    required_error: "Please select a priority level",
  }),
  notes: z.string().optional(),
  assigned_technician: z.string().optional(),
  notify_technician: z.boolean().default(false),
  parts_required: z.array(z.string()).default([]),
});

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

interface ScheduleMaintenanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fixturePrefill?: string;
}

export function ScheduleMaintenanceDialog({
  open,
  onOpenChange,
  fixturePrefill,
}: ScheduleMaintenanceDialogProps) {
  const queryClient = useQueryClient();
  
  // Fetch lighting fixtures
  const { data: fixtures, isLoading: loadingFixtures } = useQuery({
    queryKey: ['fixtures-for-maintenance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lighting_fixtures')
        .select('id, name, type, status, floor_id, zone_id')
        .order('name');
        
      if (error) throw error;
      return data || [];
    }
  });
  
  // Fetch technicians
  const { data: technicians, isLoading: loadingTechnicians } = useQuery({
    queryKey: ['technicians'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .order('last_name');
        
      if (error) throw error;
      return data || [];
    }
  });
  
  // Form setup
  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      fixture_id: fixturePrefill || "",
      maintenance_type: "",
      priority_level: "medium",
      notes: "",
      notify_technician: true,
      parts_required: [],
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: async (values: ScheduleFormValues) => {
      // In a real implementation, insert into lighting_maintenance_schedules
      const { data, error } = await supabase
        .from('lighting_maintenance_schedules')
        .insert({
          fixture_id: values.fixture_id,
          maintenance_type: values.maintenance_type,
          scheduled_date: values.scheduled_date.toISOString(),
          estimated_duration: values.estimated_duration ? 
            `${values.estimated_duration} minutes` : null,
          priority_level: values.priority_level,
          notes: values.notes || null,
          assigned_technician: values.assigned_technician || null,
          status: 'scheduled',
          parts_required: values.parts_required.length > 0 ? 
            values.parts_required.map(part => ({ name: part })) : []
        })
        .select();
        
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Maintenance successfully scheduled");
      queryClient.invalidateQueries({ queryKey: ['upcoming-maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-calendar-events'] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Failed to schedule maintenance: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  });

  const onSubmit = (data: ScheduleFormValues) => {
    scheduleMutation.mutate(data);
  };
  
  const maintenanceTypes = [
    { value: "bulb_replacement", label: "Bulb Replacement" },
    { value: "ballast_repair", label: "Ballast Repair" },
    { value: "wiring_inspection", label: "Wiring Inspection" },
    { value: "fixture_replacement", label: "Fixture Replacement" },
    { value: "emergency_lighting_test", label: "Emergency Lighting Test" },
    { value: "regular_inspection", label: "Regular Inspection" },
  ];
  
  const commonParts = [
    { id: "led_bulb", name: "LED Bulb" },
    { id: "fluorescent_tube", name: "Fluorescent Tube" },
    { id: "ballast", name: "Ballast" },
    { id: "wiring_kit", name: "Wiring Kit" },
    { id: "fixture_housing", name: "Fixture Housing" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Schedule Maintenance</DialogTitle>
          <DialogDescription>
            Plan maintenance tasks for lighting fixtures in your facility.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fixture_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fixture</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={loadingFixtures}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select fixture" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {fixtures?.map((fixture) => (
                          <SelectItem key={fixture.id} value={fixture.id}>
                            {fixture.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="maintenance_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maintenance Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select maintenance type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {maintenanceTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="scheduled_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
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
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
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
                name="priority_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
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
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="assigned_technician"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign To</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={loadingTechnicians}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select technician" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {technicians?.map((tech) => (
                          <SelectItem key={tech.id} value={tech.id}>
                            {tech.first_name} {tech.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="estimated_duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Est. Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="60"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                      />
                    </FormControl>
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
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any specific instructions or requirements"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notify_technician"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Notify Technician</FormLabel>
                    <FormDescription>
                      Send an email notification to the assigned technician
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={scheduleMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={scheduleMutation.isPending}>
                {scheduleMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  "Schedule Maintenance"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
