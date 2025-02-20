import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EditSpaceFormData } from "../../schemas/editSpaceSchema";

interface StorageFieldsProps {
  form: UseFormReturn<EditSpaceFormData>;
}

export function StorageFields({ form }: StorageFieldsProps) {
  const isStorage = form.watch("isStorage");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Storage Configuration</h3>
        <p className="text-sm text-muted-foreground">
          Configure storage-related settings if this room is used for storage.
        </p>
      </div>

      <FormField
        control={form.control}
        name="isStorage"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Storage Room</FormLabel>
              <FormDescription>
                Enable if this room is used for storage purposes
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  if (!checked) {
                    // Reset storage-related fields when disabling storage
                    form.setValue("storageType", null);
                    form.setValue("storageCapacity", null);
                    form.setValue("storageNotes", null);
                  }
                }}
              />
            </FormControl>
          </FormItem>
        )}
      />

      {isStorage && (
        <div className="space-y-4 border-l-2 border-muted pl-4">
          <FormField
            control={form.control}
            name="storageType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Storage Type</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value || undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select storage type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="file_storage">File Storage</SelectItem>
                    <SelectItem value="equipment_storage">Equipment Storage</SelectItem>
                    <SelectItem value="supply_storage">Supply Storage</SelectItem>
                    <SelectItem value="evidence_storage">Evidence Storage</SelectItem>
                    <SelectItem value="record_storage">Record Storage</SelectItem>
                    <SelectItem value="general_storage">General Storage</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select the primary type of items stored in this room
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="storageCapacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Storage Capacity (cubic feet)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Enter storage capacity"
                    {...field}
                    onChange={e => field.onChange(parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Maximum storage capacity in cubic feet
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="storageNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Storage Notes</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter any additional storage-related notes"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Special requirements or notes about storage usage
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    </div>
  );
}
