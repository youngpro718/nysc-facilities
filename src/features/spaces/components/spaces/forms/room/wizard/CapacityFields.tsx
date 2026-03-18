import { UseFormReturn } from "react-hook-form";
import { RoomFormData } from "../RoomFormSchema";
import { RoomTypeEnum } from "../../../rooms/types/roomEnums";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimplifiedStorageTypeEnum, CapacitySizeCategoryEnum } from "../../../rooms/types/roomEnums";

interface CapacityFieldsProps {
  form: UseFormReturn<RoomFormData>;
}

export function CapacityFields({ form }: CapacityFieldsProps) {
  const roomType = form.watch("roomType");
  const isStorage = form.watch("isStorage");

  // Determine which capacity fields to show based on room type
  const getCapacityFieldsForRoomType = (type: RoomTypeEnum | string) => {
    switch (type) {
      case RoomTypeEnum.COURTROOM:
        return ["courtroom"];
      case RoomTypeEnum.OFFICE:
      case RoomTypeEnum.ADMINISTRATIVE_OFFICE:
      case RoomTypeEnum.CONFERENCE_ROOM:
      case RoomTypeEnum.CONFERENCE:
        return ["general"];
      case RoomTypeEnum.FILING_ROOM:
      case RoomTypeEnum.RECORDS_ROOM:
        return ["storage"];
      case RoomTypeEnum.BREAK_ROOM:
        return []; // No capacity fields for break rooms
      default:
        return ["general"];
    }
  };

  const capacityFields = getCapacityFieldsForRoomType(roomType);

  if (capacityFields.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Capacity tracking is not required for this room type.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Capacity Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {capacityFields.includes("courtroom") && (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="jurorCapacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Juror Capacity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="12"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>Number of jurors that can be seated</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="spectatorCapacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Spectator Capacity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="50"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>Public gallery seating capacity</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="wheelchairAccessibleSpaces"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wheelchair Accessible Spaces</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="2"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hearingAssistedSpaces"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hearing Assisted Spaces</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="4"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        )}

        {capacityFields.includes("general") && (
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      placeholder="4"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormDescription>Standard occupancy capacity</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxOccupancy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Occupancy</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      placeholder="6"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormDescription>Maximum safe occupancy limit</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {(capacityFields.includes("storage") || isStorage) && (
          <>
            <FormField
              control={form.control}
              name="simplifiedStorageType"
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
                      {Object.values(SimplifiedStorageTypeEnum).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
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
              name="capacitySizeCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacity Size</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select size category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(CapacitySizeCategoryEnum).map((size) => (
                        <SelectItem key={size} value={size}>
                          {size.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
