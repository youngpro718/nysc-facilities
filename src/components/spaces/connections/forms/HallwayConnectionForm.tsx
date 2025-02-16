import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { BaseConnectionFormProps } from "../types/ConnectionTypes";
import { BaseFormField } from "./BaseConnectionForm";
import { UseFormReturn } from "react-hook-form";

const hallwayConnectionSchema = z.object({
  hallwayId: z.string().uuid(),
  connectionType: z.enum(["direct", "door", "secured"]),
  position: z.enum(["start", "middle", "end", "adjacent"])
});

type HallwayConnectionFormData = z.infer<typeof hallwayConnectionSchema>;

interface HallwayConnectionFormProps extends BaseConnectionFormProps {
  availableHallways: Array<{ id: string; name: string }>;
  form: UseFormReturn<any>;
}

export function HallwayConnectionForm({
  isLoading,
  availableHallways,
  form
}: HallwayConnectionFormProps) {
  return (
    <div className="space-y-4">
      <BaseFormField
        form={form}
        label="Select Hallway"
        name="hallwayId"
        placeholder="Select a hallway"
        options={availableHallways.map(hallway => ({
          value: hallway.id,
          label: hallway.name
        }))}
      />

      <BaseFormField
        form={form}
        label="Connection Type"
        name="connectionType"
        placeholder="Select connection type"
        options={[
          { value: "direct", label: "Direct" },
          { value: "door", label: "Door" },
          { value: "secured", label: "Secured" }
        ]}
      />

      <BaseFormField
        form={form}
        label="Position"
        name="position"
        placeholder="Select position"
        options={[
          { value: "start", label: "Start" },
          { value: "middle", label: "Middle" },
          { value: "end", label: "End" },
          { value: "adjacent", label: "Adjacent" }
        ]}
      />
    </div>
  );
}