
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
            <FormLabel>Section</FormLabel>
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
            <FormLabel>Hallway Type</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select hallway type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="public_main">Public Main</SelectItem>
                <SelectItem value="private">Private</SelectItem>
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
