
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchRelocationById } from "../services/queries/relocationQueries";
import { updateRelocation } from "../services/mutations/relocationMutations";
import { RoomRelocation, RelocationStatus } from "../types/relocationTypes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface RelocationDetailsProps {
  relocationId: string;
}

export function RelocationDetails({ relocationId }: RelocationDetailsProps) {
  const queryClient = useQueryClient();
  const { data: relocation, isLoading, isError } = useQuery({
    queryKey: ['relocation', relocationId],
    queryFn: () => fetchRelocationById(relocationId),
  });

  const updateMutation = useMutation({
    mutationFn: updateRelocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relocations'] });
      queryClient.invalidateQueries({ queryKey: ['relocation', relocationId] });
      toast.success('Relocation updated successfully');
    },
    onError: (error) => {
      console.error('Error updating relocation:', error);
      toast.error('Failed to update relocation');
    },
  });

  const handleStatusChange = async (newStatus: RelocationStatus) => {
    try {
      await updateMutation.mutateAsync({
        id: relocationId,
        status: newStatus,
        actual_end_date: newStatus === 'completed' ? new Date().toISOString() : undefined
      });
    } catch (error) {
      console.error('Error updating relocation status:', error);
    }
  };

  if (isLoading) {
    return <div>Loading relocation details...</div>;
  }

  if (isError || !relocation) {
    return <div>Error loading relocation details.</div>;
  }

  const canActivate = relocation?.status === 'scheduled';
  const canComplete = relocation?.status === 'active';
  const canCancel = relocation?.status === 'scheduled' || relocation?.status === 'active';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Relocation Details</h2>
        <Badge variant={relocation.status === 'active' ? 'default' : 'secondary'}>
          {relocation.status}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Relocation Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Reason:</strong> {relocation.reason}</p>
              <p><strong>Type:</strong> {relocation.relocation_type}</p>
              <p><strong>Start Date:</strong> {format(new Date(relocation.start_date), 'MMM dd, yyyy')}</p>
              <p><strong>End Date:</strong> {format(new Date(relocation.end_date), 'MMM dd, yyyy')}</p>
              {relocation.actual_end_date && (
                <p><strong>Actual End Date:</strong> {format(new Date(relocation.actual_end_date), 'MMM dd, yyyy')}</p>
              )}
              {relocation.notes && <p><strong>Notes:</strong> {relocation.notes}</p>}
              {relocation.special_instructions && <p><strong>Special Instructions:</strong> {relocation.special_instructions}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Original Room</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Name:</strong> {relocation.original_room_name}</p>
              <p><strong>Number:</strong> {relocation.original_room_number}</p>
              <p><strong>Building:</strong> {relocation.building_name}</p>
              <p><strong>Floor:</strong> {relocation.floor_name}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Temporary Room</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Name:</strong> {relocation.temporary_room_name}</p>
              <p><strong>Number:</strong> {relocation.temporary_room_number}</p>
              <p><strong>Building:</strong> {relocation.building_name}</p>
              <p><strong>Floor:</strong> {relocation.floor_name}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-start gap-4">
        {canActivate && (
          <Button onClick={() => handleStatusChange('active')} disabled={updateMutation.isPending}>
            Activate Relocation
          </Button>
        )}
        {canComplete && (
          <Button onClick={() => handleStatusChange('completed')} disabled={updateMutation.isPending}>
            Complete Relocation
          </Button>
        )}
        {canCancel && (
          <Button variant="destructive" onClick={() => handleStatusChange('cancelled')} disabled={updateMutation.isPending}>
            Cancel Relocation
          </Button>
        )}
      </div>
    </div>
  );
}
