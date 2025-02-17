
import { z } from "zod";
import { LightingPosition, LightingTechnology, LightingType, LightStatus } from "@/components/lighting/types";

export const roomLightingSchema = z.object({
  id: z.string().optional(),
  room_id: z.string(),
  primary_lighting: z.boolean(),
  emergency_lighting: z.boolean(),
  lighting_type: z.enum(["standard", "emergency", "motion_sensor"]),
  fixture_count: z.number().min(1),
  last_inspection: z.string().optional(),
  emergency_circuit: z.boolean(),
  backup_duration_minutes: z.number().optional(),
  electrical_issues: z.object({
    short_circuit: z.boolean(),
    wiring_issues: z.boolean(),
    voltage_problems: z.boolean()
  }),
  technology: z.enum(["LED", "Fluorescent", "Bulb"]).nullable(),
  status: z.enum([
    "functional",
    "maintenance_needed",
    "non_functional",
    "pending_maintenance",
    "scheduled_replacement"
  ]),
  position: z.enum(["ceiling", "wall", "floor", "desk"]),
  space_type: z.enum(["room", "hallway"]),
  name: z.string(),
  bulb_count: z.number().min(1),
  ballast_issue: z.boolean(),
  ballast_check_notes: z.string().nullable().optional(),
  maintenance_notes: z.string().nullable().optional()
});

export type RoomLightingFormData = z.infer<typeof roomLightingSchema>;
