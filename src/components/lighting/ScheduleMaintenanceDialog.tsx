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
import { Calendar, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  scheduled_maintenance_date: z.string().min(1, "Maintenance date is required"),
  maintenance_frequency_days: z.number().min(1, "Frequency must be at least 1 day"),
  maintenance_notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

type LightingFixture = {
  id: string;
  name: string;
  type: "standard" | "emergency" | "motion_sensor";
  status: string;
  maintenance_notes?: string | null;
};

interface ScheduleMaintenanceDialogProps {
  fixture: LightingFixture;
  onMaintenanceScheduled: () => void;
}

export function ScheduleMaintenanceDialog({ 
  fixture, 
  onMaintenanceScheduled 
}: ScheduleMaintenanceDialogProps) {
  const [open, setOpen] = useState(false);
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      scheduled_maintenance_date: "",
      maintenance_frequency_days: 90,
      maintenance_notes: fixture.maintenance_notes || "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const { error } = await supabase
        .from('lighting_fixtures')
        .update({
          scheduled_maintenance_date: data.scheduled_maintenance_date,
          maintenance_frequency_days: data.maintenance_frequency_days,
          maintenance_notes: data.maintenance_notes,
          last_scheduled_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', fixture.id);

      if (error) throw error;

      toast.success("Maintenance scheduled successfully");
      onMaintenanceScheduled();
      setOpen(false);
    } catch (error: any) {
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
          <DialogTitle>Schedule Maintenance for {fixture.name}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="scheduled_maintenance_date"
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
              name="maintenance_frequency_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maintenance Frequency (days)</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value))}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maintenance_notes"
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
            <Button type="submit">Schedule Maintenance</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}