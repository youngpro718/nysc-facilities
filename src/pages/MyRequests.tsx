import { useState } from "react";
import { Plus, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useKeyRequests } from "@/hooks/useKeyRequests";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { KeyRequestForm } from "@/components/requests/KeyRequestForm";

const statusConfig = {
  pending: { 
    icon: Clock, 
    color: "bg-yellow-500", 
    label: "Pending",
    variant: "secondary" as const
  },
  approved: { 
    icon: CheckCircle, 
    color: "bg-green-500", 
    label: "Approved",
    variant: "default" as const
  },
  rejected: { 
    icon: XCircle, 
    color: "bg-red-500", 
    label: "Rejected",
    variant: "destructive" as const
  },
  completed: { 
    icon: CheckCircle, 
    color: "bg-blue-500", 
    label: "Completed",
    variant: "outline" as const
  }
};

export default function MyRequests() {
  const [showRequestForm, setShowRequestForm] = useState(false);
  const { user } = useAuth();
  const { data: requests = [], isLoading, refetch } = useKeyRequests(user?.id);

  const handleSubmitRequest = async (data: any) => {
    setShowRequestForm(false);
    try {
      const { submitKeyRequest } = await import('@/services/supabase/keyRequestService');
      await submitKeyRequest({ ...data, user_id: user!.id });
      const { toast } = await import('sonner');
      toast.success('Key request submitted successfully!');
      refetch();
    } catch (error) {
      const { toast } = await import('sonner');
      toast.error('Failed to submit key request.');
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="My Requests" description="Track your key requests" />
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading your requests...</div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader 
        title="My Requests" 
        description="Track and manage your key requests"
      >
        <Button onClick={() => setShowRequestForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </PageHeader>

      <KeyRequestForm 
        open={showRequestForm}
        onClose={() => setShowRequestForm(false)}
        onSubmit={handleSubmitRequest}
      />

      {requests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No requests yet</h3>
            <p className="text-muted-foreground mb-4">
              You haven't submitted any key requests. Get started by creating your first request.
            </p>
            <Button onClick={() => setShowRequestForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Request
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            
            return (
              <Card key={request.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{request.key_id || 'Key Request'}</CardTitle>
                    <Badge variant={statusConfig.pending.variant}>
                      <Clock className="h-3 w-3 mr-1" />
                      {request.status || 'Pending'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {request.reason && (
                    <div>
                      <p className="font-medium text-sm text-muted-foreground mb-1">Reason</p>
                      <p className="text-sm">{request.reason}</p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
                    <span>Submitted: {request.created_at ? format(new Date(request.created_at), "MMM d, yyyy 'at' h:mm a") : 'Unknown'}</span>
                    {request.updated_at && request.updated_at !== request.created_at && (
                      <span>Updated: {format(new Date(request.updated_at), "MMM d, yyyy")}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}