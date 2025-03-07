
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { CreateSpaceFormData } from "../../schemas/createSpaceSchema";
import { ConnectionFields } from "./ConnectionFields";

interface CreateHallwayFieldsProps {
  form: UseFormReturn<CreateSpaceFormData>;
}

export function CreateHallwayFields({ form }: CreateHallwayFieldsProps) {
  const floorId = form.watch("floorId");

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="section"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Hallway Section</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="left_wing">Left Wing</SelectItem>
                <SelectItem value="right_wing">Right Wing</SelectItem>
                <SelectItem value="connector">Connector</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="hallwayType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Access Type</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select hallway type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="public_main">Public (Main)</SelectItem>
                <SelectItem value="private">Private (Staff Only)</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="trafficFlow"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Traffic Flow</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select traffic flow type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="one_way">One Way</SelectItem>
                <SelectItem value="two_way">Two Way</SelectItem>
                <SelectItem value="restricted">Restricted</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="accessibility"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Accessibility</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select accessibility type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="fully_accessible">Fully Accessible</SelectItem>
                <SelectItem value="limited_access">Limited Access</SelectItem>
                <SelectItem value="stairs_only">Stairs Only</SelectItem>
                <SelectItem value="restricted">Restricted</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="emergencyRoute"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Emergency Route</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select emergency route type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="primary">Primary</SelectItem>
                <SelectItem value="secondary">Secondary</SelectItem>
                <SelectItem value="not_designated">Not Designated</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="capacityLimit"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Capacity Limit</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                placeholder="Enter capacity limit" 
                {...field} 
                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="maintenancePriority"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Maintenance Priority</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea placeholder="Enter description" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="border-t pt-4 mt-4">
        <h3 className="text-lg font-medium mb-4">Space Connections</h3>
        {floorId && <ConnectionFields form={form} floorId={floorId} />}
      </div>
    </div>
  );
}
