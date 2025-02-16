
import * as z from "zod";

export const personalInfoSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  username: z.string().min(2, "Username must be at least 2 characters"),
  phone: z.string().optional(),
  department: z.string().optional(),
  title: z.string().optional(),
  bio: z.string().optional(),
  time_zone: z.string(),
  language: z.string(),
  emergency_contact: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    relationship: z.string().optional(),
  }),
});

export type PersonalInfoValues = z.infer<typeof personalInfoSchema>;

export const timeZones = [
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Asia/Tokyo",
];

export const languages = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
];

export function isValidEmergencyContact(contact: unknown): contact is { name?: string; phone?: string; relationship?: string } {
  if (!contact || typeof contact !== 'object') return false;
  const c = contact as Record<string, unknown>;
  return (
    (!('name' in c) || typeof c.name === 'string') &&
    (!('phone' in c) || typeof c.phone === 'string') &&
    (!('relationship' in c) || typeof c.relationship === 'string')
  );
}
