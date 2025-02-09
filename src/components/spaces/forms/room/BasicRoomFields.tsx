
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EditSpaceFormData } from "../../schemas/editSpaceSchema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BasicRoomFieldsProps {
  form: UseFormReturn<EditSpaceFormData>;
}

export function BasicRoomFields({ form }: BasicRoomFieldsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Basic Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter room name" {...field} />
              </FormControl>
              <FormDescription>
                A descriptive name for the room
              </FormDescription>
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
                <FormLabel>Room Number</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 101A" {...field} />
                </FormControl>
                <FormDescription>
                  The official room number
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

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
                <FormDescription>
                  Contact number for this room
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
              <FormDescription>
                The primary function or purpose of this room
              </FormDescription>
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
              <FormDescription>
                Additional details about the room's features or purpose
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
