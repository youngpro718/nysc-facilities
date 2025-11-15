
import { z } from "zod";
import { editSpaceSchema } from "../../schemas/editSpaceSchema";

export type FormSpace = z.infer<typeof editSpaceSchema>;

export interface EmergencyExit {
  location: string;
  type: string;
  notes?: string;
}

export interface MaintenanceScheduleItem {
  date: string;
  type: string;
  status: string;
  assigned_to?: string;
}

export interface HardwareStatusItem {
  hinges?: "functional" | "needs_repair" | "needs_replacement";
  doorknob?: "functional" | "needs_repair" | "needs_replacement";
  lock?: "functional" | "needs_repair" | "needs_replacement";
  frame?: "functional" | "needs_repair" | "needs_replacement";
}
