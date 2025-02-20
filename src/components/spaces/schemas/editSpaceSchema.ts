
import { z } from "zod";
import { createSpaceSchema, type CreateSpaceFormData } from "./createSpaceSchema";

export const editSpaceSchema = createSpaceSchema.extend({
  id: z.string().uuid("Invalid space ID"),
  position: z.object({
    x: z.number(),
    y: z.number()
  }).default({ x: 0, y: 0 }),
  size: z.object({
    width: z.number(),
    height: z.number()
  }).default({ width: 150, height: 100 }),
  rotation: z.number().default(0),
});

export type EditSpaceFormData = z.infer<typeof editSpaceSchema>;

// Re-export the base types for consistency
export type { CreateSpaceFormData };
