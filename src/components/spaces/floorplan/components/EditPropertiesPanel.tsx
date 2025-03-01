import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { FormButtons } from "@/components/ui/form-buttons";
import { ArrowLeft, Save } from "lucide-react";

export interface EditPropertiesPanelProps {
  object: any; // This is what the component expects
  onClose: () => void;
  onUpdate: (values: any) => void; // Update type signature to accept values parameter
  onPreview?: (values: any) => void;
}

export function EditPropertiesPanel({ object, onClose, onUpdate, onPreview }: EditPropertiesPanelProps) {
  const defaultValues = {
    label: object?.label || '',
    positionX: object?.position?.x.toString() || '0',
    positionY: object?.position?.y.toString() || '0',
    width: object?.size?.width.toString() || '100',
    height: object?.size?.height.toString() || '100',
    rotation: object?.rotation?.toString() || '0',
    room_number: object?.properties?.room_number || '',
    room_type: object?.properties?.room_type || '',
    status: object?.properties?.status || 'active',
  };

  const form = useForm({ defaultValues });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preview changes as the form values change
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (onPreview) {
        onPreview(value);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onPreview]);

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      // Here you would normally save the data to your backend
      console.log('Saving properties:', values);
      
      // Call the onUpdate callback to notify parent component
      onUpdate(values);
    } catch (error) {
      console.error('Error saving properties:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Edit Properties</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="label"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Object name" />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="positionX"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position X</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" />
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
                    <Input {...field} type="number" />
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
                    <Input {...field} type="number" />
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
                    <Input {...field} type="number" />
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
                  <Input {...field} type="number" min="0" max="360" />
                </FormControl>
              </FormItem>
            )}
          />

          {object?.type === 'room' && (
            <>
              <FormField
                control={form.control}
                name="room_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. 101" />
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
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select room type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="office">Office</SelectItem>
                          <SelectItem value="meeting">Meeting Room</SelectItem>
                          <SelectItem value="storage">Storage</SelectItem>
                          <SelectItem value="restroom">Restroom</SelectItem>
                          <SelectItem value="utility">Utility</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />
            </>
          )}
          
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <FormControl>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />

          <div className="pt-4 flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
