
import { UseFormReturn } from "react-hook-form";
import { RoomFormData } from "./RoomFormSchema";
import { CreateSpaceFormData } from "../../schemas/createSpaceSchema";

// Type for components that expect a RoomFormData form
export type RoomFormProps = {
  form: UseFormReturn<RoomFormData>;
};

// Type for CreateRoomFields that accepts a CreateSpaceFormData form but works with RoomFormData
export type CreateRoomFieldsProps = {
  form: UseFormReturn<CreateSpaceFormData>;
  floorId: string;
};
