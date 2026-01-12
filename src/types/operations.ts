/**
 * Operations Types
 * 
 * Type definitions for operations hub (issues, maintenance, requests)
 * @module types/operations
 */

import type { Database } from '@/integrations/supabase/types';

// ============================================================================
// Base Types from Database
// ============================================================================

export type IssueRow = Database['public']['Tables']['issues']['Row'];
export type IssueInsert = Database['public']['Tables']['issues']['Insert'];
export type IssueUpdate = Database['public']['Tables']['issues']['Update'];

export type IssuePriority = Database['public']['Enums']['issue_priority_enum'];
export type IssueStatus = Database['public']['Enums']['issue_status_enum'];

// ============================================================================
// Extended Types with Relations
// ============================================================================

/** Basic building info for joined queries */
export interface BuildingRef {
  id: string;
  name: string;
}

/** Basic floor info for joined queries */
export interface FloorRef {
  id: string;
  floor_number: number;
  name?: string;
}

/** Basic room info for joined queries */
export interface RoomRef {
  id: string;
  room_number: string;
  room_name: string | null;
}

/** Basic user info for joined queries */
export interface UserRef {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email?: string;
}

/** Issue with all relations expanded */
export interface IssueWithRelations extends IssueRow {
  building: BuildingRef | null;
  floor: FloorRef | null;
  room: RoomRef | null;
  reported_by_user: UserRef | null;
  assigned_to_user: UserRef | null;
}

// ============================================================================
// Filter Types
// ============================================================================

/** Filters for querying issues */
export interface IssueFilters {
  status?: IssueStatus;
  priority?: IssuePriority;
  buildingId?: string;
  floorId?: string;
  roomId?: string;
  assignedTo?: string;
  reportedBy?: string;
  issueType?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

/** Filters for querying key requests */
export interface KeyRequestFilters {
  status?: string;
  requesterId?: string;
  keyId?: string;
}

/** Filters for querying supply requests */
export interface SupplyRequestFilters {
  status?: string;
  requesterId?: string;
  department?: string;
}

// ============================================================================
// Resolution Types
// ============================================================================

/** Data for resolving an issue */
export interface IssueResolution {
  type: string;
  notes: string;
}

// ============================================================================
// Audit Types
// ============================================================================

/** Audit log entry */
export interface AuditLogEntry {
  id: string;
  table_name: string;
  record_id: string;
  /** @deprecated Use 'operation' instead - kept for backwards compatibility */
  action?: 'INSERT' | 'UPDATE' | 'DELETE';
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  changed_fields: string[] | null;
  action_description: string | null;
  user_id: string | null;
  created_at: string;
  user?: UserRef | null;
}

// ============================================================================
// Room Status Types
// ============================================================================

/** Room with relations for status updates */
export interface RoomWithRelations {
  id: string;
  room_number: string;
  room_name: string | null;
  status: string;
  updated_at: string | null;
  updated_by: string | null;
  building: BuildingRef | null;
  floor: FloorRef | null;
}

// ============================================================================
// Key Request Types
// ============================================================================

/** Key info for joined queries */
export interface KeyRef {
  id: string;
  key_number: string;
  description: string | null;
}

/** Key request with relations */
export interface KeyRequestWithRelations {
  id: string;
  status: string;
  created_at: string;
  updated_at: string | null;
  requester: UserRef | null;
  key: KeyRef | null;
  room: RoomRef | null;
  // Add other fields as needed
}

// ============================================================================
// Supply Request Types
// ============================================================================

/** Supply request with relations */
export interface SupplyRequestWithRelations {
  id: string;
  status: string;
  created_at: string;
  updated_at: string | null;
  items: unknown[];
  requester: UserRef | null;
  // Add other fields as needed
}

// ============================================================================
// Re-exports for backwards compatibility
// ============================================================================

export type { GroupingMode, ViewMode, StatusFilter, PriorityFilter } from './issues';
