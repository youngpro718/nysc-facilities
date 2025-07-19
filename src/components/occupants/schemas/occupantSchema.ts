
import { z } from "zod";

// Define enums to match database
export const OccupantStatusEnum = z.enum([
  "active",
  "inactive",
  "on_leave",
  "terminated"
]);

export const OccupantStatusChangeReasonEnum = z.enum([
  "new_hire",
  "voluntary_leave",
  "involuntary_leave",
  "temporary_leave",
  "returned_from_leave",
  "retirement",
  "other"
]);

export const CourtRoleEnum = z.enum([
  "judge",
  "court_aide", 
  "clerk",
  "sergeant",
  "court_officer",
  "bailiff",
  "court_reporter",
  "administrative_assistant",
  "facilities_manager",
  "admin"
]);

export const occupantSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").nullable(),
  phone: z.string().nullable(),
  department: z.string().nullable(),
  role: CourtRoleEnum.nullable(),
  court_position: z.string().nullable(),
  title: z.string().nullable(),
  status: OccupantStatusEnum.default("active"),
  employment_type: z.string().nullable(),
  supervisor_id: z.string().uuid().nullable(),
  hire_date: z.string().nullable(),
  termination_date: z.string().nullable(),
  rooms: z.array(z.string().uuid()),
  keys: z.array(z.string().uuid()),
  access_level: z.enum(["standard", "restricted", "elevated"]).default("standard"),
  emergency_contact: z.object({
    name: z.string().nullable(),
    phone: z.string().nullable(),
    relationship: z.string().nullable(),
    alternate_phone: z.string().nullable(),
    email: z.string().nullable(),
  }).nullable(),
  notes: z.string().nullable(),
});

export type OccupantFormData = z.infer<typeof occupantSchema>;
export type OccupantStatus = z.infer<typeof OccupantStatusEnum>;
export type OccupantStatusChangeReason = z.infer<typeof OccupantStatusChangeReasonEnum>;
export type CourtRole = z.infer<typeof CourtRoleEnum>;
