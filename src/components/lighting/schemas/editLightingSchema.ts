
import * as z from "zod";

export const editLightingFormSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .refine((name) => {
      const roomPattern = /^Room \d+ - (ceiling|wall|floor) Light \d+$/;
      const hallwayPattern = /^Hallway .+ - Light \d+$/;
      return roomPattern.test(name) || hallwayPattern.test(name);
    }, "Name must follow the format: 'Room {number} - {position} Light {sequence}' or 'Hallway {name} - Light {sequence}'"),
  type: z.enum(["standard", "emergency", "motion_sensor"]),
  status: z.enum([
    "functional",
    "maintenance_needed",
    "non_functional",
    "pending_maintenance",
    "scheduled_replacement",
  ]),
  maintenance_notes: z.string().nullable(),
  emergency_circuit: z.boolean().default(false),
  backup_power_source: z.string().nullable(),
  emergency_duration_minutes: z.number().nullable(),
  technology: z.enum(["LED", "Fluorescent", "Bulb"]).nullable(),
  bulb_count: z.number().min(1, "At least one bulb is required"),
  electrical_issues: z.object({
    short_circuit: z.boolean().default(false),
    wiring_issues: z.boolean().default(false),
    voltage_problems: z.boolean().default(false),
  }).nullable(),
  ballast_issue: z.boolean().default(false),
  ballast_check_notes: z.string().nullable(),
  space_id: z.string().uuid(),
  space_type: z.enum(["room", "hallway"]),
  position: z.enum(["ceiling", "wall", "floor"]),
  zone_id: z.string().uuid().nullable(),
});

export type EditLightingFormData = z.infer<typeof editLightingFormSchema>;
