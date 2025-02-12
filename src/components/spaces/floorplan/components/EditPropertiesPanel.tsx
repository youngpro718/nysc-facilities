
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { FloorPlanObjectData } from "../types/floorPlanTypes";
import { useForm } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Slider } from "@/components/ui/slider";
import { Building2, Move, RotateCw, Link2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface EditPropertiesPanelProps {
  selectedObject: FloorPlanObjectData & { 
    id: string;
    position?: Position;
    rotation?: number;
  };
  onClose: () => void;
  onUpdate: () => void;
}

interface FormValues {
  label: string;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  rotation: number;
  room_number?: string;
  room_type?: string;
  status: string;
}

export function EditPropertiesPanel({ selectedObject, onClose, onUpdate }: EditPropertiesPanelProps) {
  const form = useForm<FormValues>({
    defaultValues: {
      label: selectedObject.label || '',
      positionX: selectedObject.position?.x || 0,
      positionY: selectedObject.position?.y || 0,
      width: selectedObject.size?.width || 150,
      height: selectedObject.size?.height || 100,
      rotation: selectedObject.rotation || 0,
      room_number: selectedObject.properties?.room_number || '',
      room_type: selectedObject.properties?.room_type || 'default',
      status: selectedObject.properties?.status || 'active',
    }
  });

  const onSubmit = async (data: FormValues) => {
    try {
      console.log('Selected object:', selectedObject);
      console.log('Form data:', data);

      const updateData = {
        label: data.label,
        type: selectedObject.type,
        position: JSON.stringify({
          x: Number(data.positionX),
          y: Number(data.positionY)
        }),
        size: JSON.stringify({
          width: Number(data.width),
          height: Number(data.height)
        }),
        rotation: Number(data.rotation),
        properties: JSON.stringify({
          room_number: data.room_number,
          room_type: data.room_type,
          status: data.status
        }),
        style: selectedObject.style
      };

      console.log('Sending update data:', updateData);

      const { data: result, error } = await supabase
        .from('floor_plan_objects')
        .update(updateData)
        .eq('id', selectedObject.id)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Update result:', result);

      toast.success('Properties updated successfully');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating properties:', error);
      toast.error('Failed to update properties');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Basic Information
            </h3>
            
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedObject.type === 'room' && (
              <>
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
                      <FormLabel>Room Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select room type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Room Types</SelectLabel>
                            <SelectItem value="office">Office</SelectItem>
                            <SelectItem value="meeting">Meeting Room</SelectItem>
                            <SelectItem value="storage">Storage</SelectItem>
                            <SelectItem value="utility">Utility Room</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>

          {/* Position and Size */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Move className="h-4 w-4" />
              Position & Size
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="positionX"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>X Position</FormLabel>
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
                    <FormLabel>Y Position</FormLabel>
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
                name="width"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Width</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        min={selectedObject.type === 'door' ? 40 : 100}
                      />
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
                      <Input 
                        type="number" 
                        {...field}
                        min={selectedObject.type === 'door' ? 15 : 100}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Rotation */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <RotateCw className="h-4 w-4" />
              Rotation
            </h3>
            
            <FormField
              control={form.control}
              name="rotation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rotation (degrees)</FormLabel>
                  <FormControl>
                    <Slider
                      min={0}
                      max={360}
                      step={1}
                      value={[field.value]}
                      onValueChange={(vals) => field.onChange(vals[0])}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Status */}
          <div className="space-y-4">
            <h3 className="font-medium">Status</h3>
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
