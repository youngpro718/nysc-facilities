// @ts-nocheck
/**
 * RoomDetailPanel Component (Feature-based)
 * 
 * Enhanced room detail panel using new architecture patterns:
 * - Uses feature hooks (useRoom)
 * - Integrates operations hooks (useRoomStatusUpdate)
 * - Includes AuditTrail component
 * - RBAC-aware status updates
 * 
 * @module features/facilities/components/RoomDetailPanel
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  Users, 
  AlertTriangle, 
  Calendar,
  Edit,
  Trash2,
  Info,
  Building,
  Layers,
  Home,
  Activity,
  History
} from 'lucide-react';
import { useRoom } from '../hooks/useFacilities';
import { DataState } from '@/ui/DataState';
import { AuditTrail } from '@/components/operations/AuditTrail';
import { RoomStatusActions } from '@/components/operations/RoomStatusActions';
import type { Room } from '../model';

interface RoomDetailPanelProps {
  roomId: string | null;
  onEdit?: (room: Room) => void;
  onDelete?: (roomId: string) => void;
}

export function RoomDetailPanel({ roomId, onEdit, onDelete }: RoomDetailPanelProps) {
  const { data: room, isLoading, error } = useRoom(roomId || '');

  // Show empty state if no room selected
  if (!roomId) {
    return (
      <Card className="h-full flex items-center justify-center">
        <CardContent className="text-center">
          <Home className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Room Selected</h3>
          <p className="text-muted-foreground">
            Select a room from the list to view detailed information
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'default';
      case 'occupied':
        return 'secondary';
      case 'maintenance':
        return 'destructive';
      case 'reserved':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <Activity className="h-3 w-3" />;
      case 'maintenance':
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return <Info className="h-3 w-3" />;
    }
  };

  return (
    <DataState
      data={room}
      isLoading={isLoading}
      error={error}
      emptyState={{
        title: 'Room not found',
        description: 'The selected room could not be loaded.',
      }}
    >
      {(roomData) => (
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-2xl">{roomData.room_number}</CardTitle>
                  <Badge variant={getStatusColor(roomData.status)} className="flex items-center gap-1">
                    {getStatusIcon(roomData.status)}
                    {roomData.status.replace('_', ' ')}
                  </Badge>
                </div>
                <h3 className="text-lg text-muted-foreground">{roomData.name || 'Unnamed Room'}</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    {roomData.floor?.building?.name || 'Unknown Building'}
                  </div>
                  <div className="flex items-center gap-1">
                    <Layers className="h-4 w-4" />
                    {roomData.floor?.name || 'Unknown Floor'}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(roomData)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(roomData.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="operations">Operations</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              {/* Details Tab */}
              <TabsContent value="details" className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Type</h4>
                    <Badge variant="outline" className="w-fit">
                      {roomData.room_type || 'Unspecified'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Capacity</h4>
                    <div className="flex items-center gap-1 text-sm">
                      <Users className="h-4 w-4" />
                      {roomData.capacity || 'Not specified'}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Location</h4>
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="h-4 w-4" />
                      Floor {roomData.floor?.floor_number || '?'}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Statistics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{roomData.current_occupants?.length || 0}</div>
                    <div className="text-sm text-muted-foreground">Occupants</div>
                  </div>
                  
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{roomData.issues?.length || 0}</div>
                    <div className="text-sm text-muted-foreground">Issues</div>
                  </div>
                  
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{roomData.capacity || 0}</div>
                    <div className="text-sm text-muted-foreground">Capacity</div>
                  </div>
                  
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold">{roomData.room_history?.length || 0}</div>
                    <div className="text-sm text-muted-foreground">History</div>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Recent Issues */}
                  {roomData.issues && roomData.issues.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Recent Issues
                      </h4>
                      <div className="space-y-2">
                        {roomData.issues.slice(0, 3).map((issue: Record<string, unknown>) => (
                          <div key={issue.id} className="p-3 bg-muted/50 rounded-lg">
                            <div className="font-medium text-sm">{issue.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {issue.status} • {new Date(issue.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Current Occupants */}
                  {roomData.current_occupants && roomData.current_occupants.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Current Occupants
                      </h4>
                      <div className="space-y-2">
                        {roomData.current_occupants.slice(0, 3).map((occupant: Record<string, unknown>, index: number) => (
                          <div key={occupant.id || index} className="p-3 bg-muted/50 rounded-lg">
                            <div className="font-medium text-sm">{occupant.personnel_name || 'Unknown'}</div>
                            <div className="text-xs text-muted-foreground">
                              {occupant.role || 'Unknown role'} • {occupant.department || 'Unknown dept'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {roomData.notes && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Notes</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {roomData.notes}
                    </p>
                  </div>
                )}

                {/* Timestamps */}
                <div className="pt-4 border-t text-xs text-muted-foreground flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Created: {new Date(roomData.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Updated: {new Date(roomData.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </TabsContent>

              {/* Operations Tab */}
              <TabsContent value="operations" className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Status Management</h3>
                    <RoomStatusActions 
                      roomId={roomData.id} 
                      currentStatus={roomData.status}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Current Status</h4>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(roomData.status)}
                          <span className="font-medium capitalize">
                            {roomData.status.replace('_', ' ')}
                          </span>
                        </div>
                        <Badge variant={getStatusColor(roomData.status)}>
                          Active
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Last updated: {new Date(roomData.updated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="space-y-6">
                <AuditTrail 
                  tableName="rooms" 
                  recordId={roomData.id}
                  limit={50}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </DataState>
  );
}
