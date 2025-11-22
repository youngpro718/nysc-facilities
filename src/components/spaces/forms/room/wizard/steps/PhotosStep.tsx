import { UseFormReturn } from "react-hook-form";
import { RoomFormData } from "../../RoomFormSchema";
import { CourtroomPhotoUpload } from "../../CourtroomPhotoUpload";
import { GeneralRoomPhotoUpload } from "../GeneralRoomPhotoUpload";
import { RoomTypeEnum } from "../../../../rooms/types/roomEnums";

interface PhotosStepProps {
  form: UseFormReturn<RoomFormData>;
  roomId?: string;
}

export function PhotosStep({ form, roomId }: PhotosStepProps) {
  const roomType = form.watch("roomType");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Photos & Visual Documentation</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Upload photos to document the room's condition and layout
        </p>
      </div>

      {roomType === RoomTypeEnum.COURTROOM ? (
        <CourtroomPhotoUpload form={form} />
      ) : (
        <GeneralRoomPhotoUpload form={form} roomId={roomId} />
      )}
    </div>
  );
}
