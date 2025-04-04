
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UseFormReturn } from "react-hook-form";
import { CreateSpaceFormData } from "../../../schemas/createSpaceSchema";

interface SpaceTypeSelectorProps {
  form: UseFormReturn<CreateSpaceFormData>;
}

export function SpaceTypeSelector({ form }: SpaceTypeSelectorProps) {
  return (
    <FormField
      control={form.control}
      name="type"
      render={({ field }) => (
        <FormItem className="space-y-2">
          <FormLabel>Space Type</FormLabel>
          <FormControl>
            <RadioGroup
              onValueChange={(value: string) => field.onChange(value)}
              defaultValue={field.value as string}
              className="flex space-x-4"
            >
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <RadioGroupItem value="room" />
                </FormControl>
                <FormLabel className="font-normal">Room</FormLabel>
              </FormItem>
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <RadioGroupItem value="hallway" />
                </FormControl>
                <FormLabel className="font-normal">Hallway</FormLabel>
              </FormItem>
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <RadioGroupItem value="door" />
                </FormControl>
                <FormLabel className="font-normal">Door</FormLabel>
              </FormItem>
            </RadioGroup>
          </FormControl>
        </FormItem>
      )}
    />
  );
}
