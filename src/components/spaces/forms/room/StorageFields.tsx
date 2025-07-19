
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
import { 
  StorageTypeEnum, 
  SimplifiedStorageTypeEnum,
  CapacitySizeCategoryEnum,
  getSimplifiedStorageTypeDescription,
  getCapacitySizeDescription,
  capacitySizeToCubicFeet
} from "../../rooms/types/roomEnums";
import { RoomFormData } from "./RoomFormSchema";
import { useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StorageFieldsProps {
  form: UseFormReturn<RoomFormData>;
}

export function StorageFields({ form }: StorageFieldsProps) {
  const isStorage = form.watch("isStorage");
  const roomType = form.watch("roomType");
  const capacitySizeCategory = form.watch("capacitySizeCategory");

  // Set original room type when enabling storage for the first time
  useEffect(() => {
    if (isStorage && !form.getValues("originalRoomType")) {
      form.setValue("originalRoomType", roomType, { shouldValidate: false });
      form.setValue("temporaryStorageUse", true, { shouldValidate: false });
    }
  }, [isStorage, roomType, form]);

  // Update storage capacity when size category changes
  useEffect(() => {
    if (capacitySizeCategory) {
      const cubicFeet = capacitySizeToCubicFeet(capacitySizeCategory);
      form.setValue("storageCapacity", cubicFeet, { shouldValidate: false });
    }
  }, [capacitySizeCategory, form]);

  // Reset storage fields when isStorage is toggled off
  useEffect(() => {
    if (!isStorage) {
      form.setValue("simplifiedStorageType", null, { shouldValidate: false });
      form.setValue("capacitySizeCategory", null, { shouldValidate: false });
      form.setValue("storageCapacity", null, { shouldValidate: false });
      form.setValue("storageNotes", null, { shouldValidate: false });
      form.setValue("temporaryStorageUse", false, { shouldValidate: false });
    }
  }, [isStorage, form]);

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
            {form.getValues("originalRoomType") && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Original Room Type:</strong> {form.getValues("originalRoomType")?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  <br />
                  <span className="text-blue-600">This room is temporarily being used as storage.</span>
                </p>
              </div>
            )}

            <FormField
              control={form.control}
              name="simplifiedStorageType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What are you storing?</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value)}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select what you're storing" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(SimplifiedStorageTypeEnum).map((type) => (
                        <SelectItem key={type} value={type}>
                          <div>
                            <div className="font-medium">
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {getSimplifiedStorageTypeDescription(type)}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Select the primary type of items stored in this room</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="capacitySizeCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Storage Capacity Size</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value)}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select storage capacity size" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(CapacitySizeCategoryEnum).map((category) => (
                        <SelectItem key={category} value={category}>
                          <div>
                            <div className="font-medium">
                              {category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {getCapacitySizeDescription(category)}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose a size category - this will automatically set the cubic feet capacity
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.getValues("storageCapacity") && (
              <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                <strong>Calculated Capacity:</strong> {form.getValues("storageCapacity")} cubic feet
              </div>
            )}
            
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
                      placeholder="Add notes about storage requirements, contents, or special instructions"
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
