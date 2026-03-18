import { UseFormReturn } from "react-hook-form";
import { RoomFormData } from "../../RoomFormSchema";
import { MaintenanceHealthSummary } from "../MaintenanceHealthSummary";

interface MaintenanceStepProps {
  form: UseFormReturn<RoomFormData>;
  roomId?: string;
}

export function MaintenanceStep({ form, roomId }: MaintenanceStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Maintenance & Health Summary</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Inspection history and scheduled maintenance
        </p>
      </div>

      <MaintenanceHealthSummary form={form} roomId={roomId} />
    </div>
  );
}
