
import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StorageTypeEnum } from "../../rooms/types/roomEnums";
import { RoomFormData } from "./RoomFormSchema";
import { useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StorageFieldsProps {
  form: UseFormReturn<RoomFormData>;
}

export function StorageFields({ form }: StorageFieldsProps) {
  const isStorage = form.watch("isStorage");
  const storageType = form.watch("storageType");

  // Reset storage fields when isStorage is toggled off
  useEffect(() => {
    if (!isStorage) {
      form.setValue("storageType", null, { shouldValidate: true });
      form.setValue("storageCapacity", null, { shouldValidate: true });
      form.setValue("storageNotes", null, { shouldValidate: true });
    } else if (!storageType) {
      // Set default storage type when toggling on
      form.setValue("storageType", StorageTypeEnum.GENERAL, { shouldValidate: true });
    }
  }, [isStorage, form, storageType]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Storage Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="isStorage"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Storage Room</FormLabel>
                <FormDescription>
                  Designate this room as a storage space
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {isStorage && (
          <>
            <FormField
              control={form.control}
              name="storageType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Storage Type</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value || null)}
                    value={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select storage type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(StorageTypeEnum).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Type of storage for inventory management</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="storageCapacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Storage Capacity (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      value={field.value ?? ''}
                      placeholder="Enter capacity value"
                      min={0}
                    />
                  </FormControl>
                  <FormDescription>Capacity in cubic feet</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="storageNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Storage Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ''}
                      placeholder="Add notes about storage requirements or contents"
                      className="resize-vertical"
                    />
                  </FormControl>
                  <FormDescription>Additional storage information</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
