/**
 * RequestTaskDialog Component
 * 
 * Dialog for regular users to request tasks
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { useStaffTasks } from '@/hooks/useStaffTasks';
import { TASK_TYPE_LABELS } from '@/types/staffTasks';
import type { TaskType } from '@/types/staffTasks';

const requestTaskSchema = z.object({
  title: z.string().min(1, 'Please describe what you need'),
  description: z.string().optional(),
  task_type: z.enum(['move_item', 'delivery', 'setup', 'pickup', 'maintenance', 'general']),
  inventory_item_id: z.string().optional(),
  from_room_id: z.string().optional(),
  to_room_id: z.string().optional(),
  quantity: z.number().min(1).optional(),
});

type RequestTaskFormData = z.infer<typeof requestTaskSchema>;

interface RequestTaskDialogProps {
  trigger?: React.ReactNode;
}

export function RequestTaskDialog({ trigger }: RequestTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const { requestTask } = useStaffTasks();

  const form = useForm<RequestTaskFormData>({
    resolver: zodResolver(requestTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      task_type: 'general',
      quantity: 1,
    },
  });

  // Fetch rooms for location selection
  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('id, room_number, name')
        .order('room_number')
        .limit(200);
      
      if (error) throw error;
      return data || [];
    },
  });

  const onSubmit = async (data: RequestTaskFormData) => {
    await requestTask.mutateAsync({
      title: data.title,
      description: data.description,
      task_type: data.task_type as TaskType,
      inventory_item_id: data.inventory_item_id || undefined,
      from_room_id: data.from_room_id || undefined,
      to_room_id: data.to_room_id || undefined,
      quantity: data.quantity,
    });
    setOpen(false);
    form.reset();
  };

  const taskType = form.watch('task_type');
  const showLocationFields = ['move_item', 'delivery', 'pickup'].includes(taskType);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Request Task
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Request a Task</DialogTitle>
          <DialogDescription>
            Submit a request and our facilities team will help you.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="task_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What do you need help with? *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(TASK_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
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
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brief Description *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Move desk from Room 101 to Room 205" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Details</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any other information that might help..."
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Include any special instructions or timing preferences
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showLocationFields && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="from_room_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Room</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select room" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Not specified</SelectItem>
                          {rooms.map((room) => (
                            <SelectItem key={room.id} value={room.id}>
                              {room.room_number}
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
                  name="to_room_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To Room</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select room" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Not specified</SelectItem>
                          {rooms.map((room) => (
                            <SelectItem key={room.id} value={room.id}>
                              {room.room_number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={requestTask.isPending}>
                {requestTask.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Submit Request
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
