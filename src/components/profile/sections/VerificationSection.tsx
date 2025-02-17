
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { AssignRoomsDialog } from "@/components/occupants/AssignRoomsDialog";
import { AssignKeysDialog } from "@/components/occupants/AssignKeysDialog";
import { VerificationHeader } from "./verification/VerificationHeader";
import { BulkActionBar } from "./verification/BulkActionBar";
import { VerificationTable } from "./verification/VerificationTable";

type VerificationStatus = 'pending' | 'verified' | 'rejected';
type RequestStatus = 'pending' | 'approved' | 'rejected';

interface Profile {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  verification_status: VerificationStatus;
  department_id: string | null;
}

interface UserVerificationView {
  id: string;
  department: string | null;
  created_at: string;
  updated_at: string;
  profile_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  verification_status: VerificationStatus;
  department_id: string | null;
}

interface VerificationRequest {
  id: string;
  user_id: string;
  department_id: string | null;
  employee_id: string | null;
  status: RequestStatus;
  submitted_at: string;
  profile: Profile | null;
}

export function VerificationSection() {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showAssignRooms, setShowAssignRooms] = useState(false);
  const [showAssignKeys, setShowAssignKeys] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['users-verification'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_verification_view')
        .select('*')
        .returns<UserVerificationView[]>();

      if (error) throw error;
      return data;
    }
  });

  const handleVerification = async (userId: string, approved: boolean) => {
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          verification_status: approved ? 'verified' : 'rejected',
          department_id: selectedDepartment
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      toast.success(`User ${approved ? 'approved' : 'rejected'} successfully`);
      refetch();
    } catch (error) {
      console.error('Error updating verification:', error);
      toast.error('Failed to update verification status');
    }
  };

  const handleBulkVerification = async (approve: boolean) => {
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          verification_status: approve ? 'verified' : 'rejected',
          department_id: selectedDepartment
        })
        .in('id', selectedUsers);

      if (profileError) throw profileError;

      toast.success(`${selectedUsers.length} users ${approve ? 'approved' : 'rejected'} successfully`);
      setSelectedUsers([]);
      refetch();
    } catch (error) {
      console.error('Error in bulk verification:', error);
      toast.error('Failed to update verification status');
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const verificationRequests: VerificationRequest[] = users?.map(user => ({
    id: user.id,
    user_id: user.id,
    department_id: user.department_id,
    employee_id: null,
    status: mapVerificationStatusToRequestStatus(user.verification_status || 'pending'),
    submitted_at: user.created_at,
    profile: {
      id: user.profile_id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      verification_status: user.verification_status || 'pending',
      department_id: user.department_id
    }
  })) || [];

  function mapVerificationStatusToRequestStatus(status: VerificationStatus): RequestStatus {
    switch (status) {
      case 'verified':
        return 'approved';
      case 'rejected':
        return 'rejected';
      default:
        return 'pending';
    }
  }

  return (
    <Card>
      <VerificationHeader />
      <CardContent>
        {selectedUsers.length > 0 && (
          <BulkActionBar
            selectedCount={selectedUsers.length}
            departments={departments}
            selectedDepartment={selectedDepartment}
            onDepartmentChange={setSelectedDepartment}
            onApprove={() => handleBulkVerification(true)}
            onReject={() => handleBulkVerification(false)}
          />
        )}

        {users?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            No users found
          </div>
        ) : (
          <VerificationTable
            requests={verificationRequests}
            departments={departments}
            selectedOccupants={selectedUsers}
            selectedDepartment={selectedDepartment}
            onSelectAll={(selected) => {
              const pendingUsers = verificationRequests.filter(u => u.status === 'pending');
              setSelectedUsers(selected ? pendingUsers.map(u => u.id) : []);
            }}
            onSelectOne={(id, selected) => {
              if (selected) {
                setSelectedUsers([...selectedUsers, id]);
              } else {
                setSelectedUsers(selectedUsers.filter(i => i !== id));
              }
            }}
            onDepartmentChange={setSelectedDepartment}
            onVerify={handleVerification}
            onAssignRooms={(userId) => {
              setSelectedUsers([userId]);
              setShowAssignRooms(true);
            }}
            onAssignKeys={(userId) => {
              setSelectedUsers([userId]);
              setShowAssignKeys(true);
            }}
          />
        )}

        <AssignRoomsDialog
          open={showAssignRooms}
          onOpenChange={setShowAssignRooms}
          selectedOccupants={selectedUsers}
          onSuccess={() => {
            setShowAssignRooms(false);
            setSelectedUsers([]);
          }}
        />

        <AssignKeysDialog
          open={showAssignKeys}
          onOpenChange={setShowAssignKeys}
          selectedOccupants={selectedUsers}
          onSuccess={() => {
            setShowAssignKeys(false);
            setSelectedUsers([]);
          }}
        />
      </CardContent>
    </Card>
  );
}
