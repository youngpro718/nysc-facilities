
import { z } from "zod";
import type { KeyFormData } from "./KeyTypes";

export const keyFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["physical_key", "elevator_pass", "room_key"]),
  isPasskey: z.boolean(),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  buildingId: z.string().optional(),
  floorId: z.string().optional(),
  doorId: z.string().optional(),
  roomId: z.string().optional(),
  keyScope: z.enum(["door", "room"]).default("door"),
  occupantId: z.string().optional(),
  spareKeys: z.number().min(0, "Spare keys cannot be negative").default(0),
});

export interface CreateKeyFormProps {
  onSubmit: (data: KeyFormData) => Promise<void>;
  isSubmitting: boolean;
  onCancel: () => void;
}
