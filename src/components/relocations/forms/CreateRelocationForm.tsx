
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { FormButtons } from "@/components/ui/form-buttons";
import { useRelocations } from "../hooks/useRelocations";
import { CreateRelocationFormData } from "../types/relocationTypes";
import { RoomSelectionSection } from "./sections/RoomSelectionSection";
import { DateSelectionSection } from "./sections/DateSelectionSection";
import { RelocationDetailsSection } from "./sections/RelocationDetailsSection";
import { useState } from "react";

const createRelocationSchema = z.object({
  original_room_id: z.string().min(1, "Original room is required"),
  temporary_room_id: z.string().min(1, "Temporary room is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  reason: z.string().min(1, "Reason is required"),
  notes: z.string().optional(),
  relocation_type: z.enum(['emergency', 'maintenance', 'other', 'construction'])
    .default('maintenance'),
  term_id: z.string().optional(),
  respect_term_assignments: z.boolean().optional()
});

export function CreateRelocationForm() {
  const navigate = useNavigate();
  const { createRelocation, isCreating } = useRelocations();
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);

  const form = useForm<CreateRelocationFormData>({
    resolver: zodResolver(createRelocationSchema),
    defaultValues: {
      original_room_id: "",
      temporary_room_id: "",
      start_date: new Date().toISOString().split('T')[0],
      end_date: "",
      reason: "",
      notes: "",
      relocation_type: "maintenance",
      respect_term_assignments: true
    },
  });

  const onSubmit = async (data: CreateRelocationFormData) => {
    try {
      // Inject the selected term ID into the form data before submitting
      if (selectedTermId) {
        data.term_id = selectedTermId;
      }
      
      await createRelocation(data);
      navigate("/relocations");
    } catch (error) {
      console.error('Error creating relocation:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <RoomSelectionSection form={form} />
        <DateSelectionSection form={form} />
        <RelocationDetailsSection 
          selectedTermId={selectedTermId} 
          setSelectedTermId={setSelectedTermId}
        />
        
        <FormButtons
          onCancel={() => navigate("/relocations")}
          isSubmitting={isCreating}
          submitLabel="Create Relocation"
          cancelLabel="Cancel"
        />
      </form>
    </Form>
  );
}
