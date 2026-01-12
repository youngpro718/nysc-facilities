/**
 * Form Types
 * 
 * Type definitions for form submissions and related data
 * @module types/forms
 */

// ============================================================================
// Common Types
// ============================================================================

/** Base result for form submission operations */
export interface FormSubmissionResult {
  success: boolean;
  requestId?: string;
  error?: string;
}

/** Basic user profile reference */
export interface UserProfileRef {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

// ============================================================================
// Key Request Form Types
// ============================================================================

export interface KeyRequestFormData {
  requestor_email?: string;
  room_number?: string;
  reason: string;
  request_type: string;
  room_other?: string | null;
  quantity: number;
  emergency_contact?: string | null;
}

// ============================================================================
// Supply Request Form Types
// ============================================================================

export interface SupplyRequestItem {
  item_name: string;
  quantity: number;
  notes?: string | null;
}

export interface SupplyRequestFormData {
  requestor_email?: string;
  title: string;
  description?: string;
  justification: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  delivery_location?: string;
  items: SupplyRequestItem[];
}

// ============================================================================
// Maintenance Request Form Types
// ============================================================================

export interface MaintenanceRequestFormData {
  requestor_email?: string;
  room_number?: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduled_date?: string | null;
  work_type?: string;
}

// ============================================================================
// Issue Report Form Types
// ============================================================================

export interface IssueReportFormData {
  requestor_email?: string;
  title?: string;
  description: string;
  issue_type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  location_description: string;
  severity?: 'low' | 'medium' | 'high';
}

// ============================================================================
// Generic Form Data Union Type
// ============================================================================

export type FormData = 
  | KeyRequestFormData 
  | SupplyRequestFormData 
  | MaintenanceRequestFormData 
  | IssueReportFormData;
