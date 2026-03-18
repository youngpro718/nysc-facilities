import { UseFormReturn } from "react-hook-form";
import { RoomFormData } from "../../RoomFormSchema";
import { OccupancyComparison } from "../OccupancyComparison";
import RoomAccessFields from "../../RoomAccessFields";
import { Separator } from "@/components/ui/separator";

interface OccupancyAccessStepProps {
  form: UseFormReturn<RoomFormData>;
  roomId?: string;
}

export function OccupancyAccessStep({ form, roomId }: OccupancyAccessStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Occupancy & Access</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Current and previous occupants, access management
        </p>
      </div>

      <OccupancyComparison roomId={roomId} />

      <Separator />

      <RoomAccessFields form={form} />
    </div>
  );
}
