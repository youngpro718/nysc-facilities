
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

export function VerificationSection() {
  const [selectedOccupants, setSelectedOccupants] = useState<string[]>([]);
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

  const { data: requests, isLoading, refetch } = useQuery({
    queryKey: ['verification-requests'],
    queryFn: async () => {
      const { data: verificationData, error } = await supabase
        .from('verification_requests')
        .select(`
          *,
          profile:profiles(
            email,
            first_name,
            last_name,
            department_id
          )
        `)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return verificationData;
    }
  });

  const handleVerification = async (requestId: string, approved: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error: verificationError } = await supabase
        .from('verification_requests')
        .update({
          status: approved ? 'approved' : 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          department_id: selectedDepartment
        })
        .eq('id', requestId);

      if (verificationError) throw verificationError;

      const request = requests?.find(r => r.id === requestId);
      if (request?.user_id) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            verification_status: approved ? 'verified' : 'rejected',
            department_id: selectedDepartment
          })
          .eq('id', request.user_id);

        if (profileError) throw profileError;
      }

      toast.success(`User ${approved ? 'approved' : 'rejected'} successfully`);
      refetch();
    } catch (error) {
      console.error('Error updating verification:', error);
      toast.error('Failed to update verification status');
    }
  };

  const handleBulkVerification = async (approve: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error: verificationError } = await supabase
        .from('verification_requests')
        .update({
          status: approve ? 'approved' : 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          department_id: selectedDepartment
        })
        .in('id', selectedOccupants);

      if (verificationError) throw verificationError;

      const selectedRequests = requests?.filter(r => selectedOccupants.includes(r.id)) || [];
      const userIds = selectedRequests.map(r => r.user_id);

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          verification_status: approve ? 'verified' : 'rejected',
          department_id: selectedDepartment
        })
        .in('id', userIds);

      if (profileError) throw profileError;

      toast.success(`${selectedOccupants.length} users ${approve ? 'approved' : 'rejected'} successfully`);
      setSelectedOccupants([]);
      refetch();
    } catch (error) {
      console.error('Error in bulk verification:', error);
      toast.error('Failed to update verification status');
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <VerificationHeader />
      <CardContent>
        {selectedOccupants.length > 0 && (
          <BulkActionBar
            selectedCount={selectedOccupants.length}
            departments={departments}
            selectedDepartment={selectedDepartment}
            onDepartmentChange={setSelectedDepartment}
            onApprove={() => handleBulkVerification(true)}
            onReject={() => handleBulkVerification(false)}
          />
        )}

        {requests?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            No verification requests found
          </div>
        ) : (
          <VerificationTable
            requests={requests}
            departments={departments}
            selectedOccupants={selectedOccupants}
            selectedDepartment={selectedDepartment}
            onSelectAll={(selected) => {
              const pendingRequests = requests.filter(r => r.status === 'pending');
              setSelectedOccupants(selected ? pendingRequests.map(r => r.id) : []);
            }}
            onSelectOne={(id, selected) => {
              if (selected) {
                setSelectedOccupants([...selectedOccupants, id]);
              } else {
                setSelectedOccupants(selectedOccupants.filter(i => i !== id));
              }
            }}
            onDepartmentChange={setSelectedDepartment}
            onVerify={handleVerification}
            onAssignRooms={(userId) => {
              setSelectedOccupants([userId]);
              setShowAssignRooms(true);
            }}
            onAssignKeys={(userId) => {
              setSelectedOccupants([userId]);
              setShowAssignKeys(true);
            }}
          />
        )}

        <AssignRoomsDialog
          open={showAssignRooms}
          onOpenChange={setShowAssignRooms}
          selectedOccupants={selectedOccupants}
          onSuccess={() => {
            setShowAssignRooms(false);
            setSelectedOccupants([]);
          }}
        />

        <AssignKeysDialog
          open={showAssignKeys}
          onOpenChange={setShowAssignKeys}
          selectedOccupants={selectedOccupants}
          onSuccess={() => {
            setShowAssignKeys(false);
            setSelectedOccupants([]);
          }}
        />
      </CardContent>
    </Card>
  );
}
