import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  X, 
  Clock, 
  UserCheck, 
  Building2, 
  Key,
  AlertCircle
} from "lucide-react";
import { AssignRoomsDialog } from "@/components/occupants/AssignRoomsDialog";
import { AssignKeysDialog } from "@/components/occupants/AssignKeysDialog";

type VerificationRequest = {
  id: string;
  user_id: string;
  agency_id: string | null;
  department: string | null;
  employee_id: string | null;
  rejection_reason: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  supporting_documents: string[] | null;
  created_at: string;
  updated_at: string;
  profile?: {
    email: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null;
};

export function VerificationSection() {
  const [selectedOccupants, setSelectedOccupants] = useState<string[]>([]);
  const [showAssignRooms, setShowAssignRooms] = useState(false);
  const [showAssignKeys, setShowAssignKeys] = useState(false);
  
  const { data: requests, isLoading, refetch } = useQuery({
    queryKey: ['verification-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('verification_requests')
        .select(`
          *,
          profile:user_id(
            email,
            first_name,
            last_name
          )
        `)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return data as VerificationRequest[];
    }
  });

  const handleVerification = async (requestId: string, approved: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('verification_requests')
        .update({
          status: approved ? 'approved' : 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

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

      const { error } = await supabase
        .from('verification_requests')
        .update({
          status: approve ? 'approved' : 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .in('id', selectedOccupants);

      if (error) throw error;

      toast.success(`${selectedOccupants.length} users ${approve ? 'approved' : 'rejected'} successfully`);
      setSelectedOccupants([]);
      refetch();
    } catch (error) {
      console.error('Error in bulk verification:', error);
      toast.error('Failed to update verification status');
    }
  };

  const getStatusBadge = (status: VerificationRequest['status']) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Check className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <X className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const pendingRequests = requests?.filter(r => r.status === 'pending') || [];
  const approvedRequests = requests?.filter(r => r.status === 'approved') || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          Verification Requests
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Bulk Actions */}
        {selectedOccupants.length > 0 && (
          <div className="mb-4 p-4 bg-muted rounded-lg flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedOccupants.length} requests selected
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleBulkVerification(true)}
              >
                <Check className="h-4 w-4 mr-1" />
                Approve Selected
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleBulkVerification(false)}
              >
                <X className="h-4 w-4 mr-1" />
                Reject Selected
              </Button>
            </div>
          </div>
        )}

        {requests?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            No verification requests found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={pendingRequests.length > 0 && selectedOccupants.length === pendingRequests.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedOccupants(pendingRequests.map(r => r.id));
                      } else {
                        setSelectedOccupants([]);
                      }
                    }}
                    className="rounded border-input"
                  />
                </TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests?.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    {request.status === 'pending' && (
                      <input
                        type="checkbox"
                        checked={selectedOccupants.includes(request.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedOccupants([...selectedOccupants, request.id]);
                          } else {
                            setSelectedOccupants(selectedOccupants.filter(id => id !== request.id));
                          }
                        }}
                        className="rounded border-input"
                      />
                    )}
                  </TableCell>
                  <TableCell>{request.employee_id || '-'}</TableCell>
                  <TableCell>
                    {request.profile ? 
                      `${request.profile.first_name || ''} ${request.profile.last_name || ''}`.trim() || '-' 
                      : '-'}
                  </TableCell>
                  <TableCell>{request.department || '-'}</TableCell>
                  <TableCell>
                    {format(new Date(request.submitted_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>
                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleVerification(request.id, true)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleVerification(request.id, false)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                    {request.status === 'approved' && (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedOccupants([request.user_id]);
                            setShowAssignRooms(true);
                          }}
                        >
                          <Building2 className="h-4 w-4 mr-1" />
                          Assign Rooms
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedOccupants([request.user_id]);
                            setShowAssignKeys(true);
                          }}
                        >
                          <Key className="h-4 w-4 mr-1" />
                          Assign Keys
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
