
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { UseFormReturn } from "react-hook-form";
import type { KeyFormData } from "../types/KeyTypes";

interface BasicKeyFieldsProps {
  form: UseFormReturn<KeyFormData>;
}

export function BasicKeyFields({ form }: BasicKeyFieldsProps) {
  // Subscribe to type changes to handle passkey logic
  const keyType = form.watch("type");

  // Handle passkey toggle
  const handlePasskeyChange = (checked: boolean) => {
    form.setValue("isPasskey", checked);
  };

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Key Name</FormLabel>
            <FormControl>
              <Input placeholder="Enter key name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Key Type</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select key type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="physical_key">Physical Key</SelectItem>
                <SelectItem value="elevator_pass">Elevator Pass</SelectItem>
                <SelectItem value="room_key">Room Key</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="keyScope"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Key Scope</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select key scope" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="door">Door Access</SelectItem>
                <SelectItem value="room">Room Access</SelectItem>
                <SelectItem value="room_door">Room Door Access</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              • Door Access: Key for a specific door<br/>
              • Room Access: Key for general room access<br/>
              • Room Door Access: Key specifically for a room's entrance door
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="quantity"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Primary Quantity</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                min={1}
                {...field}
                onChange={e => field.onChange(parseInt(e.target.value) || 1)}
              />
            </FormControl>
            <FormDescription>
              Number of primary keys to create
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="spareKeys"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Spare Keys</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                min={0}
                {...field}
                onChange={e => field.onChange(parseInt(e.target.value) || 0)}
              />
            </FormControl>
            <FormDescription>
              Number of additional spare keys to create
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="isPasskey"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
              <FormLabel>Passkey</FormLabel>
              <FormDescription>
                This key can be used with passkey-enabled doors
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={handlePasskeyChange}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}
