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
import { supabase } from '@/lib/supabase';
import {
  Dialog,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { ModalFrame } from '@shared/components/common/common/ModalFrame';
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
import { useStaffTasks } from '@features/tasks/hooks/useStaffTasks';
import { TASK_TYPE_LABELS } from '@features/tasks/types/staffTasks';
import type { TaskType } from '@features/tasks/types/staffTasks';
import { LIMITS } from '@/config';

// Types surfaced to standard users. General is too vague; Maintenance lives in /issues.
const REQUEST_TASK_TYPES: TaskType[] = ['move_item', 'delivery', 'pickup', 'setup'];

const MOVE_ITEM_CATEGORIES = [
  'Desk',
  'Chair',
  'Locker',
  'Filing Cabinet',
  'Boxes / Files',
  'Other',
] as const;

const requestTaskSchema = z.object({
  title: z.string().min(1, 'Please describe what you need'),
  description: z.string().optional(),
  task_type: z.enum(['move_item', 'delivery', 'setup', 'pickup']),
  move_category: z.string().optional(),
  inventory_item_id: z.string().optional(),
  from_room_id: z.string().optional(),
  to_room_id: z.string().optional(),
  quantity: z.number().min(1).optional(),
}).refine(
  (data) => data.task_type !== 'move_item' || !!data.move_category,
  { message: 'Pick what you need moved', path: ['move_category'] }
);

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
      task_type: 'move_item',
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
        .limit(LIMITS.roomsDropdown);
      
      if (error) throw error;
      return data || [];
    },
  });

  const onSubmit = async (data: RequestTaskFormData) => {
    // Prefix move-item category onto the title so staff see what's being moved at a glance.
    const finalTitle = data.task_type === 'move_item' && data.move_category
      ? `Move ${data.move_category}: ${data.title}`
      : data.title;

    await requestTask.mutateAsync({
      title: finalTitle,
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
  const showFromRoom = ['move_item', 'pickup'].includes(taskType);
  const showToRoom = ['move_item', 'delivery'].includes(taskType);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Make a Request
          </Button>
        )}
      </DialogTrigger>
      <ModalFrame
        title="Make a Request"
        description="Submit a request and the court aides will assist you."
        size="md"
      >

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
                      {REQUEST_TASK_TYPES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {TASK_TYPE_LABELS[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {taskType === 'move_item' && (
              <FormField
                control={form.control}
                name="move_category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What's being moved? *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pick a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MOVE_ITEM_CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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

            {(showFromRoom || showToRoom) && (
              <div className={`grid ${showFromRoom && showToRoom ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                {showFromRoom && (
                <FormField
                  control={form.control}
                  name="from_room_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Room</FormLabel>
                      <Select 
                        onValueChange={(val) => field.onChange(val === '__none__' ? undefined : val)} 
                        value={field.value || '__none__'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select room" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__">Not specified</SelectItem>
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
                />)}

                {showToRoom && (
                  control={form.control}
                  name="to_room_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To Room</FormLabel>
                      <Select 
                        onValueChange={(val) => field.onChange(val === '__none__' ? undefined : val)} 
                        value={field.value || '__none__'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select room" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="__none__">Not specified</SelectItem>
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
      </ModalFrame>
    </Dialog>
  );
}
