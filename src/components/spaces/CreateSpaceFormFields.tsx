import { UseFormReturn } from "react-hook-form";
import { CreateSpaceFormData } from "./schemas/createSpaceSchema";
import { BasicSpaceFields } from "./forms/space/BasicSpaceFields";
import { CreateRoomFields } from "./forms/space/CreateRoomFields";
import { CreateHallwayFields } from "./forms/space/CreateHallwayFields";
import { CreateDoorFields } from "./forms/space/CreateDoorFields";
import { StatusField } from "./forms/space/StatusField";

interface CreateSpaceFormFieldsProps {
  form: UseFormReturn<CreateSpaceFormData>;
}

export function CreateSpaceFormFields({ form }: CreateSpaceFormFieldsProps) {
  const spaceType = form.watch("type");
  const floorId = form.watch("floorId");

  return (
    <div className="space-y-4">
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

      <StatusField form={form} />
    </div>
  );
}