
import { z } from 'zod';
import { RoomFormSchema } from '../forms/room/RoomFormSchema';

// Create a schema extension for fields used in forms but not in the base schemas
export const ExtendedFormSchema = RoomFormSchema.extend({
  // Door-related fields
  doorType: z.string().optional(),
  securityLevel: z.string().optional(),
  passkeyEnabled: z.boolean().optional(),
  hardwareStatus: z.record(z.string(), z.string()).optional(),
  closerStatus: z.string().optional(),
  windPressureIssues: z.boolean().optional(),
  nextMaintenanceDate: z.string().optional(),
  maintenanceNotes: z.string().optional(),
  
  // Hallway-related fields
  section: z.string().optional(),
  hallwayType: z.string().optional(),
  trafficFlow: z.string().optional(),
  accessibility: z.string().optional(),
  emergencyRoute: z.string().optional(),
  maintenancePriority: z.string().optional(),
  capacityLimit: z.number().optional(),
  
  // Array fields for dynamic form data
  emergencyExits: z.array(
    z.object({
      location: z.string().optional(),
      type: z.string().optional(),
      notes: z.string().optional()
    })
  ).optional(),
  
  maintenanceSchedule: z.array(
    z.object({
      date: z.string().optional(),
      type: z.string().optional(),
      status: z.string().optional(),
      assignedTo: z.string().optional()
    })
  ).optional(),
  
  // Additional fields
  statusHistory: z.array(z.any()).optional()
});

export type ExtendedFormData = z.infer<typeof ExtendedFormSchema>;
