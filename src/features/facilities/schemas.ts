/**
 * Facilities Feature - Zod Schemas
 * 
 * Runtime validation at service boundaries for predictable types.
 * Ensures data from external sources (API, database) matches expected shape.
 * 
 * @module features/facilities/schemas
 */

import { z } from 'zod';
import { RoomStatus, RoomType } from './model';

// ============================================================================
// ENUMS
// ============================================================================

export const RoomStatusSchema = z.enum([
  'available',
  'occupied',
  'maintenance',
  'reserved',
  'closed',
  'under_construction',
]);

export const RoomTypeSchema = z.enum([
  'office',
  'courtroom',
  'conference',
  'storage',
  'restroom',
  'common',
  'mechanical',
]);

// ============================================================================
// ENTITY SCHEMAS
// ============================================================================

export const BuildingSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  address: z.string().optional(),
  total_floors: z.number().int().positive().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional(),
  deleted_at: z.string().datetime().nullable().optional(),
});

export const FloorSchema = z.object({
  id: z.string().uuid(),
  building_id: z.string().uuid(),
  floor_number: z.number().int(),
  name: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional(),
  deleted_at: z.string().datetime().nullable().optional(),
  building: BuildingSchema.optional(),
});

export const OccupantSchema = z.object({
  id: z.string().uuid(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  title: z.string().optional(),
  email: z.string().email().optional(),
});

export const RoomSchema = z.object({
  id: z.string().uuid(),
  building_id: z.string().uuid(),
  floor_id: z.string().uuid(),
  room_number: z.string().min(1),
  room_name: z.string().optional(),
  room_type: RoomTypeSchema.optional(),
  status: RoomStatusSchema,
  capacity: z.number().int().positive().optional(),
  area_sqft: z.number().positive().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional(),
  deleted_at: z.string().datetime().nullable().optional(),
  building: BuildingSchema.optional(),
  floor: FloorSchema.optional(),
  occupants: z.array(OccupantSchema).optional(),
});

export const RoomFiltersSchema = z.object({
  buildingId: z.string().uuid().optional(),
  floorId: z.string().uuid().optional(),
  type: RoomTypeSchema.optional(),
  status: RoomStatusSchema.optional(),
  search: z.string().optional(),
});

// ============================================================================
// ARRAY SCHEMAS
// ============================================================================

export const RoomsArraySchema = z.array(RoomSchema);
export const BuildingsArraySchema = z.array(BuildingSchema);
export const FloorsArraySchema = z.array(FloorSchema);

// ============================================================================
// INPUT SCHEMAS (for mutations)
// ============================================================================

export const CreateRoomInputSchema = z.object({
  building_id: z.string().uuid(),
  floor_id: z.string().uuid(),
  room_number: z.string().min(1).max(50),
  room_name: z.string().min(1).max(200).optional(),
  room_type: RoomTypeSchema.optional(),
  status: RoomStatusSchema.default('available'),
  capacity: z.number().int().positive().max(1000).optional(),
  area_sqft: z.number().positive().max(100000).optional(),
});

export const UpdateRoomInputSchema = CreateRoomInputSchema.partial();

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate and parse room data from API
 * Throws ZodError if validation fails
 */
export function validateRoom(data: unknown) {
  return RoomSchema.parse(data);
}

/**
 * Validate and parse rooms array from API
 * Throws ZodError if validation fails
 */
export function validateRooms(data: unknown) {
  return RoomsArraySchema.parse(data);
}

/**
 * Validate and parse building data from API
 * Throws ZodError if validation fails
 */
export function validateBuilding(data: unknown) {
  return BuildingSchema.parse(data);
}

/**
 * Validate and parse buildings array from API
 * Throws ZodError if validation fails
 */
export function validateBuildings(data: unknown) {
  return BuildingsArraySchema.parse(data);
}

/**
 * Validate and parse floor data from API
 * Throws ZodError if validation fails
 */
export function validateFloor(data: unknown) {
  return FloorSchema.parse(data);
}

/**
 * Validate and parse floors array from API
 * Throws ZodError if validation fails
 */
export function validateFloors(data: unknown) {
  return FloorsArraySchema.parse(data);
}

/**
 * Validate room filters input
 * Throws ZodError if validation fails
 */
export function validateRoomFilters(data: unknown) {
  return RoomFiltersSchema.parse(data);
}

/**
 * Validate create room input
 * Throws ZodError if validation fails
 */
export function validateCreateRoomInput(data: unknown) {
  return CreateRoomInputSchema.parse(data);
}

/**
 * Validate update room input
 * Throws ZodError if validation fails
 */
export function validateUpdateRoomInput(data: unknown) {
  return UpdateRoomInputSchema.parse(data);
}

// ============================================================================
// SAFE PARSE HELPERS (returns success/error instead of throwing)
// ============================================================================

/**
 * Safely validate room data
 * Returns { success: true, data } or { success: false, error }
 */
export function safeValidateRoom(data: unknown) {
  return RoomSchema.safeParse(data);
}

/**
 * Safely validate rooms array
 * Returns { success: true, data } or { success: false, error }
 */
export function safeValidateRooms(data: unknown) {
  return RoomsArraySchema.safeParse(data);
}

/**
 * Safely validate create room input
 * Returns { success: true, data } or { success: false, error }
 */
export function safeValidateCreateRoomInput(data: unknown) {
  return CreateRoomInputSchema.safeParse(data);
}
