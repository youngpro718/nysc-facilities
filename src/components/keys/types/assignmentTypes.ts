
export interface KeyAssignment {
  id: string;
  assigned_at: string;
  is_spare: boolean;
  spare_key_reason: string | null;
  recipient_name?: string | null;
  recipient_email?: string | null;
  keys: {
    id: string;
    name: string;
    type: string;
    is_passkey: boolean;
    total_quantity: number;
    available_quantity: number;
  } | null;
  occupant: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string | null;
    department: string | null;
  } | null;
}
