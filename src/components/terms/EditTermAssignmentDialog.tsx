
import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const editAssignmentSchema = z.object({
  justice_name: z.string().min(1, "Justice name is required"),
  clerk_names: z.string(),
  sergeant_name: z.string(),
  phone: z.string(),
  fax: z.string().optional(),
  part_code: z.string().min(1, "Part code is required"),
  room_number: z.string(),
});

type EditAssignmentFormValues = z.infer<typeof editAssignmentSchema>;

interface EditTermAssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: any;
  onSave: () => void;
}

export function EditTermAssignmentDialog({
  isOpen,
  onClose,
  assignment,
  onSave,
}: EditTermAssignmentDialogProps) {
  const form = useForm<EditAssignmentFormValues>({
    resolver: zodResolver(editAssignmentSchema),
    defaultValues: {
      justice_name: assignment?.justice_name || "",
      clerk_names: Array.isArray(assignment?.clerk_names) 
        ? assignment.clerk_names.join(", ") 
        : assignment?.clerk_names || "",
      sergeant_name: assignment?.sergeant_name || "",
      phone: assignment?.phone || "",
      fax: assignment?.fax || "",
      part_code: assignment?.court_parts?.part_code || "",
      room_number: assignment?.rooms?.room_number || "",
    },
  });

  const onSubmit = async (values: EditAssignmentFormValues) => {
    try {
      const { part_code, ...rest } = values;

      // Update the court part if it changed
      if (part_code !== assignment?.court_parts?.part_code) {
        const { data: partData } = await supabase
          .from('court_parts')
          .select('id')
          .eq('part_code', part_code)
          .maybeSingle();

        if (!partData) {
          const { data: newPart, error: createPartError } = await supabase
            .from('court_parts')
            .insert({
              part_code: part_code,
              description: `Part ${part_code}`
            })
            .select('id')
            .single();
            
          if (createPartError) throw createPartError;
          
          rest.part_id = newPart.id;
        } else {
          rest.part_id = partData.id;
        }
      }

      // Convert clerk names from string to array
      const clerkNames = values.clerk_names
        .split(",")
        .map(name => name.trim())
        .filter(Boolean);

      const { error } = await supabase
        .from('term_assignments')
        .update({
          ...rest,
          clerk_names: clerkNames,
        })
        .eq('id', assignment.id);

      if (error) throw error;

      toast.success("Assignment updated successfully");
      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast.error("Failed to update assignment");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Term Assignment</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="part_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Part Code</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. IDV, TAP A, MDC-92" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="justice_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Justice Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="room_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="(6)4051" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="fax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fax</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                  <FormLabel>Sergeant (Last Name Only)</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                  <FormLabel>Clerks (Initial and Last Name, comma separated)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="T. Smith, J. Doe" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
