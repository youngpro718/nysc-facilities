
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { BaseConnectionFormProps } from "../types/ConnectionTypes";
import { BaseFormField } from "./BaseConnectionForm";
import { UseFormReturn } from "react-hook-form";

const doorConnectionSchema = z.object({
  doorId: z.string().uuid(),
  accessType: z.enum(["standard", "secured", "emergency"]),
  direction: z.enum(["north", "south", "east", "west", "adjacent"])
});

type DoorConnectionFormData = z.infer<typeof doorConnectionSchema>;

interface DoorConnectionFormProps {
  availableDoors: Array<{ id: string; name: string; type: string }>;
  form: UseFormReturn<any>;
  isLoading?: boolean;
}

export function DoorConnectionForm({
  isLoading,
  availableDoors,
  form
}: DoorConnectionFormProps) {
  return (
    <div className="space-y-4">
      <BaseFormField
        form={form}
        label="Select Door"
        name="doorId"
        placeholder="Select a door"
        options={availableDoors.map(door => ({
          value: door.id,
          label: `${door.name} (${door.type})`
        }))}
      />

      <BaseFormField
        form={form}
        label="Access Type"
        name="accessType"
        placeholder="Select access type"
        options={[
          { value: "standard", label: "Standard" },
          { value: "secured", label: "Secured" },
          { value: "emergency", label: "Emergency" }
        ]}
      />

      <BaseFormField
        form={form}
        label="Direction"
        name="direction"
        placeholder="Select direction"
        options={[
          { value: "north", label: "North" },
          { value: "south", label: "South" },
          { value: "east", label: "East" },
          { value: "west", label: "West" },
          { value: "adjacent", label: "Adjacent" }
        ]}
      />
    </div>
  );
}
