
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const formSchema = z.object({
  label: z.string().min(1),
  room_number: z.string().optional(),
  room_type: z.string().optional(),
  status: z.string(),
  width: z.coerce.number().min(20),
  height: z.coerce.number().min(20),
  positionX: z.coerce.number(),
  positionY: z.coerce.number(),
  rotation: z.coerce.number(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditPropertiesPanelProps {
  object: any;
  selectedObject?: any;
  onClose: () => void;
  onUpdate: (values: any) => void;
  onPreview?: (values: any) => void;
}

export function EditPropertiesPanel({ 
  object, 
  selectedObject, 
  onClose, 
  onUpdate, 
  onPreview 
}: EditPropertiesPanelProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const objectToUse = selectedObject || object;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      label: objectToUse?.data?.label || objectToUse?.label || "",
      room_number: objectToUse?.data?.properties?.room_number || objectToUse?.properties?.room_number || "",
      room_type: objectToUse?.data?.properties?.room_type || objectToUse?.properties?.room_type || "default",
      status: objectToUse?.data?.properties?.status || objectToUse?.properties?.status || "active",
      width: objectToUse?.data?.size?.width || objectToUse?.size?.width || 100,
      height: objectToUse?.data?.size?.height || objectToUse?.size?.height || 100,
      positionX: objectToUse?.position?.x || 0,
      positionY: objectToUse?.position?.y || 0,
      rotation: objectToUse?.data?.rotation || objectToUse?.rotation || 0,
    },
  });

  // Preview changes as they happen
  const watchedValues = form.watch();
  
  // Call onPreview whenever watched values change
  if (onPreview) {
    onPreview(watchedValues);
  }

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      const nodeId = objectToUse.id;
      const nodeType = objectToUse.type;
      
      const table = nodeType === 'door' ? 'doors' : 
                    nodeType === 'hallway' ? 'hallways' : 
                    nodeType === 'room' ? 'rooms' : null;
      
      if (!table) {
        throw new Error(`Invalid node type: ${nodeType}`);
      }
      
      const updateData = {
        label: values.label,
        position: { x: values.positionX, y: values.positionY },
        size: { width: values.width, height: values.height },
        rotation: values.rotation,
        properties: {
          room_number: values.room_number,
          room_type: values.room_type,
          status: values.status,
        },
      };
      
      const { error } = await supabase
        .from(table)
        .update(updateData)
        .eq('id', nodeId);
      
      if (error) throw error;
      
      toast.success("Changes saved successfully");
      onUpdate(values);
    } catch (error) {
      console.error("Error updating properties:", error);
      toast.error("Failed to save changes");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="label"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Label</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
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
            name="room_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="office">Office</SelectItem>
                    <SelectItem value="conference">Conference Room</SelectItem>
                    <SelectItem value="storage">Storage</SelectItem>
                    <SelectItem value="courtroom">Courtroom</SelectItem>
                    <SelectItem value="default">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="width"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Width</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="height"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Height</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="positionX"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Position X</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="positionY"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Position Y</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="rotation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rotation (degrees)</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
