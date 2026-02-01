/**
 * AdminQuickReportDialog
 * Streamlined 4-5 tap issue reporting for admins and facility coordinators
 */

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { ModalFrame } from '@/components/common/ModalFrame';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRecentRooms, RecentRoom } from '@/hooks/useRecentRooms';
import { usePhotoUpload } from '@/components/issues/hooks/usePhotoUpload';
import { IssuePhotoGrid } from '@/components/issues/card/IssuePhotoGrid';
import { cn } from '@/lib/utils';
import {
  Search,
  Zap,
  Droplets,
  Thermometer,
  Wrench,
  Sparkles,
  AlertTriangle,
  Loader2,
  MapPin,
  Clock,
  CheckCircle,
  Camera,
} from 'lucide-react';

interface AdminQuickReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface RoomSearchResult {
  id: string;
  room_number: string;
  name: string | null;
  floor_id: string | null;
  floors: {
    id: string;
    building_id: string;
    buildings: {
      id: string;
      name: string;
    } | null;
  } | null;
}

const ISSUE_TYPES = [
  { id: 'electrical', label: 'Electrical', icon: Zap, color: 'text-yellow-500' },
  { id: 'plumbing', label: 'Plumbing', icon: Droplets, color: 'text-blue-500' },
  { id: 'hvac', label: 'HVAC', icon: Thermometer, color: 'text-cyan-500' },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench, color: 'text-orange-500' },
  { id: 'cleaning', label: 'Cleaning', icon: Sparkles, color: 'text-green-500' },
  { id: 'safety', label: 'Safety', icon: AlertTriangle, color: 'text-red-500' },
] as const;

export function AdminQuickReportDialog({ open, onOpenChange }: AdminQuickReportDialogProps) {
  const queryClient = useQueryClient();
  const { recentRooms, addRecentRoom } = useRecentRooms();
  const { uploading, selectedPhotos, setSelectedPhotos, handlePhotoUpload } = usePhotoUpload();

  // Form state
  const [selectedRoom, setSelectedRoom] = useState<RecentRoom | null>(null);
  const [selectedIssueType, setSelectedIssueType] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch all rooms for search
  const { data: allRooms = [], isLoading: roomsLoading } = useQuery({
    queryKey: ['admin-quick-report-rooms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select(`
          id,
          room_number,
          name,
          floor_id,
          floors!inner (
            id,
            building_id,
            buildings!inner (
              id,
              name
            )
          )
        `)
        .order('room_number');
      if (error) throw error;
      return (data as unknown as RoomSearchResult[]) || [];
    },
    enabled: open,
  });

  // Filter rooms based on search
  const filteredRooms = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return allRooms
      .filter((room) => {
        const roomNum = room.room_number?.toLowerCase() || '';
        const roomName = room.name?.toLowerCase() || '';
        return roomNum.includes(query) || roomName.includes(query);
      })
      .slice(0, 8);
  }, [allRooms, searchQuery]);

  const handleRoomSelect = (room: RoomSearchResult) => {
    const recentRoom: RecentRoom = {
      id: room.id,
      roomNumber: room.room_number,
      roomName: room.name,
      buildingId: room.floors?.building_id || null,
      floorId: room.floor_id,
      lastUsed: Date.now(),
    };
    setSelectedRoom(recentRoom);
    setSearchQuery('');
  };

  const handleRecentRoomSelect = (room: RecentRoom) => {
    setSelectedRoom(room);
  };

  const handleSubmit = async () => {
    if (!selectedRoom || !selectedIssueType) {
      toast.error('Please select a room and issue type');
      return;
    }

    setIsSubmitting(true);
    try {
      // Generate title from issue type and room
      const issueTypeLabel = ISSUE_TYPES.find((t) => t.id === selectedIssueType)?.label || selectedIssueType;
      const title = `${issueTypeLabel} Issue - Room ${selectedRoom.roomNumber}`;

      const { error } = await supabase.from('issues').insert({
        title,
        description: description.trim() || null,
        issue_type: selectedIssueType.toUpperCase(),
        priority: 'medium',
        status: 'open',
        room_id: selectedRoom.id,
        floor_id: selectedRoom.floorId,
        building_id: selectedRoom.buildingId,
      });

      if (error) throw error;

      // Add to recent rooms
      addRecentRoom(selectedRoom);

      // Invalidate queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['issues'] }),
        queryClient.invalidateQueries({ queryKey: ['adminIssues'] }),
        queryClient.invalidateQueries({ queryKey: ['interactive-operations'] }),
      ]);

      // Show success state briefly
      setShowSuccess(true);
      setTimeout(() => {
        resetForm();
        onOpenChange(false);
        setShowSuccess(false);
      }, 1000);

      toast.success('Issue reported successfully', {
        description: `${title}`,
      });
    } catch (error) {
      console.error('Error submitting issue:', error);
      toast.error('Failed to report issue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedRoom(null);
    setSelectedIssueType(null);
    setDescription('');
    setSearchQuery('');
    setSelectedPhotos([]);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  const canSubmit = selectedRoom && selectedIssueType && !isSubmitting && !uploading;

  // Success animation view
  if (showSuccess) {
    return (
      <ModalFrame open={open} onOpenChange={handleClose} title="Quick Report" size="md">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4 mb-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <h3 className="text-lg font-semibold">Issue Reported!</h3>
          <p className="text-muted-foreground text-sm">Closing...</p>
        </div>
      </ModalFrame>
    );
  }

  return (
    <ModalFrame
      open={open}
      onOpenChange={handleClose}
      title="Quick Report"
      description="Report an issue in 4-5 taps"
      size="lg"
    >
      <div className="space-y-6">
        {/* Selected Room Display */}
        {selectedRoom && (
          <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-medium">{selectedRoom.roomNumber}</span>
              {selectedRoom.roomName && (
                <span className="text-muted-foreground">- {selectedRoom.roomName}</span>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedRoom(null)}>
              Change
            </Button>
          </div>
        )}

        {/* Room Selection */}
        {!selectedRoom && (
          <div className="space-y-4">
            {/* Recent Rooms */}
            {recentRooms.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Recent Rooms</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentRooms.map((room) => (
                    <Button
                      key={room.id}
                      variant="outline"
                      size="sm"
                      className="h-auto py-2 px-3"
                      onClick={() => handleRecentRoomSelect(room)}
                    >
                      <div className="text-left">
                        <div className="font-medium">{room.roomNumber}</div>
                        {room.roomName && (
                          <div className="text-xs text-muted-foreground truncate max-w-[100px]">
                            {room.roomName}
                          </div>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Room Search */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search room number or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>

              {/* Search Results */}
              {searchQuery && (
                <ScrollArea className="h-[200px] border rounded-lg">
                  {roomsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredRooms.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground text-sm">
                      No rooms found for "{searchQuery}"
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {filteredRooms.map((room) => (
                        <button
                          key={room.id}
                          onClick={() => handleRoomSelect(room)}
                          className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors"
                        >
                          <div className="font-medium">{room.room_number}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            {room.name && <span>{room.name}</span>}
                            {room.floors?.buildings?.name && (
                              <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                {room.floors.buildings.name}
                              </Badge>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              )}
            </div>
          </div>
        )}

        {/* Issue Type Selection */}
        {selectedRoom && (
          <div className="space-y-3">
            <label className="text-sm font-medium">Issue Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ISSUE_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedIssueType === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => setSelectedIssueType(type.id)}
                    className={cn(
                      'flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all',
                      'hover:border-primary/50 hover:bg-accent/50',
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-background'
                    )}
                  >
                    <Icon className={cn('h-6 w-6', type.color)} />
                    <span className="text-sm font-medium">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Photo Upload - Only show after room and type selected */}
        {selectedRoom && selectedIssueType && (
          <div className="space-y-3">
            <label className="text-sm font-medium">Add Photos</label>
            <div className="flex flex-col items-center justify-center w-full">
              <label className="w-full cursor-pointer">
                <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg border-border bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col items-center justify-center py-4">
                    {uploading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    ) : (
                      <>
                        <Camera className="w-6 h-6 mb-2 text-primary" />
                        <p className="text-sm text-muted-foreground">
                          Tap to take photo or upload
                        </p>
                      </>
                    )}
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </div>
              </label>
            </div>
            <IssuePhotoGrid photos={selectedPhotos} />
          </div>
        )}

        {/* Description */}
        {selectedRoom && selectedIssueType && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Description (optional)</label>
            <Textarea
              placeholder="Quick notes about the issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        )}

        {/* Submit Button */}
        {selectedRoom && selectedIssueType && (
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full h-12 text-base"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Report'
            )}
          </Button>
        )}
      </div>
    </ModalFrame>
  );
}
