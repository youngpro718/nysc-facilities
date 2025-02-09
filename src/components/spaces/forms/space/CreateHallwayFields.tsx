
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CreateSpaceFormData } from "../../schemas/createSpaceSchema";

interface CreateHallwayFieldsProps {
  form: UseFormReturn<CreateSpaceFormData>;
}

export function CreateHallwayFields({ form }: CreateHallwayFieldsProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="hallwayType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Hallway Type</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
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
        name="section"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Section</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
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
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Enter a detailed description of the hallway"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="maintenance_priority"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Maintenance Priority</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value || "low"}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
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
        name="maintenance_notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Maintenance Notes</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Enter any maintenance-related notes"
                value={field.value || ""}
                onChange={(e) => field.onChange(e.target.value)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Notes</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Any additional notes about the hallway"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
