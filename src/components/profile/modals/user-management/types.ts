/**
 * Shared types for User Management components
 * Extracted to avoid circular dependencies
 */

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  verification_status: string;
  is_approved: boolean;
  created_at: string;
  department: string;
  title: string;
  is_admin?: boolean;
  metadata?: any;
  access_level?: 'none' | 'read' | 'write' | 'admin';
  is_suspended?: boolean;
  suspension_reason?: string;
  suspended_at?: string;
}

export interface UserManagementActions {
  onRefresh: () => void;
  onEdit: (user: User) => void;
  onSuspend: (user: User) => void;
  onVerificationOverride: (user: User) => void;
  onPromoteToAdmin: (user: User) => void;
  onDemoteFromAdmin: (user: User) => void;
}

export interface UserSectionProps {
  users: User[];
  currentUserId: string | null;
  searchTerm: string;
  loading?: boolean;
  onRefresh: () => void;
}
