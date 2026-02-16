// @ts-nocheck
import { useForm } from "react-hook-form";
import { logger } from '@/lib/logger';
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

export interface EditPropertiesPanelProps {
  object: Record<string, unknown>;
  onClose: () => void;
  onUpdate: (data: Record<string, unknown>) => void;
  onPreview: (data: Record<string, unknown>) => void;
}

export function EditPropertiesPanel({
  object,
  onClose,
  onUpdate,
  onPreview,
}: EditPropertiesPanelProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm({
    defaultValues: {
      positionX: object?.position?.x?.toString() || "0",
      positionY: object?.position?.y?.toString() || "0",
      width: object?.data?.size?.width?.toString() || "0",
      height: object?.data?.size?.height?.toString() || "0",
      rotation: object?.rotation?.toString() || "0",
      room_number: object?.data?.properties?.room_number || "",
      room_type: object?.data?.properties?.room_type || "",
      status: object?.data?.properties?.status || "active",
    },
  });

  const onSubmit = async (data: Record<string, unknown>) => {
    setIsSubmitting(true);
    try {
      await onUpdate(data);
      onClose();
    } catch (error) {
      logger.error("Error updating properties:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preview changes as user types
  const handleFieldChange = form.handleSubmit((data) => {
    onPreview(data);
  });

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="fixed right-4 top-[calc(4rem+1rem)] bottom-4 w-80 p-0 border bg-background shadow-lg data-[state=open]:duration-300">
        <div className="flex flex-col h-full">
          <DialogHeader className="border-b p-4">
            <DialogTitle>Edit Properties</DialogTitle>
            <DialogDescription>
              Modify the properties of the selected object.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto p-4">
            <Form {...form}>
              <form onChange={handleFieldChange} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      </FormItem>
                    )}
                  />
                </div>

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
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="room_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room Type</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
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
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" size="sm" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
