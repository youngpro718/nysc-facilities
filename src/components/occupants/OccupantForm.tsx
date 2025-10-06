
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { occupantSchema, type OccupantFormData } from "./schemas/occupantSchema";
import { PersonalInfoFields } from "./form-sections/PersonalInfoFields";
import { WorkInfoFields } from "./form-sections/WorkInfoFields";
import { AssignmentFields } from "./form-sections/AssignmentFields";
import { StatusAccessFields } from "./form-sections/StatusAccessFields";

interface OccupantFormProps {
  initialData?: Partial<OccupantFormData>;
  onSubmit: (data: OccupantFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function OccupantForm({ 
  initialData, 
  onSubmit, 
  onCancel,
  isSubmitting 
}: OccupantFormProps) {
  const form = useForm<OccupantFormData>({
    resolver: zodResolver(occupantSchema),
    defaultValues: {
      first_name: initialData?.first_name || "",
      last_name: initialData?.last_name || "",
      email: initialData?.email || null,
      phone: initialData?.phone || null,
      department: initialData?.department || null,
      title: initialData?.title || null,
      role: initialData?.role || null,
      court_position: initialData?.court_position || null,
      status: initialData?.status || "active",
      rooms: initialData?.rooms || [],
      keys: initialData?.keys || [],
      access_level: initialData?.access_level || "standard",
      emergency_contact: initialData?.emergency_contact || null,
      notes: initialData?.notes || null,
      employment_type: initialData?.employment_type || null,
      supervisor_id: initialData?.supervisor_id || null,
      hire_date: initialData?.hire_date || null,
      termination_date: initialData?.termination_date || null,
    },
  });

  const handleFormSubmit = async (data: OccupantFormData) => {
    try {
      console.log("=== FORM SUBMIT ===");
      console.log("Form data being submitted:", data);
      console.log("Form state:", form.formState);
      console.log("Form errors:", form.formState.errors);
      console.log("Is form valid:", form.formState.isValid);
      console.log("Is form submitting:", form.formState.isSubmitting);
      
      // Check for validation errors
      if (Object.keys(form.formState.errors).length > 0) {
        console.error("=== VALIDATION ERRORS ===", form.formState.errors);
        toast.error("Please fix validation errors before submitting");
        return;
      }
      
      await onSubmit(data);
      
      console.log("Form submission completed successfully");
    } catch (error) {
      console.error("=== FORM SUBMISSION ERROR ===", error);
      toast.error("Failed to submit form");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <ScrollArea className="h-[calc(100vh-12rem)] pr-4">
          <div className="space-y-6">
            <PersonalInfoFields form={form} />
            <WorkInfoFields form={form} />
            <StatusAccessFields form={form} />
            <AssignmentFields form={form} />
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
