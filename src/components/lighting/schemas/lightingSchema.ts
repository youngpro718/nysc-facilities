
import * as z from "zod";

export const lightingFixtureSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .refine((name) => {
      const roomPattern = /^Room \d+[A-Za-z]* - (ceiling|wall|floor) Light \d+$/;
      const hallwayPattern = /^Hallway .+ - Light \d+$/;
      return roomPattern.test(name) || hallwayPattern.test(name);
    }, "Name must follow the format: 'Room {number} - {position} Light {sequence}' or 'Hallway {name} - Light {sequence}'"),
  type: z.enum(["standard", "motion_sensor"]),
  technology: z.enum(["LED", "Fluorescent", "Bulb"]).default("LED"),
  status: z.enum([
    "functional",
    "maintenance_needed",
    "non_functional"
  ]).default("functional"),
  maintenance_notes: z.string().optional(),
  space_id: z.string().uuid(),
  space_type: z.enum(["room", "hallway"]),
  position: z.enum(["ceiling", "wall", "floor", "desk"]),
  zone_id: z.string().uuid().optional(),
});

export type LightingFixtureFormData = z.infer<typeof lightingFixtureSchema>;

export const lightingZoneSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  floorId: z.string().min(1, "Floor is required"),
});

export type LightingZoneFormData = z.infer<typeof lightingZoneSchema>;

// Utility function to generate fixture name
export const generateFixtureName = (
  spaceType: 'room' | 'hallway',
  spaceName: string,
  roomNumber: string | undefined,
  position: string,
  sequence: number
): string => {
  if (spaceType === 'room' && roomNumber) {
    return `Room ${roomNumber} - ${position} Light ${sequence}`;
  } else {
    return `Hallway ${spaceName} - Light ${sequence}`;
  }
};
