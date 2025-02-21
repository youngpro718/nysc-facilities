
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SpaceTypeSelector } from "./selectors/SpaceTypeSelector";
import { BuildingSelector } from "./selectors/BuildingSelector";
import { FloorSelector } from "./selectors/FloorSelector";
import { CreateSpaceFormData } from "../../schemas/createSpaceSchema";

interface BasicSpaceFieldsProps {
  form: UseFormReturn<CreateSpaceFormData>;
}

export function BasicSpaceFields({ form }: BasicSpaceFieldsProps) {
  const selectedBuildingId = form.watch('buildingId');

  return (
    <div className="space-y-4">
      <SpaceTypeSelector form={form} />

      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input placeholder="Enter name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <BuildingSelector form={form} />

      <FloorSelector 
        form={form}
        selectedBuildingId={selectedBuildingId}
      />
    </div>
  );
}
