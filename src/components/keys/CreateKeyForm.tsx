
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { BasicKeyFields } from "./form-sections/BasicKeyFields";
import { LocationFields } from "./form-sections/LocationFields";
import { OccupantField } from "./form-sections/OccupantField";
import type { KeyFormData } from "./types/KeyTypes";
import { keyFormSchema, type CreateKeyFormProps } from "./types/CreateKeyFormTypes";

export function CreateKeyForm({ onSubmit, isSubmitting, onCancel }: CreateKeyFormProps) {
  const form = useForm<KeyFormData>({
    resolver: zodResolver(keyFormSchema),
    defaultValues: {
      name: "",
      type: "physical_key",
      isPasskey: false,
      quantity: 1,
      spareKeys: 0,
      keyScope: "door",
      buildingId: undefined,
      floorId: undefined,
      doorId: undefined,
      roomId: undefined,
      occupantId: undefined
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <BasicKeyFields form={form} />
        <LocationFields form={form} />
        <OccupantField form={form} />

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Key"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
