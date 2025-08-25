import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { type RoomFormData } from "./RoomFormSchema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoomTypeEnum } from "../../rooms/types/roomEnums";

interface CapacityFieldsProps {
  form: UseFormReturn<RoomFormData>;
}

export function CapacityFields({ form }: CapacityFieldsProps) {
  const roomType = form.watch("roomType");
  const isCourtroom = roomType === RoomTypeEnum.COURTROOM;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Capacity Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="capacity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>General Capacity</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Total people capacity" 
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    value={field.value || ''}
                  />
                </FormControl>
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
                    placeholder="Max people allowed" 
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {isCourtroom && (
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
                        placeholder="Number of jurors" 
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        value={field.value || ''}
                      />
                    </FormControl>
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
                        placeholder="Gallery seating" 
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        )}

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
                    placeholder="ADA accessible spots" 
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    value={field.value || ''}
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
                    placeholder="Hearing assistance spots" 
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}