
import { Department } from "../hooks/types";

export interface VerificationRequest {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  profile: {
    email: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null;
  is_admin: boolean;
}

export interface VerificationTableProps {
  requests: VerificationRequest[] | undefined;
  departments: Department[] | undefined;
  selectedOccupants: string[];
  selectedDepartment: string | null;
  onSelectAll: (selected: boolean) => void;
  onSelectOne: (id: string, selected: boolean) => void;
  onDepartmentChange: (id: string) => void;
  onVerify: (id: string, approved: boolean) => void;
  onAssignRooms: (userId: string) => void;
  onAssignKeys: (userId: string) => void;
  onToggleAdmin: (userId: string, isAdmin: boolean) => void;
  onDeleteUser?: (userId: string) => void;
}
