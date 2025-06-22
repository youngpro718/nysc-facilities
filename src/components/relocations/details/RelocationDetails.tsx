
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, MapPin, Clock, User, FileText, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { useRelocations } from "../hooks/useRelocations";
import { RoomRelocation, RelocationStatus } from "../types/relocationTypes";

export function RelocationDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);
  const { updateRelocation } = useRelocations();

  const { data: relocation, isLoading, error, refetch } = useQuery({
    queryKey: ['relocation', id],
    queryFn: async () => {
      if (!id) throw new Error('No relocation ID provided');
      
      const { data, error } = await supabase
        .from('room_relocations')
        .select(`
          *,
          original_room:rooms!original_room_id(name, room_number, floors(name, buildings(name))),
          temporary_room:rooms!temporary_room_id(name, room_number, floors(name, buildings(name)))
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as RoomRelocation;
    },
    enabled: !!id,
  });

  const handleStatusUpdate = async (newStatus: RelocationStatus) => {
    if (!relocation) return;
    
    setIsUpdating(true);
    try {
      const updateData: { id: string; status: RelocationStatus; actual_end_date?: string } = {
        id: relocation.id,
        status: newStatus,
      };

      if (newStatus === 'completed') {
        updateData.actual_end_date = new Date().toISOString();
      }

      await updateRelocation(updateData);
      await refetch();
    } catch (error) {
      console.error('Error updating relocation status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !relocation) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Relocation Not Found</h2>
          <p className="text-gray-600">The requested relocation could not be found.</p>
          <Button onClick={() => navigate('/relocations')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Relocations
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: RelocationStatus) => {
    switch (status) {
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canUpdateStatus = (currentStatus: RelocationStatus, newStatus: RelocationStatus) => {
    if (currentStatus === 'completed' || currentStatus === 'cancelled') return false;
    if (currentStatus === 'scheduled' && newStatus === 'active') return true;
    if (currentStatus === 'active' && (newStatus === 'completed' || newStatus === 'cancelled')) return true;
    return false;
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/relocations')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Relocations
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Relocation Details</h1>
            <p className="text-gray-600">
              {relocation.original_room_name || 'Unknown Room'} → {relocation.temporary_room_name || 'Unknown Room'}
            </p>
          </div>
        </div>
        <Badge className={getStatusColor(relocation.status)}>
          {relocation.status.charAt(0).toUpperCase() + relocation.status.slice(1)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Room Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Room Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Original Room</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Name:</strong> {relocation.original_room_name || 'Unknown'}</p>
                    <p><strong>Number:</strong> {relocation.original_room_number || 'N/A'}</p>
                    <p><strong>Floor:</strong> {relocation.floor_name || 'Unknown'}</p>
                    <p><strong>Building:</strong> {relocation.building_name || 'Unknown'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Temporary Room</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Name:</strong> {relocation.temporary_room_name || 'Unknown'}</p>
                    <p><strong>Number:</strong> {relocation.temporary_room_number || 'N/A'}</p>
                    <p><strong>Floor:</strong> {relocation.floor_name || 'Unknown'}</p>
                    <p><strong>Building:</strong> {relocation.building_name || 'Unknown'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Start Date</label>
                  <p className="text-sm text-gray-900">{format(new Date(relocation.start_date), 'PPP')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">End Date</label>
                  <p className="text-sm text-gray-900">{format(new Date(relocation.end_date), 'PPP')}</p>
                </div>
              </div>
              {relocation.actual_end_date && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Actual End Date</label>
                  <p className="text-sm text-gray-900">{format(new Date(relocation.actual_end_date), 'PPP')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Reason</label>
                <p className="text-sm text-gray-900">{relocation.reason}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Type</label>
                <p className="text-sm text-gray-900 capitalize">{relocation.relocation_type}</p>
              </div>
              {relocation.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Notes</label>
                  <p className="text-sm text-gray-900">{relocation.notes}</p>
                </div>
              )}
              {relocation.special_instructions && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Special Instructions</label>
                  <p className="text-sm text-gray-900">{relocation.special_instructions}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Status Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {relocation.status === 'scheduled' && (
                <Button
                  onClick={() => handleStatusUpdate('active')}
                  disabled={isUpdating}
                  className="w-full"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Start Relocation
                </Button>
              )}
              {relocation.status === 'active' && (
                <>
                  <Button
                    onClick={() => handleStatusUpdate('completed')}
                    disabled={isUpdating}
                    className="w-full"
                  >
                    Complete Relocation
                  </Button>
                  <Button
                    onClick={() => handleStatusUpdate('cancelled')}
                    disabled={isUpdating}
                    variant="destructive"
                    className="w-full"
                  >
                    Cancel Relocation
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <label className="font-medium text-gray-700">Created</label>
                <p className="text-gray-600">{format(new Date(relocation.created_at), 'PPp')}</p>
              </div>
              <div>
                <label className="font-medium text-gray-700">Last Updated</label>
                <p className="text-gray-600">{format(new Date(relocation.updated_at), 'PPp')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
