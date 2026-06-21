
import { z } from "zod";
import type { KeyFormData } from "./KeyTypes";

export const keyFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["physical_key", "elevator_pass", "room_key"]),
  isPasskey: z.boolean(),
  isElevatorCard: z.boolean().default(false),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  buildingId: z.string().optional(),
  floorId: z.string().optional(),
  doorId: z.string().optional(),
  roomId: z.string().optional(),
  keyScope: z.enum(["door", "room", "room_door"]).default("door"),
  occupantId: z.string().optional(),
  spareKeys: z.number()
    .min(0, "Spare keys cannot be negative")
    .default(0),
}).superRefine((data, ctx) => {
  if (data.isElevatorCard) return;
  if (!data.buildingId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["buildingId"], message: "Select a building" });
  }
  if (data.isPasskey) return;
  if (!data.floorId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["floorId"], message: "Select a floor" });
  }
  if (data.keyScope === "door" && !data.doorId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["doorId"], message: "Select a door" });
  }
  if ((data.keyScope === "room" || data.keyScope === "room_door") && !data.roomId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["roomId"], message: "Select a room" });
  }
});

export interface CreateKeyFormProps {
  onSubmit: (data: KeyFormData) => Promise<void>;
  isSubmitting: boolean;
  onCancel: () => void;
}
