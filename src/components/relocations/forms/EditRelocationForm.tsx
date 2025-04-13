import { z } from "zod";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"; // Import necessary form components
import { FormButtons } from "@/components/ui/form-buttons";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from "@/components/ui/skeleton"; // Skeleton for loading state
import toast from 'react-hot-toast'; // Import toast
import { Database } from '@/types/supabase'; // Import Database type

// Derive types from Supabase schema
type Relocation = Database['public']['Tables']['room_relocations']['Row'];
type RelocationStatus = Database['public']['Tables']['room_relocations']['Row']['status'];

// Define a schema for the edit relocation form
export const editRelocationSchema = z.object({
  id: z.string(),
  original_room_id: z.string().uuid('Invalid UUID format'),
  target_room_id: z.string().uuid('Invalid UUID format').nullable().optional(),
  scheduled_start_date: z.string().optional().nullable(),
  scheduled_end_date: z.string().optional().nullable(),
  actual_start_date: z.string().optional().nullable(),
  actual_end_date: z.string().optional().nullable(),
  status: z.enum(["planning", "scheduled", "in_progress", "on_hold", "completed", "cancelled"], { 
    required_error: "Status is required",
  }),
  reason: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  occupants_involved: z.array(z.string()).optional().nullable(), // Assuming array of occupant IDs
  is_multi_phase: z.boolean().default(false),
  phases: z.array(z.any()).optional().nullable(), // Define phase structure if known
  dependencies: z.array(z.any()).optional(), // Define dependency structure if known
  equipment_transfers: z.array(z.any()).optional(), // Define equipment transfer structure if known
});

// Export the type
export type EditRelocationFormData = z.infer<typeof editRelocationSchema>;

interface EditRelocationFormProps {
  id: string;
}

const fetchRelocation = async (id: string): Promise<Relocation | null> => {
  // Explicitly defining return type
  const { data, error } = await supabase
    .from('room_relocations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    toast.error(`Error fetching relocation: ${error.message}`);
    throw new Error('Failed to fetch relocation data');
  }
  return data;
};

const updateRelocation = async ({ id, ...updateData }: { id: string } & Partial<EditRelocationFormData>) => {
  const { data, error } = await supabase
    .from('room_relocations')
    .update(updateData as Partial<Relocation>) // Explicitly cast updateData
    .eq('id', id)
    .select()
    .single(); // Select the updated record

  if (error) {
    throw new Error(error.message); // Throw error to be caught by onError
  }
  return data;
};

export function EditRelocationForm({ id }: EditRelocationFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  if (!id) {
    toast.error('Relocation ID is missing.');
    navigate('/relocations'); // Navigate back to the dashboard
    return null; // Render nothing or a loading/error state
  }

  const { data: relocationData, isLoading: isLoadingRelocation, error: fetchError } = useQuery<Relocation | null, Error>({
    // Explicitly defining query types
    queryKey: ['relocation', id],
    queryFn: () => fetchRelocation(id),
    enabled: !!id, // Only run query if id is available
  });

  const form = useForm<EditRelocationFormData>({
    resolver: zodResolver(editRelocationSchema),
    defaultValues: { 
      id: '',
      original_room_id: '',
      target_room_id: '',
      scheduled_start_date: '',
      scheduled_end_date: '',
      actual_start_date: '',
      actual_end_date: '',
      reason: '',
      notes: '',
      occupants_involved: [] as string[], // Ensure proper typing
      is_multi_phase: false as boolean,
      phases: [] as any[], // Ensure proper typing
      dependencies: [] as any[], // Ensure proper typing
      equipment_transfers: [] as any[], // Ensure proper typing
      status: 'scheduled' as RelocationStatus, // Default or ensure type match
    },
  });

  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    // Reset form with fetched data when available and not already resetting
    if (relocationData && !isResetting) {
      setIsResetting(true);
      // Ensure array fields default to [] if null/undefined in fetched data
      form.reset({
        ...relocationData,
        // Ensure dates are strings or empty strings, not null
        scheduled_start_date: relocationData.scheduled_start_date ?? '',
        scheduled_end_date: relocationData.scheduled_end_date ?? '',
        actual_start_date: relocationData.actual_start_date ?? '',
        actual_end_date: relocationData.actual_end_date ?? '',
        // Ensure Json fields that should be arrays are initialized correctly
        phases: Array.isArray(relocationData.phases) ? relocationData.phases : [],
        dependencies: Array.isArray(relocationData.dependencies) ? relocationData.dependencies : [],
        equipment_transfers: Array.isArray(relocationData.equipment_transfers) ? relocationData.equipment_transfers : [],
        occupants_involved: Array.isArray(relocationData.occupants_involved) ? relocationData.occupants_involved : [],
      });
      setIsResetting(false);
    }
  }, [relocationData, form, isResetting]);

  const mutation = useMutation({
    mutationFn: updateRelocation,
    onSuccess: (updatedRelocation) => {
      toast.success('Relocation updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['relocations'] }); // Invalidate the list
      queryClient.invalidateQueries({ queryKey: ['relocation', id] }); // Invalidate this specific relocation
      navigate(`/relocations/${id}`); // Navigate back to the details page
    },
    onError: (error) => {
      console.error("Update failed:", error);
      toast.error(`Failed to update relocation: ${error.message}`);
    },
  });

  const onSubmit = (data: EditRelocationFormData) => {
    console.log("Submitting update:", data);
    mutation.mutate({ id, ...data });
  };

  if (isLoadingRelocation) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-10 w-1/5" />
      </div>
    );
  }

  if (fetchError || !relocationData) {
    return <div className="p-6 text-red-600">Error loading relocation data. Please try again.</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6">
        <h2 className="text-2xl font-semibold mb-4">Edit Relocation</h2>

        <FormField
          control={form.control}
          name="original_room_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Original Room ID</FormLabel>
              <FormControl>
                <Input type="text" {...field} disabled />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="target_room_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target Room ID</FormLabel>
              <FormControl>
                {/* Allow null for optional target room */}
                <Input type="text" {...field} value={field.value ?? ''} disabled />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="scheduled_start_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Scheduled Start Date</FormLabel>
              <FormControl>
                {/* Ensure value is handled correctly, maybe use react-day-picker */}
                <Input type="date" {...field} value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="scheduled_end_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Scheduled End Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="actual_start_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Actual Start Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="actual_end_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Actual End Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason</FormLabel>
              <FormControl>
                <Input type="text" {...field} />
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
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <FormControl>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Add fields for occupants_involved, is_multi_phase, phases, dependencies, equipment_transfers if editable */}
        {/* Example for boolean (is_multi_phase):
             <FormField
               control={form.control}
               name="is_multi_phase"
               render={({ field }) => (
                 <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                   <div className="space-y-0.5">
                     <FormLabel className="text-base">
                       Multi-Phase Relocation
                     </FormLabel>
                     <FormDescription>
                       Does this relocation involve multiple phases?
                     </FormDescription>
                   </div>
                   <FormControl>
                     <Switch
                       checked={field.value}
                       onCheckedChange={field.onChange}
                     />
                   </FormControl>
                 </FormItem>
               )}
             />
         */}

        <FormButtons
          onCancel={() => navigate(`/relocations/${id}`)} // Navigate back to details on cancel
          submitLabel="Update Relocation" // Correct prop name
          isSubmitting={mutation.isPending}
        />
      </form>
    </Form>
  );
}
