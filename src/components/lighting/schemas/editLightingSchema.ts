
import * as z from "zod";
import { LightStatus, LightingType, LightingPosition, LightingTechnology } from "@/types/lighting";

export const editLightingFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["standard", "emergency", "exit_sign", "decorative", "motion_sensor"]),
  status: z.enum([
    "functional",
    "maintenance_needed",
    "non_functional",
    "pending_maintenance",
    "scheduled_replacement"
  ]),
  space_id: z.string().uuid(),
  space_type: z.enum(["room", "hallway"]),
  room_number: z.string().nullable(),
  position: z.enum(["ceiling", "wall", "floor", "desk"]),
  technology: z.enum(["LED", "Fluorescent", "Bulb", "led", "fluorescent", "incandescent", "halogen", "metal_halide"]).nullable(),
  maintenance_priority: z.enum(["low", "medium", "high"]).nullable(),
  maintenance_notes: z.string().nullable(),
  bulb_count: z.number().min(1),
  electrical_issues: z.object({
    short_circuit: z.boolean(),
    wiring_issues: z.boolean(),
    voltage_problems: z.boolean()
  }).nullable(),
  ballast_issue: z.boolean(),
  ballast_check_notes: z.string().nullable(),
  zone_id: z.string().uuid().nullable()
});

export type EditLightingFormData = z.infer<typeof editLightingFormSchema>;
