
import * as z from "zod";
import { LightingPosition, LightingType, LightStatus } from "@/types/lighting";

export const roomLightingSchema = z.object({
  room_id: z.string().uuid(),
  primary_lighting: z.boolean(),
  emergency_lighting: z.boolean(),
  lighting_type: z.enum(["standard", "emergency", "exit_sign", "decorative", "motion_sensor"]),
  fixture_count: z.number().min(1),
  name: z.string().min(1, "Name is required"),
  type: z.enum(["standard", "emergency", "exit_sign", "decorative", "motion_sensor"]),
  status: z.enum([
    "functional",
    "maintenance_needed",
    "non_functional",
    "pending_maintenance",
    "scheduled_replacement"
  ]),
  position: z.enum(["ceiling", "wall", "floor", "desk"]),
  space_type: z.enum(["room", "hallway"]),
  technology: z.enum(["LED", "Fluorescent", "Bulb", "led", "fluorescent", "incandescent", "halogen", "metal_halide"]),
  bulb_count: z.number().min(1),
  electrical_issues: z.object({
    short_circuit: z.boolean(),
    wiring_issues: z.boolean(),
    voltage_problems: z.boolean()
  }),
  ballast_issue: z.boolean(),
  ballast_check_notes: z.string().nullable(),
  emergency_circuit: z.boolean().optional(),
  maintenance_notes: z.string().nullable()
});

export type RoomLightingFormData = z.infer<typeof roomLightingSchema>;
