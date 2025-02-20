
import { z } from "zod";

export const connectionSchema = z.object({
  toSpaceId: z.string().uuid().optional(),
  connectionType: z.enum(["door", "hallway", "direct"]).optional(),
  direction: z.enum(["north", "south", "east", "west", "adjacent"]).optional(),
});

export type SpaceConnection = z.infer<typeof connectionSchema>;
