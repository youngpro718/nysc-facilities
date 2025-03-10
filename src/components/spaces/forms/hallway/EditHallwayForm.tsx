
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { EditSpaceFormData, editSpaceSchema } from "../../schemas/editSpaceSchema";
import { supabase } from "@/integrations/supabase/client";
import { CreateHallwayFields } from "../../forms/space/CreateHallwayFields";

interface EditHallwayFormProps {
  id: string;
  initialData: Partial<EditSpaceFormData>;
  onSuccess?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export function EditHallwayForm({
  id,
  initialData,
  onSuccess,
  onCancel,
  onClose,
}: EditHallwayFormProps) {
  const queryClient = useQueryClient();
  
  const form = useForm<EditSpaceFormData>({
    resolver: zodResolver(editSpaceSchema),
    defaultValues: {
      ...initialData,
      type: "hallway", // Force type to be hallway for the edit form
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [form, initialData]);

  const hallwayMutation = useMutation({
    mutationFn: async (data: EditSpaceFormData) => {
      if (data.type !== 'hallway') {
        throw new Error('Invalid space type for hallway edit form');
      }
      
      console.log('Updating hallway with data:', data);
      
      // First update the basic space data
      const spaceData = {
        name: data.name,
        status: data.status,
        position: data.position || { x: 0, y: 0 },
        size: data.size || { width: 300, height: 50 },
        rotation: data.rotation || 0,
        properties: {
          description: data.description
        }
      };

      const { error: spaceError } = await supabase
        .from('new_spaces')
        .update(spaceData)
        .eq('id', id);

      if (spaceError) throw spaceError;

      // Then update the hallway-specific properties
      const hallwayProps = {
        section: data.section || 'connector',
        traffic_flow: data.trafficFlow || 'two_way',
        accessibility: data.accessibility || 'fully_accessible',
        emergency_route: data.emergencyRoute || 'not_designated',
        maintenance_priority: data.maintenancePriority || 'low',
        capacity_limit: data.capacityLimit,
        space_type: 'hallway'
      };

      // Check if hallway properties exist for this space
      const { data: existingProps, error: checkError } = await supabase
        .from('hallway_properties')
        .select('*')
        .eq('space_id', id)
        .maybeSingle();

      if (checkError) throw checkError;

      // Insert or update hallway properties
      if (existingProps) {
        const { error: updateError } = await supabase
          .from('hallway_properties')
          .update(hallwayProps)
          .eq('space_id', id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('hallway_properties')
          .insert([{ ...hallwayProps, space_id: id }]);

        if (insertError) throw insertError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hallways'] });
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      toast.success("Hallway updated successfully");
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      console.error("Update error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update hallway");
    },
  });

  const handleSubmit = async (data: EditSpaceFormData) => {
    await hallwayMutation.mutateAsync(data);
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    if (onClose) onClose();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <CreateHallwayFields form={form} />
        
        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={hallwayMutation.isPending || !form.formState.isDirty}
          >
            {hallwayMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
