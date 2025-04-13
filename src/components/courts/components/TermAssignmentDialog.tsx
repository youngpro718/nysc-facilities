import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { XIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { TermAssignment, CourtPart } from '../types/termTypes';
import { TermRoomPicker } from './TermRoomPicker';

// Form schema using zod
const formSchema = z.object({
  justice_name: z.string().min(1, 'Justice name is required'),
  part_id: z.string().min(1, 'Court part is required'),
  room_id: z.string().min(1, 'Room assignment is required'),
  fax: z.string().optional(),
  phone: z.string().optional(),
  tel_extension: z.string().optional(),
  sergeant_name: z.string().optional(),
  clerk_names: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface TermAssignmentDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (assignment: Partial<TermAssignment>) => void;
  termId: string;
  assignment?: TermAssignment;
  isEdit?: boolean;
}

export function TermAssignmentDialog({
  open,
  onClose,
  onSave,
  termId,
  assignment,
  isEdit = false,
}: TermAssignmentDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [parts, setParts] = useState<CourtPart[]>([]);

  // Initialize the form with default values or existing assignment data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: assignment
      ? {
          justice_name: assignment.justice_name,
          part_id: assignment.part_id,
          room_id: assignment.room_id,
          fax: assignment.fax || '',
          phone: assignment.phone || '',
          tel_extension: assignment.tel_extension || '',
          sergeant_name: assignment.sergeant_name || '',
          clerk_names: Array.isArray(assignment.clerk_names) 
            ? assignment.clerk_names.join(', ') 
            : assignment.clerk_names || '',
        }
      : {
          justice_name: '',
          part_id: '',
          room_id: '',
          fax: '',
          phone: '',
          tel_extension: '',
          sergeant_name: '',
          clerk_names: '',
        },
  });

  // Fetch court parts on component mount
  useEffect(() => {
    async function fetchParts() {
      try {
        const { data, error } = await supabase
          .from('court_parts')
          .select('*')
          .order('part_code', { ascending: true });
        
        if (error) throw error;
        setParts(data || []);
      } catch (error) {
        console.error('Error fetching court parts:', error);
        toast({
          title: 'Error',
          description: 'Failed to load court parts. Please try again.',
          variant: 'destructive',
        });
      }
    }

    if (open) {
      fetchParts();
    }
  }, [open, toast]);

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      // Process clerk names from string to array
      const clerkNamesArray = values.clerk_names
        ? values.clerk_names.split(',').map(name => name.trim())
        : [];

      // Prepare the assignment data
      const assignmentData: Partial<TermAssignment> = {
        ...values,
        term_id: termId,
        clerk_names: clerkNamesArray,
      };

      // Call the onSave prop with the assignment data
      await onSave(assignmentData);
      
      toast({
        title: isEdit ? 'Assignment Updated' : 'Assignment Created',
        description: `Court assignment for ${values.justice_name} has been ${isEdit ? 'updated' : 'created'}.`,
      });
      
      onClose();
    } catch (error) {
      console.error('Error saving assignment:', error);
      toast({
        title: 'Error',
        description: 'Failed to save assignment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Court Assignment' : 'New Court Assignment'}
          </DialogTitle>
          <DialogDescription>
            {isEdit 
              ? 'Update the details for this court assignment.' 
              : 'Assign a justice to a court part and room for this term.'}
          </DialogDescription>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2"
            onClick={onClose}
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="justice_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Justice Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter justice name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="part_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Court Part</FormLabel>
                  <FormControl>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      {...field}
                    >
                      <option value="">Select a part</option>
                      {parts.map(part => (
                        <option key={part.id} value={part.id}>
                          {part.part_code} - {part.description || ''}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="room_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Assignment</FormLabel>
                  <FormControl>
                    <TermRoomPicker
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tel_extension"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Extension</FormLabel>
                    <FormControl>
                      <Input placeholder="Extension" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="fax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fax</FormLabel>
                  <FormControl>
                    <Input placeholder="Fax number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sergeant_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sergeant at Arms</FormLabel>
                  <FormControl>
                    <Input placeholder="Sergeant name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clerk_names"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clerks</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter clerk names separated by commas" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : isEdit ? 'Update' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
