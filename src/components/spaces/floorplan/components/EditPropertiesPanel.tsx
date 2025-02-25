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
import { FloorPlanObjectData, Position, SpaceType } from "../types/floorPlanTypes";
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
      status: selectedObject.properties?.status || 'active'
    }
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const table = selectedObject.type === 'door' ? 'doors' : 
                    selectedObject.type === 'hallway' ? 'hallways' : 
                    selectedObject.type === 'room' ? 'rooms' : 
                    'floor_plan_objects';

      console.log('Updating object:', {
        id: selectedObject.id,
        type: selectedObject.type,
        values
      });

      const { error } = await supabase
        .from(table)
        .update({
          label: values.label,
          position: { 
            x: Math.round(values.positionX), 
            y: Math.round(values.positionY) 
          },
          size: { 
            width: Math.round(values.width), 
            height: Math.round(values.height) 
          },
          rotation: values.rotation,
          properties: {
            ...selectedObject.properties,
            room_number: values.room_number,
            room_type: values.room_type,
            status: values.status
          }
        })
        .eq('id', selectedObject.id);

      if (error) throw error;
      
      console.log('Successfully updated object:', selectedObject.id);
      toast.success('Changes saved successfully');
      
      // Trigger the update callback to refresh the floor plan
      if (onUpdate) {
        onUpdate();
      }
      
      // Close the edit panel
      onClose();
    } catch (err) {
      console.error('Error updating object:', err);
      toast.error('Failed to save changes');
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
                      <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
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
