
import { UseFormReturn } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CreateSpaceFormData } from "../../schemas/createSpaceSchema";
import { useState } from "react";
import { SpaceTypeSelector } from "./selectors/SpaceTypeSelector";
import { BuildingSelector } from "./selectors/BuildingSelector";
import { FloorSelector } from "./selectors/FloorSelector";

interface BasicSpaceFieldsProps {
  form: UseFormReturn<CreateSpaceFormData>;
}

export function BasicSpaceFields({ form }: BasicSpaceFieldsProps) {
  const [isBuildingOpen, setBuildingOpen] = useState(false);
  const [isFloorOpen, setIsFloorOpen] = useState(false);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);

  const handleBuildingSelect = (buildingId: string) => {
    setSelectedBuildingId(buildingId);
    form.setValue('floorId', '');
    setBuildingOpen(false);
  };

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

      <BuildingSelector
        selectedBuildingId={selectedBuildingId}
        onBuildingSelect={handleBuildingSelect}
        isOpen={isBuildingOpen}
        onOpenChange={setBuildingOpen}
      />

      <FloorSelector
        form={form}
        selectedBuildingId={selectedBuildingId}
        isOpen={isFloorOpen}
        onOpenChange={setIsFloorOpen}
      />
    </div>
  );
}
