/**
 * Staff Tasks Types
 * 
 * Types for the staff task management system
 */

export type TaskType = 'move_item' | 'delivery' | 'setup' | 'pickup' | 'maintenance' | 'general';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending_approval' | 'approved' | 'claimed' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';

export interface StaffTask {
  id: string;
  title: string;
  description: string | null;
  task_type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  
  // Request info
  is_request: boolean;
  requested_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  
  // Assignment
  created_by: string;
  assigned_to: string | null;
  claimed_by: string | null;
  claimed_at: string | null;
  
  // Inventory linking
  inventory_item_id: string | null;
  from_room_id: string | null;
  to_room_id: string | null;
  quantity: number;
  
  // Execution
  started_at: string | null;
  completed_at: string | null;
  completion_notes: string | null;
  
  // Metadata
  due_date: string | null;
  created_at: string;
  updated_at: string;
  
  // Joined data
  requester?: { full_name: string; email: string } | null;
  approver?: { full_name: string } | null;
  assignee?: { full_name: string } | null;
  claimer?: { full_name: string } | null;
  creator?: { full_name: string } | null;
  inventory_item?: { name: string; sku: string } | null;
  from_room?: { room_number: string; name: string } | null;
  to_room?: { room_number: string; name: string } | null;
}

export interface StaffTaskHistory {
  id: string;
  task_id: string;
  action: string;
  performed_by: string | null;
  notes: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  created_at: string;
  performer?: { full_name: string } | null;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  task_type: TaskType;
  priority?: TaskPriority;
  assigned_to?: string;
  inventory_item_id?: string;
  from_room_id?: string;
  to_room_id?: string;
  quantity?: number;
  due_date?: string;
}

export interface RequestTaskInput {
  title: string;
  description?: string;
  task_type: TaskType;
  inventory_item_id?: string;
  from_room_id?: string;
  to_room_id?: string;
  quantity?: number;
}

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  move_item: 'Move Item',
  delivery: 'Delivery',
  setup: 'Setup',
  pickup: 'Pickup',
  maintenance: 'Maintenance',
  general: 'General Task',
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  claimed: 'Claimed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
};

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'bg-slate-500',
  medium: 'bg-blue-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  pending_approval: 'bg-yellow-500',
  approved: 'bg-green-500',
  claimed: 'bg-blue-500',
  in_progress: 'bg-purple-500',
  completed: 'bg-green-600',
  cancelled: 'bg-gray-500',
  rejected: 'bg-red-500',
};
