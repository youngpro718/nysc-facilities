
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRooms } from "@/hooks/useRooms";
import { Loader2 } from "lucide-react";

interface RelocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormValues {
  original_room_id: string;
  temporary_room_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  relocation_type: "emergency" | "maintenance" | "other" | "construction";
  special_instructions?: string;
}

export function RelocationDialog({ open, onOpenChange }: RelocationDialogProps) {
  const form = useForm<FormValues>({
    defaultValues: {
      relocation_type: "maintenance"
    }
  });
  const queryClient = useQueryClient();
  const { data: rooms, isLoading: roomsLoading } = useRooms();

  const createRelocation = useMutation({
    mutationFn: async (values: FormValues) => {
      const { data, error } = await supabase
        .from('room_relocations')
        .insert({
          ...values,
          status: 'scheduled',
          notes: values.special_instructions
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relocations'] });
      toast.success('Relocation scheduled successfully');
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast.error('Failed to schedule relocation');
      console.error('Error creating relocation:', error);
    }
  });

  const onSubmit = (values: FormValues) => {
    createRelocation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Schedule Room Relocation</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="original_room_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Original Room</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={roomsLoading ? "Loading rooms..." : "Select room"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roomsLoading ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        ) : rooms?.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            Room {room.room_number} - {room.floors.buildings.name}, {room.floors.name}
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
                name="temporary_room_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temporary Room</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={roomsLoading ? "Loading rooms..." : "Select room"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roomsLoading ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        ) : rooms?.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            Room {room.room_number} - {room.floors.buildings.name}, {room.floors.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="relocation_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relocation Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="construction">Construction</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="special_instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Instructions (Optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Create Relocation
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
