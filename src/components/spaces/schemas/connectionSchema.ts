
import { z } from "zod";

export const connectionSchema = z.object({
  toSpaceId: z.string().uuid("Invalid space ID").optional(),
  connectionType: z.enum(["door", "hallway", "direct"]).optional(),
  direction: z.enum(["north", "south", "east", "west", "adjacent"]).optional(),
}).optional();

export type ConnectionSchema = z.infer<typeof connectionSchema>;
