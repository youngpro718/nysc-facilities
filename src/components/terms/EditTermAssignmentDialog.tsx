import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { TermAssignment } from "@/types/terms";

const formSchema = z.object({
  justice_name: z.string().min(1, "Justice name is required"),
  part_id: z.string().optional(),
  room_id: z.string().optional(),
  phone: z.string().optional(),
  tel_extension: z.string().optional(),
  sergeant_name: z.string().optional(),
  clerk_names: z.string().optional().transform(val => 
    val ? val.split(",").map(name => name.trim()) : []
  ),
  fax: z.string().optional(),
});

interface EditTermAssignmentDialogProps {
  assignment: TermAssignment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTermAssignmentDialog({
  assignment,
  open,
  onOpenChange,
}: EditTermAssignmentDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Initialize the form with assignment data
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      justice_name: assignment.justice_name || "",
      part_id: assignment.part_id || "",
      room_id: assignment.room_id || "",
      phone: assignment.phone || "",
      tel_extension: assignment.tel_extension || "",
      sergeant_name: assignment.sergeant_name || "",
      clerk_names: assignment.clerk_names ? assignment.clerk_names.join(", ") : "",
      fax: assignment.fax || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      // Parse the form values through the schema to ensure transformations are applied
      const parsedValues = formSchema.parse(values);
      
      const { error } = await supabase
        .from("term_assignments")
        .update({
          justice_name: values.justice_name,
          part_id: values.part_id || null,
          room_id: values.room_id || null,
          phone: values.phone || null,
          tel_extension: values.tel_extension || null,
          sergeant_name: values.sergeant_name || null,
          clerk_names: parsedValues.clerk_names, // Use the transformed array value
          fax: values.fax || null,
        })
        .eq("id", assignment.id);

      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Assignment updated",
        description: "The term assignment has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["term-assignments", assignment.term_id] });
      queryClient.invalidateQueries({ queryKey: ["term", assignment.term_id] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update assignment: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Term Assignment</DialogTitle>
          <DialogDescription>
            Update the details for this court term assignment.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                name="part_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Part</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="room_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="sergeant_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sergeant</FormLabel>
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
                  <FormLabel>Court Officers (comma separated)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Name 1, Name 2, Name 3" />
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
                  <FormLabel>Fax (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
