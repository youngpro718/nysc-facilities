
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useRelocations } from "../hooks/useRelocations";
import { CreateRelocationFormData } from "../types/relocationTypes";
import { RoomSelectionSection } from "./sections/RoomSelectionSection";
import { DateSelectionSection } from "./sections/DateSelectionSection";
import { RelocationDetailsSection } from "./sections/RelocationDetailsSection";

const createRelocationSchema = z.object({
  original_room_id: z.string().min(1, "Original room is required"),
  temporary_room_id: z.string().min(1, "Temporary room is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  reason: z.string().min(1, "Reason is required"),
  notes: z.string().optional(),
  relocation_type: z.enum(['emergency', 'maintenance', 'other', 'construction'])
    .default('maintenance'),
});

export function CreateRelocationForm() {
  const navigate = useNavigate();
  const { createRelocation, isCreating } = useRelocations();

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
    },
  });

  const onSubmit = async (data: CreateRelocationFormData) => {
    try {
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
        <RelocationDetailsSection form={form} />

        <div className="flex justify-end gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate("/relocations")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isCreating}>
            {isCreating ? "Creating..." : "Create Relocation"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
