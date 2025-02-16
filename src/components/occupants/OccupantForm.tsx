
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { occupantSchema, type OccupantFormData } from "./schemas/occupantSchema";
import { PersonalInfoFields } from "./form-sections/PersonalInfoFields";
import { WorkInfoFields } from "./form-sections/WorkInfoFields";
import { AssignmentFields } from "./form-sections/AssignmentFields";

interface OccupantFormProps {
  initialData?: Partial<OccupantFormData>;
  onSubmit: (data: OccupantFormData) => void;
  onCancel: () => void;
}

export function OccupantForm({ initialData, onSubmit, onCancel }: OccupantFormProps) {
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
        <ScrollArea className="h-[calc(100vh-12rem)] pr-4">
          <div className="space-y-6">
            <PersonalInfoFields form={form} />
            <WorkInfoFields form={form} />
            <AssignmentFields form={form} />
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </Form>
  );
}
