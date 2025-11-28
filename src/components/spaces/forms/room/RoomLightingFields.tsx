import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RoomFormData } from "./RoomFormSchema";
import { Lightbulb } from "lucide-react";

interface RoomLightingFieldsProps {
  form: UseFormReturn<RoomFormData>;
}

export function RoomLightingFields({ form }: RoomLightingFieldsProps) {
  return (
    <div className="space-y-4 border-t pt-4">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Lighting Information</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="ceilingHeight"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ceiling Height</FormLabel>
              <Select
                value={field.value || undefined}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ceiling height" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="standard">Standard (8-10ft)</SelectItem>
                  <SelectItem value="high">High (10-14ft)</SelectItem>
                  <SelectItem value="double_height">Double Height (14ft+)</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Ceiling height affects maintenance accessibility
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="expectedFixtureCount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expected Fixture Count</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  placeholder="e.g., 4"
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val === "" ? null : parseInt(val));
                  }}
                />
              </FormControl>
              <FormDescription>
                Estimated number of lighting fixtures in this room
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="primaryBulbType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primary Bulb Type</FormLabel>
              <Select
                value={field.value || undefined}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select bulb type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="LED">💡 LED</SelectItem>
                  <SelectItem value="Fluorescent">🔆 Fluorescent</SelectItem>
                  <SelectItem value="Mixed">🔄 Mixed</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Primary lighting technology used in this room
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lightingNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lighting Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., Requires lift for ceiling access, emergency lighting installed"
                  className="resize-none"
                  rows={3}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription>
                Special notes about lighting access or conditions
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
