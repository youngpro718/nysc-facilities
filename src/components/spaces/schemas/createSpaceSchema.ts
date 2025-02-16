
import { z } from "zod";

const directionEnum = z.enum(["north", "south", "east", "west", "adjacent"]);
export type Direction = z.infer<typeof directionEnum>;

const storageTypeEnum = z.enum([
  "file_storage",
  "equipment_storage",
  "supply_storage",
  "evidence_storage",
  "record_storage",
  "general_storage"
]);

const baseSpaceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  floorId: z.string().uuid("Invalid floor ID"),
  status: z.enum(["active", "inactive", "under_maintenance"]).default("active"),
});

const roomSchema = baseSpaceSchema.extend({
  type: z.literal("room"),
  roomNumber: z.string().min(1, "Room number is required"),
  phoneNumber: z.string().optional(),
  roomType: z.enum([
    "courtroom",
    "judges_chambers",
    "jury_room",
    "conference_room",
    "office",
    "filing_room",
    "male_locker_room",
    "female_locker_room",
    "robing_room",
    "stake_holder",
    "records_room",
    "administrative_office",
    "break_room",
    "it_room",
    "utility_room"
  ]),
  description: z.string().optional(),
  parentRoomId: z.string().uuid("Invalid parent room ID").nullable().optional(),
  isStorage: z.boolean().default(false),
  storageCapacity: z.number().nullable().optional(),
  storageType: z.union([storageTypeEnum, z.null()]).optional(),
  storageNotes: z.string().nullable().optional(),
  currentFunction: z.string().optional(),
});

const hallwaySchema = baseSpaceSchema.extend({
  type: z.literal("hallway"),
  section: z.enum(["left_wing", "right_wing", "connector"]),
  hallwayType: z.enum(["public_main", "private"]),
  notes: z.string().optional(),
  maintenance_priority: z.string().optional(),
  maintenance_notes: z.string().optional(),
  description: z.string().optional(),
});

const doorSchema = baseSpaceSchema.extend({
  type: z.literal("door"),
  doorType: z.enum(["standard", "emergency", "secure", "maintenance"]),
  securityLevel: z.enum(["standard", "restricted", "high_security"]).default("standard"),
  passkeyEnabled: z.boolean().default(false),
  is_hallway_connection: z.boolean().default(false),
  connected_hallway_id: z.string().uuid("Invalid hallway ID").nullable().optional(),
  problematic_room_id: z.string().uuid("Invalid room ID").nullable().optional(),
});

export const createSpaceSchema = z.discriminatedUnion("type", [
  roomSchema,
  hallwaySchema,
  doorSchema,
]).refine(
  (data) => {
    if (data.type === "room" && data.isStorage && !data.storageType) {
      return false;
    }
    return true;
  },
  {
    message: "Storage type is required when room is marked as storage",
    path: ["storageType"],
  }
);

export type CreateSpaceFormData = z.infer<typeof createSpaceSchema>;
