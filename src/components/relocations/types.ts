
import { z } from "zod";

export const relocationSchema = z.object({
  original_room_id: z.string({
    required_error: "Please select the original room"
  }),
  temporary_room_id: z.string({
    required_error: "Please select the temporary room"
  }).refine(
    (val, ctx) => val !== ctx.data.original_room_id,
    "Temporary room must be different from original room"
  ),
  start_date: z.string({
    required_error: "Start date is required"
  }),
  end_date: z.string({
    required_error: "End date is required"
  }).refine(
    (val, ctx) => {
      if (!ctx.data.start_date || !val) return true;
      return new Date(val) > new Date(ctx.data.start_date);
    },
    "End date must be after start date"
  ),
  reason: z.string({
    required_error: "Please provide a reason for relocation"
  }).min(10, "Reason must be at least 10 characters long"),
  relocation_type: z.enum(["emergency", "maintenance", "other", "construction"], {
    required_error: "Please select a relocation type"
  }),
  special_instructions: z.string().optional()
});

export type FormValues = z.infer<typeof relocationSchema>;
