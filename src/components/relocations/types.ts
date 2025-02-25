
import { z } from "zod";

export const relocationSchema = z.object({
  original_room_id: z.string({
    required_error: "Please select the original room"
  }),
  temporary_room_id: z.string({
    required_error: "Please select the temporary room"
  }).superRefine((val, ctx) => {
    if (val === ctx.data.original_room_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Temporary room must be different from original room"
      });
    }
  }),
  start_date: z.string({
    required_error: "Start date is required"
  }),
  end_date: z.string({
    required_error: "End date is required"
  }).superRefine((val, ctx) => {
    if (ctx.data.start_date && val) {
      if (new Date(val) <= new Date(ctx.data.start_date)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "End date must be after start date"
        });
      }
    }
  }),
  reason: z.string({
    required_error: "Please provide a reason for relocation"
  }).min(10, "Reason must be at least 10 characters long"),
  relocation_type: z.enum(["emergency", "maintenance", "other", "construction"], {
    required_error: "Please select a relocation type"
  }),
  special_instructions: z.string().optional()
});

export type FormValues = z.infer<typeof relocationSchema>;
