import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RoomFormData } from "./RoomFormSchema";
import { RoomTypeEnum } from "../../rooms/types/roomEnums";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Scale, Accessibility } from "lucide-react";

interface CapacityFieldsProps {
  form: UseFormReturn<RoomFormData>;
}

export function CapacityFields({ form }: CapacityFieldsProps) {
  const roomType = form.watch("roomType");
  const isCourtroom = roomType === RoomTypeEnum.COURTROOM;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5" />
          Capacity Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* General Capacity Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1">
                  <Scale className="h-4 w-4" />
                  Standard Capacity
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Enter room capacity"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormDescription>
                  Normal occupancy limit for this room
                </FormDescription>
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
                    placeholder="Maximum safe occupancy"
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormDescription>
                  Maximum safe occupancy (fire code limit)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Courtroom Specific Capacity */}
        {isCourtroom && (
          <>
            <div className="border-t pt-4">
              <h4 className="font-medium text-sm mb-3 text-primary">Courtroom Specific Capacity</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="jurorCapacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Juror Capacity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Number of juror seats"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>
                        Available seats for jury members
                      </FormDescription>
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
                          placeholder="Number of public seats"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>
                        Available seats for public viewing
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </>
        )}

        {/* Accessibility Capacity */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-sm mb-3 flex items-center gap-1">
            <Accessibility className="h-4 w-4" />
            Accessibility Accommodations
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="wheelchairAccessibleSpaces"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wheelchair Accessible Spaces</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Number of wheelchair spaces"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormDescription>
                    Designated wheelchair accessible positions
                  </FormDescription>
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
                      placeholder="Number of hearing assisted spaces"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormDescription>
                    Positions with hearing assistance equipment
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}