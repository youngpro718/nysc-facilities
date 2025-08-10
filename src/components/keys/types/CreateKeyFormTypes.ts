
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
}).refine((data) => {
  // Require building for non-elevator-card entries
  if (!data.isElevatorCard) {
    if (!data.buildingId || data.buildingId === "") return false;
  }
  // For non-passkeys, require floor and door/room based on keyScope
  if (!data.isPasskey && !data.isElevatorCard) {
    if (!data.floorId || data.floorId === "") return false;
    if (data.keyScope === "door" && (!data.doorId || data.doorId === "")) return false;
    if ((data.keyScope === "room" || data.keyScope === "room_door") && (!data.roomId || data.roomId === "")) return false;
  }
  return true;
}, {
  message: "Please fill in all required location fields",
  path: ["buildingId"]
});

export interface CreateKeyFormProps {
  onSubmit: (data: KeyFormData) => Promise<void>;
  isSubmitting: boolean;
  onCancel: () => void;
}
