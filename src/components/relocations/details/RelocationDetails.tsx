
import { useRelocationDetails } from "../hooks/useRelocations";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, AlertTriangle, Clock, CheckCircle, Building, Play, X, CheckSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

interface RelocationDetailsProps {
  id: string;
}

export function RelocationDetails({ id }: RelocationDetailsProps) {
  const { 
    relocation, 
    isLoading, 
    isError, 
    activateRelocation,
    completeRelocation,
    cancelRelocation,
    isActivating,
    isCompleting,
    isCancelling
  } = useRelocationDetails(id);
  
  const [confirmAction, setConfirmAction] = useState<'activate' | 'complete' | 'cancel' | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="h-6 w-24" />
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              </div>
              <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !relocation) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mt-4">
        <h3 className="text-lg font-medium">Error Loading Relocation</h3>
        <p>Unable to load the relocation details. The ID may be invalid or the relocation may not exist.</p>
        <Button asChild className="mt-4" variant="outline">
          <Link to="/relocations">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Relocations
          </Link>
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Scheduled</Badge>;
      case 'active':
        return <Badge className="bg-blue-500 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Active</Badge>;
      case 'completed':
        return <Badge className="bg-green-500 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleAction = (action: 'activate' | 'complete' | 'cancel') => {
    if (confirmAction === action) {
      // Execute the action
      if (action === 'activate') {
        activateRelocation();
      } else if (action === 'complete') {
        completeRelocation();
      } else if (action === 'cancel') {
        cancelRelocation();
      }
      setConfirmAction(null);
    } else {
      // Set to confirmation state
      setConfirmAction(action);
    }
  };

  const renderActionButtons = () => {
    if (relocation.status === 'scheduled') {
      return (
        <div className="flex items-center gap-2 mt-6">
          <Button 
            onClick={() => handleAction('activate')} 
            className="flex items-center gap-2"
            disabled={isActivating}
          >
            {confirmAction === 'activate' ? (
              'Confirm Activation'
            ) : (
              <>
                <Play className="h-4 w-4" />
                Activate
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleAction('cancel')}
            className="flex items-center gap-2 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
            disabled={isCancelling}
          >
            {confirmAction === 'cancel' ? (
              'Confirm Cancellation'
            ) : (
              <>
                <X className="h-4 w-4" />
                Cancel
              </>
            )}
          </Button>
        </div>
      );
    } else if (relocation.status === 'active') {
      return (
        <div className="flex items-center gap-2 mt-6">
          <Button 
            onClick={() => handleAction('complete')}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            disabled={isCompleting}
          >
            {confirmAction === 'complete' ? (
              'Confirm Completion'
            ) : (
              <>
                <CheckSquare className="h-4 w-4" />
                Complete
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleAction('cancel')}
            className="flex items-center gap-2 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
            disabled={isCancelling}
          >
            {confirmAction === 'cancel' ? (
              'Confirm Cancellation'
            ) : (
              <>
                <X className="h-4 w-4" />
                Cancel
              </>
            )}
          </Button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link to="/relocations">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Relocations
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Relocation Details</h1>
        </div>
        <div>
          {getStatusBadge(relocation.status)}
        </div>
      </div>

      <Card className="bg-card shadow-md">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Original Room Card */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-medium">
                <Building className="h-5 w-5 text-muted-foreground" />
                <h2>Original Room</h2>
              </div>
              <Card className="bg-muted/30 border-muted">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <p className="text-lg font-medium">{relocation.original_room?.name || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">
                      {relocation.original_room?.floor?.buildings?.name}, {relocation.original_room?.floor?.name}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Temporary Room Card */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-medium">
                <Building className="h-5 w-5 text-muted-foreground" />
                <h2>Temporary Room</h2>
              </div>
              <Card className="bg-muted/30 border-muted">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <p className="text-lg font-medium">{relocation.temporary_room?.name || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">
                      {relocation.temporary_room?.floor?.buildings?.name}, {relocation.temporary_room?.floor?.name}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Relocation Details */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium">Relocation Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{relocation.relocation_type}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Created At</p>
                  <p className="font-medium">{formatDate(relocation.created_at)}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Reason</p>
                <p className="font-medium">{relocation.reason || 'No reason provided'}</p>
              </div>
            </div>

            {/* Schedule */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                Schedule
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">{formatDate(relocation.start_date)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-medium">{formatDate(relocation.end_date)}</p>
                </div>
                {relocation.actual_end_date && (
                  <div className="space-y-1 col-span-2">
                    <p className="text-sm text-muted-foreground">Actual End Date</p>
                    <p className="font-medium">{formatDate(relocation.actual_end_date)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {relocation.notes && (
            <>
              <Separator className="my-6" />
              <div className="space-y-2">
                <h2 className="text-lg font-medium">Notes</h2>
                <div className="bg-muted/30 p-4 rounded-md text-muted-foreground">
                  {relocation.notes}
                </div>
              </div>
            </>
          )}

          {(relocation.status === 'scheduled' || relocation.status === 'active') && (
            <>
              <Separator className="my-6" />
              <div className="space-y-2">
                <h2 className="text-lg font-medium">Actions</h2>
                {renderActionButtons()}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
