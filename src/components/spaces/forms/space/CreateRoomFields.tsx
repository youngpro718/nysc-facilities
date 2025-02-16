
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { CreateSpaceFormData } from "../../schemas/createSpaceSchema";
import { ParentRoomField } from "../room/ParentRoomField";

interface CreateRoomFieldsProps {
  form: UseFormReturn<CreateSpaceFormData>;
  floorId: string;
}

export function CreateRoomFields({ form, floorId }: CreateRoomFieldsProps) {
  const isStorage = form.watch("isStorage");

  return (
    <div className="space-y-4">
      {floorId && <ParentRoomField form={form} floorId={floorId} />}

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
        name="roomType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Room Type</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="courtroom">Courtroom</SelectItem>
                <SelectItem value="judges_chambers">Judge's Chambers</SelectItem>
                <SelectItem value="jury_room">Jury Room</SelectItem>
                <SelectItem value="conference_room">Conference Room</SelectItem>
                <SelectItem value="office">Office</SelectItem>
                <SelectItem value="filing_room">Filing Room</SelectItem>
                <SelectItem value="male_locker_room">Male Locker Room</SelectItem>
                <SelectItem value="female_locker_room">Female Locker Room</SelectItem>
                <SelectItem value="robing_room">Robing Room</SelectItem>
                <SelectItem value="stake_holder">Stake Holder</SelectItem>
                <SelectItem value="records_room">Records Room</SelectItem>
                <SelectItem value="administrative_office">Administrative Office</SelectItem>
                <SelectItem value="break_room">Break Room</SelectItem>
                <SelectItem value="it_room">IT Room</SelectItem>
                <SelectItem value="utility_room">Utility Room</SelectItem>
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
                <Select onValueChange={field.onChange} value={field.value || ""}>
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
    </div>
  );
}
