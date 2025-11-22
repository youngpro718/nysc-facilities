import { UseFormReturn } from "react-hook-form";
import { RoomFormData } from "../../RoomFormSchema";
import { CapacityFields } from "../CapacityFields";
import { StatusField } from "../../StatusField";
import { Separator } from "@/components/ui/separator";

interface CapacityAccessStepProps {
  form: UseFormReturn<RoomFormData>;
}

export function CapacityAccessStep({ form }: CapacityAccessStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Capacity & Access</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Room capacity and operational status
        </p>
      </div>

      <CapacityFields form={form} />

      <Separator />

      <StatusField form={form} />
    </div>
  );
}
