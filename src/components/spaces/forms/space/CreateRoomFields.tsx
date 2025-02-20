import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { CreateSpaceFormData } from "../../schemas/createSpaceSchema";
import { RoomTypeEnum, StorageTypeEnum } from "../../rooms/types/roomEnums";
import { ConnectionFields } from "./ConnectionFields";

interface CreateRoomFieldsProps {
  form: UseFormReturn<CreateSpaceFormData>;
  floorId: string;
}

export function CreateRoomFields({ form, floorId }: CreateRoomFieldsProps) {
  const isStorage = form.watch("isStorage");

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="roomType"
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
                {Object.values(RoomTypeEnum).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace(/_/g, ' ').toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="roomNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Room Number</FormLabel>
            <FormControl>
              <Input placeholder="Enter room number" {...field} />
            </FormControl>
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
                placeholder="Enter description" 
                {...field} 
                className="min-h-[100px]"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="isStorage"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Storage Room</FormLabel>
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
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="storageType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Storage Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select storage type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(StorageTypeEnum).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace(/_/g, ' ').toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    placeholder="Enter any additional storage notes" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      <div className="border-t pt-4 mt-4">
        <h3 className="text-lg font-medium mb-4">Space Connections</h3>
        <ConnectionFields form={form} floorId={floorId} />
      </div>
    </div>
  );
}
