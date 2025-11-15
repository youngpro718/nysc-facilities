
export interface Department {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface SelectedUser {
  requestId: string;
  userId: string;
  name: string;
}
