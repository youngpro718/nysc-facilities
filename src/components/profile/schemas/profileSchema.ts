
import * as z from "zod";

const phoneRegex = /^[\d\s\-\+\(\)]+$/;

export const personalInfoSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  username: z.string().min(2, "Username must be at least 2 characters"),
  phone: z.string().optional().refine(
    (val) => !val || phoneRegex.test(val),
    "Please enter a valid phone number"
  ),
  department: z.string().optional(),
  title: z.string().optional(),
  bio: z.string().max(500, "Bio must be 500 characters or less").optional(),
  time_zone: z.string(),
  language: z.string(),
  emergency_contact: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    relationship: z.string().optional(),
  }).refine(
    (data) => {
      const filledFields = [data.name, data.phone, data.relationship].filter(Boolean).length;
      return filledFields === 0 || filledFields === 3;
    },
    "Complete all emergency contact fields or leave all empty"
  ).refine(
    (data) => !data.phone || phoneRegex.test(data.phone),
    "Please enter a valid emergency contact phone number"
  ),
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
