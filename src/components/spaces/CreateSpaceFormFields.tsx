
import { UseFormReturn } from "react-hook-form";
import { CreateSpaceFormData } from "./schemas/createSpaceSchema";
import { BasicSpaceFields } from "./forms/space/BasicSpaceFields";
import { CreateRoomFields } from "./forms/space/CreateRoomFields";
import { CreateHallwayFields } from "./forms/space/CreateHallwayFields";
import { CreateDoorFields } from "./forms/space/CreateDoorFields";

interface CreateSpaceFormFieldsProps {
  form: UseFormReturn<CreateSpaceFormData>;
}

export function CreateSpaceFormFields({ form }: CreateSpaceFormFieldsProps) {
  const spaceType = form.watch("type");
  const floorId = form.watch("floorId");
  
  console.log('=== CreateSpaceFormFields rendered ===');
  console.log('Current form values:', {
    spaceType,
    floorId,
    name: form.watch("name"),
    buildingId: form.watch("buildingId")
  });

  return (
    <div className="space-y-6">
      <BasicSpaceFields form={form} />

      {spaceType === "room" && floorId && (
        <CreateRoomFields form={form} floorId={floorId} />
      )}

      {spaceType === "hallway" && (
        <CreateHallwayFields form={form} />
      )}

      {spaceType === "door" && (
        <CreateDoorFields form={form} />
      )}

    </div>
  );
}
