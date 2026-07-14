import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RoomTypeEnum } from "../../rooms/types/roomEnums";
import { VISIBLE_ROOM_TYPES, ADVANCED_ROOM_TYPES, formatRoomTypeLabel } from "../../rooms/types/visibleRoomTypes";
import { type RoomFormData } from "./RoomFormSchema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BasicRoomFieldsProps {
  form: UseFormReturn<RoomFormData>;
}

export function BasicRoomFields({ form }: BasicRoomFieldsProps) {
  const currentType = form.watch("roomType");
  const currentIsAdvanced = currentType && ADVANCED_ROOM_TYPES.includes(currentType as RoomTypeEnum);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(!!currentIsAdvanced);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Room Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Room Name *</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Supply Department, Storage Room" required {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="roomNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Room Number *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 101A" required {...field} />
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
                      <SelectValue placeholder="Select room type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {VISIBLE_ROOM_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {formatRoomTypeLabel(type)}
                      </SelectItem>
                    ))}
                    {showAdvanced && (
                      <>
                        <SelectSeparator />
                        {ADVANCED_ROOM_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {formatRoomTypeLabel(type)}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
                {!showAdvanced && (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="px-0 h-auto text-xs"
                    onClick={() => setShowAdvanced(true)}
                  >
                    Show more room types
                  </Button>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. (555) 123-4567"
                  {...field}
                  value={field.value || ''}
                />
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
                  placeholder="Enter room description"
                  {...field}
                  value={field.value || ''}
                  className="min-h-[100px]"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
