import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreateShutdownDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courtroomId: string;
  roomNumber: string;
}

interface ShutdownForm {
  title: string;
  reason: string;
  start_date: Date;
  end_date?: Date;
  description?: string;
  impact_level: string;
  temporary_location?: string;
}

export function CreateShutdownDialog({ 
  open, 
  onOpenChange, 
  courtroomId, 
  roomNumber 
}: CreateShutdownDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<ShutdownForm>({
    defaultValues: {
      impact_level: 'medium'
    }
  });

  const startDate = watch('start_date');
  const endDate = watch('end_date');

  const createShutdownMutation = useMutation({
    mutationFn: async (data: ShutdownForm) => {
      const { data: result, error } = await supabase
        .from('room_shutdowns')
        .insert({
          court_room_id: courtroomId,
          title: data.title,
          reason: data.reason,
          start_date: data.start_date.toISOString().split('T')[0],
          end_date: data.end_date?.toISOString().split('T')[0] || null,
          description: data.description || null,
          impact_level: data.impact_level,
          temporary_location: data.temporary_location || null
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Shutdown Created",
        description: `Shutdown scheduled for Room ${roomNumber}`,
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['room-shutdowns'] });
      queryClient.invalidateQueries({ queryKey: ['courtroom-availability'] });
      reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create shutdown: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: ShutdownForm) => {
    createShutdownMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Schedule Shutdown for Room {roomNumber}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                {...register('title', { required: 'Title is required' })}
                placeholder="e.g., HVAC System Maintenance"
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason *</Label>
              <Select onValueChange={(value) => setValue('reason', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="project">Construction Project</SelectItem>
                  <SelectItem value="cleaning">Deep Cleaning</SelectItem>
                  <SelectItem value="emergency">Emergency Repair</SelectItem>
                  <SelectItem value="inspection">Safety Inspection</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Select start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      if (date) {
                        setValue('start_date', date);
                        setStartDateOpen(false);
                      }
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Select end date (optional)"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setValue('end_date', date || undefined);
                      setEndDateOpen(false);
                    }}
                    disabled={(date) => date < (startDate || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="impact_level">Impact Level</Label>
              <Select 
                defaultValue="medium"
                onValueChange={(value) => setValue('impact_level', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Minor disruption</SelectItem>
                  <SelectItem value="medium">Medium - Moderate disruption</SelectItem>
                  <SelectItem value="high">High - Significant disruption</SelectItem>
                  <SelectItem value="critical">Critical - Full closure</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="temporary_location">Temporary Location</Label>
              <Input
                id="temporary_location"
                {...register('temporary_location')}
                placeholder="e.g., Room 205"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Additional details about the shutdown..."
              className="min-h-[100px]"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createShutdownMutation.isPending}
            >
              {createShutdownMutation.isPending ? "Creating..." : "Create Shutdown"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}