
import { z } from "zod";
import { createSpaceSchema, type CreateSpaceFormData } from "./createSpaceSchema";
import { ExtendedFormSchema } from "./extendedFormSchema";

const positionSchema = z.object({
  x: z.number(),
  y: z.number()
}).default({ x: 0, y: 0 });

const sizeSchema = z.object({
  width: z.number(),
  height: z.number()
}).default({ width: 150, height: 100 });

// Create a preprocess function to add the spatial properties
export const editSpaceSchema = z.preprocess(
  (data) => ({
    ...(data as object),
    position: (data as any)?.position || { x: 0, y: 0 },
    size: (data as any)?.size || { width: 150, height: 100 },
    rotation: (data as any)?.rotation || 0,
    connections: (data as any)?.connections || []
  }),
  ExtendedFormSchema.extend({
    id: z.string().uuid("Invalid space ID"),
  })
);

export type EditSpaceFormData = z.infer<typeof editSpaceSchema>;

// Re-export the base types for consistency
export type { CreateSpaceFormData };
