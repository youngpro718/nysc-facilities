import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { type RoomFormData } from "./RoomFormSchema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CapacitySizeCategoryEnum } from "../../rooms/types/roomEnums";

interface FunctionFieldsProps {
  form: UseFormReturn<RoomFormData>;
}

export function FunctionFields({ form }: FunctionFieldsProps) {
  const roomType = form.watch("roomType");
  const isStorage = form.watch("isStorage");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Function & Usage</CardTitle>
        {isStorage && (
          <p className="text-sm text-muted-foreground">
            Function fields are disabled when room is designated as storage
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {!isStorage && (
          <FormField
            control={form.control}
            name="currentFunction"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Function</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="What is this room currently being used for?" 
                    {...field} 
                    value={field.value || ''} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Room Size Category - always visible since it's used for both storage and non-storage rooms */}
        <FormField
          control={form.control}
          name="capacitySizeCategory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Room Size Category</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || undefined}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select size category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={CapacitySizeCategoryEnum.SMALL}>Small</SelectItem>
                  <SelectItem value={CapacitySizeCategoryEnum.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={CapacitySizeCategoryEnum.LARGE}>Large</SelectItem>
                  <SelectItem value={CapacitySizeCategoryEnum.EXTRA_LARGE}>Extra Large</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isStorage && (
          <>
            <FormField
              control={form.control}
              name="temporaryStorageUse"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Temporary Use</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Is this room being used temporarily for something other than its original purpose?
                    </p>
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

            {form.watch("temporaryStorageUse") && (
              <FormField
                control={form.control}
                name="originalRoomType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Original Room Type</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="What was this room originally designed for?" 
                        {...field} 
                        value={field.value || ''} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}