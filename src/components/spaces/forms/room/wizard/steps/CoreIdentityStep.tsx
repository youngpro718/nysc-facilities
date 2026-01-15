import { UseFormReturn } from "react-hook-form";
import { RoomFormData } from "../../RoomFormSchema";
import { BasicRoomFields } from "../../BasicRoomFields";
import { ParentRoomField } from "../../ParentRoomField";
import { FunctionRealityCheck } from "../FunctionRealityCheck";
import { Separator } from "@/components/ui/separator";

interface CoreIdentityStepProps {
  form: UseFormReturn<RoomFormData>;
  roomId?: string;
}

export function CoreIdentityStep({ form, roomId }: CoreIdentityStepProps) {
  const floorId = form.watch("floorId");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Core Identity & Function</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Basic room information and current usage
        </p>
      </div>

      <BasicRoomFields form={form} />

      <Separator />

      <ParentRoomField form={form} floorId={floorId} currentRoomId={roomId} />

      <Separator />

      <FunctionRealityCheck form={form} />
    </div>
  );
}
