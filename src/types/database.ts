// Database type exports and extensions
import { Database } from "@/integrations/supabase/types";

// Export commonly used types
export type KeyOrder = Database['public']['Tables']['key_orders']['Row'];
export type KeyOrderStatus = 'pending_fulfillment' | 'ordered' | 'in_transit' | 'received' | 'ready_for_pickup' | 'delivered' | 'completed' | 'cancelled' | 'partially_received';
export type User = Database['public']['Tables']['profiles']['Row'];
export type InventoryItem = Database['public']['Tables']['inventory_items']['Row'];

// Extend KeyOrder with joined data for components that expect it
export interface KeyOrderWithProfile extends KeyOrder {
  user_profiles?: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

// Courtroom types
export interface CourtroomAvailability {
  id: string;
  room_number: string;
  courtroom_number: string;
  accessibility_features: any;
  availability_status: string;
  is_active: boolean;
  juror_capacity: number;
  maintenance_status: string;
  spectator_capacity: number;
  notes: string;
  temporary_location?: string;
  maintenance_start_date?: string;
  maintenance_end_date?: string;
  room_name?: string;
}

export interface CourtMaintenance {
  court_id: string;
  court_room_id: string;
  courtroom_number: string;
  maintenance_end_date: string;
  maintenance_notes: string;
  maintenance_start_date: string;
  maintenance_status: string;
  maintenance_title: string;
  room_number: string;
  schedule_id: string;
  schedule_status: string;
  scheduled_end_date: string;
  scheduled_start_date: string;
  temporary_location?: string;
  maintenance_schedule_id?: string;
}

// Personnel types
export interface UnifiedPersonnel {
  id: string;
  user_id?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  department?: string;
  is_registered?: boolean;
  access_level?: string;
  verification_status?: string;
}

export interface PersonnelStats {
  totalPersonnel?: number;
  registeredUsers?: number;
  unassignedRoles?: number;
  activeUsers: number;
  pendingApprovals: number;
  adminUsers: number;
  securityAlerts: number;
}

// Extended inventory item type
export interface ExtendedInventoryItem extends InventoryItem {
  category?: string;
  current_stock?: number;
  minimum_threshold?: number;
  maximum_stock?: number;
}