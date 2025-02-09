import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { BasicInfoFields } from "./form-sections/BasicInfoFields";
import { ContactFields } from "./form-sections/ContactFields";
import { WorkInfoFields } from "./form-sections/WorkInfoFields";
import { StatusAccessFields } from "./form-sections/StatusAccessFields";
import { RoomAssignmentField } from "./form-sections/RoomAssignmentField";
import { KeyAssignmentField } from "./form-sections/KeyAssignmentField";
import { occupantSchema, type OccupantFormData } from "./schemas/occupantSchema";

interface CreateOccupantFormProps {
  initialData?: Partial<OccupantFormData>;
  onSubmit: (data: OccupantFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function CreateOccupantForm({
  initialData,
  onSubmit,
  isSubmitting = false,
}: CreateOccupantFormProps) {
  const form = useForm<OccupantFormData>({
    resolver: zodResolver(occupantSchema),
    defaultValues: {
      first_name: initialData?.first_name || "",
      last_name: initialData?.last_name || "",
      email: initialData?.email || null,
      phone: initialData?.phone || null,
      department: initialData?.department || null,
      title: initialData?.title || null,
      status: initialData?.status || "active",
      rooms: initialData?.rooms || [],
      keys: initialData?.keys || [],
      access_level: initialData?.access_level || "standard",
      emergency_contact: initialData?.emergency_contact || null,
      notes: initialData?.notes || null,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <BasicInfoFields form={form} />
        <ContactFields form={form} />
        <WorkInfoFields form={form} />
        <StatusAccessFields form={form} />
        <RoomAssignmentField form={form} />
        <KeyAssignmentField form={form} />

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : initialData ? "Save Changes" : "Create Occupant"}
          </Button>
        </div>
      </form>
    </Form>
  );
}