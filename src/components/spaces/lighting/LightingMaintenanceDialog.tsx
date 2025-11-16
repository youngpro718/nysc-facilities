
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const maintenanceSchema = z.object({
  scheduled_date: z.string().min(1, "Maintenance date is required"),
  maintenance_type: z.enum([
    "routine",
    "repair",
    "replacement",
    "inspection",
    "emergency",
  ]),
  priority_level: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  estimated_duration: z.string().optional(),
  notes: z.string().optional(),
  parts_required: z.string().optional(),
});

type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

interface LightingMaintenanceDialogProps {
  fixtureId: string;
  fixtureName: string;
  onMaintenanceScheduled: () => void;
}

export function LightingMaintenanceDialog({ 
  fixtureId,
  fixtureName,
  onMaintenanceScheduled 
}: LightingMaintenanceDialogProps) {
  const [open, setOpen] = useState(false);
  const form = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      maintenance_type: "routine",
      priority_level: "normal",
      estimated_duration: "",
      notes: "",
      parts_required: ""
    },
  });

  const onSubmit = async (data: MaintenanceFormData) => {
    try {
      let partsRequired = [];
      try {
        partsRequired = data.parts_required ? JSON.parse(data.parts_required) : [];
      } catch {
        partsRequired = data.parts_required ? [data.parts_required] : [];
      }

      const { error } = await supabase
        .from('lighting_maintenance_schedules')
        .insert({
          fixture_id: fixtureId,
          scheduled_date: data.scheduled_date,
          maintenance_type: data.maintenance_type,
          priority_level: data.priority_level,
          estimated_duration: data.estimated_duration || null,
          notes: data.notes,
          parts_required: partsRequired,
          status: 'scheduled'
        });

      if (error) throw error;

      toast.success("Maintenance scheduled successfully");
      onMaintenanceScheduled();
      setOpen(false);
    } catch (error: any) {
      console.error('Error scheduling maintenance:', error);
      toast.error(error.message || "Failed to schedule maintenance");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Calendar className="h-4 w-4" />
          Schedule Maintenance
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Maintenance for {fixtureName}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="scheduled_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maintenance Date</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <Input type="date" {...field} />
                    </div>
                  </FormControl>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select maintenance type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="routine">Routine Check</SelectItem>
                      <SelectItem value="repair">Repair</SelectItem>
                      <SelectItem value="replacement">Replacement</SelectItem>
                      <SelectItem value="inspection">Safety Inspection</SelectItem>
                      <SelectItem value="emergency">Emergency Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priority_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
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
                  <FormLabel>Estimated Duration (hours)</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <Input type="number" step="0.5" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maintenance Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="parts_required"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parts Required (comma-separated)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., bulb, ballast, wiring kit" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Schedule Maintenance</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
