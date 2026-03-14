
import React, { useState, useEffect, useMemo } from 'react';
import { logger } from '@/lib/logger';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, MapPin, Mic, MicOff, Check, AlertCircle, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { SIMPLE_CATEGORIES, SimpleCategory, getBackendIssueType } from "./constants/simpleCategories";
import { PhotoCapture } from "@/components/common/PhotoCapture";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RoomSearchResult {
  id: string;
  room_number: string;
  name: string | null;
  floor_id: string | null;
  floors: {
    id: string;
    building_id: string;
    buildings: { id: string; name: string } | null;
  } | null;
}

interface RoomAssignment {
  id?: string;
  room_id?: string;
  room_name?: string;
  room_number?: string;
  building_id?: string;
  building_name?: string;
  floor_id?: string;
  floor_name?: string;
  is_primary?: boolean;
  assignment_type?: string;
}

export interface SimpleReportWizardProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  assignedRooms?: RoomAssignment[];
  isLoadingRooms?: boolean;
}

export function SimpleReportWizard({ onSuccess, onCancel, assignedRooms, isLoadingRooms }: SimpleReportWizardProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [continueWithoutRoom, setContinueWithoutRoom] = useState(false);
  const [locationDescription, setLocationDescription] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [showRoomPicker, setShowRoomPicker] = useState(false);
  const [roomSearchQuery, setRoomSearchQuery] = useState('');
  const [selectedRoomBuildingId, setSelectedRoomBuildingId] = useState<string | null>(null);
  const [selectedRoomFloorId, setSelectedRoomFloorId] = useState<string | null>(null);

  // Voice dictation
  const [isRecording, setIsRecording] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recognition, setRecognition] = useState<any>(null);

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const hasAssignedRooms = assignedRooms && assignedRooms.length > 0;

  const getRoomId = (room: RoomAssignment): string => room.room_id || room.id || '';
  const getRoomNumber = (room: RoomAssignment): string => room.room_number || room.room_name || 'Unknown';

  // Auto-select primary room
  useEffect(() => {
    if (hasAssignedRooms) {
      const primary = assignedRooms.find(r => r.is_primary)
        || assignedRooms.find(r => r.assignment_type === 'primary_office')
        || assignedRooms[0];
      if (primary) setSelectedRoomId(getRoomId(primary));
    }
  }, [assignedRooms, hasAssignedRooms]);

  const selectedRoom = assignedRooms?.find(r => getRoomId(r) === selectedRoomId);
  const selectedCategoryData = SIMPLE_CATEGORIES.find(c => c.id === selectedCategory);

  // Live room search — enabled when not using assigned rooms
  const showSearchUI = !hasAssignedRooms || continueWithoutRoom;

  const { data: allRoomsForSearch = [], isLoading: roomsSearchLoading } = useQuery({
    queryKey: ['admin-quick-report-unified-spaces'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('unified_spaces')
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
        .eq('space_type', 'room')
        .order('room_number');
      if (error) throw error;
      return (data as unknown as RoomSearchResult[]) || [];
    },
    enabled: showSearchUI,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const filteredRooms = useMemo(() => {
    if (!roomSearchQuery.trim()) return [];
    const q = roomSearchQuery.toLowerCase();
    return allRoomsForSearch
      .filter(r => {
        const num = (r.room_number || '').toLowerCase();
        const name = (r.name || '').toLowerCase();
        return num.includes(q) || name.includes(q);
      })
      .slice(0, 8);
  }, [allRoomsForSearch, roomSearchQuery]);

  const handleSearchedRoomSelect = (room: RoomSearchResult) => {
    setSelectedRoomId(room.id);
    setSelectedRoomBuildingId(room.floors?.building_id || null);
    setSelectedRoomFloorId(room.floor_id);
    setRoomSearchQuery('');
    setContinueWithoutRoom(false);
    setLocationDescription('');
  };

  const clearSearchedRoom = () => {
    setSelectedRoomId(null);
    setSelectedRoomBuildingId(null);
    setSelectedRoomFloorId(null);
    setRoomSearchQuery('');
  };

  // Display name for a room selected via live search
  const selectedSearchedRoom = selectedRoomId && showSearchUI
    ? allRoomsForSearch.find(r => r.id === selectedRoomId)
    : null;

  const createIssueMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      if (!selectedCategory) throw new Error('No category selected');
      if (!description.trim()) throw new Error('Description required');

      const issueType = getBackendIssueType(selectedCategory);

      const { error } = await supabase
        .from('issues')
        .insert({
          title: `${selectedCategoryData?.label || issueType} Issue`,
          description: description.trim(),
          issue_type: issueType,
          priority: 'medium',
          status: 'open',
          building_id: selectedRoomBuildingId || selectedRoom?.building_id || null,
          floor_id: selectedRoomFloorId || selectedRoom?.floor_id || null,
          room_id: selectedRoomId || null,
          location_description: !selectedRoomId && continueWithoutRoom ? locationDescription.trim() : null,
          photos: selectedPhotos,
          seen: false,
          created_by: user.id,
          reported_by: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Issue reported successfully");
      queryClient.invalidateQueries({ queryKey: ['userIssues'] });
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['court-issues'] });
      queryClient.invalidateQueries({ queryKey: ['building-level-issues'] });
      queryClient.invalidateQueries({ queryKey: ['adminIssues'] });
      onSuccess?.();
    },
    onError: (error: unknown) => {
      logger.error('Error creating issue:', error);
      toast.error((error as Error).message || "Failed to report issue");
    }
  });

  // Voice dictation
  const startDictation = async () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast.error("Speech recognition not supported");
      return;
    }
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';
      rec.onstart = () => { setIsRecording(true); toast.success("Listening..."); };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rec.onresult = (event: any) => {
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) final += event.results[i][0].transcript;
        }
        if (final) setDescription(prev => (prev + ' ' + final).trim());
      };
      rec.onerror = () => { setIsRecording(false); toast.error("Microphone error"); };
      rec.onend = () => setIsRecording(false);
      setRecognition(rec);
      rec.start();
    } catch { toast.error("Microphone access denied"); }
  };

  const stopDictation = () => { recognition?.stop(); setIsRecording(false); };

  const handleSubmit = () => {
    if (!selectedCategory) { toast.error("Please select an issue type"); return; }
    if (!selectedRoomId && !continueWithoutRoom) { toast.error("Please select a room"); return; }
    if (continueWithoutRoom && !locationDescription.trim()) { toast.error("Please describe the location"); return; }
    if (!description.trim()) { toast.error("Please describe the issue"); return; }
    createIssueMutation.mutate();
  };

  const canSubmit = selectedCategory
    && (selectedRoomId || (continueWithoutRoom && locationDescription.trim()))
    && description.trim();

  return (
    <div className="w-full max-w-lg mx-auto space-y-5 pb-24">
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold">Report an Issue</h2>
        <p className="text-sm text-muted-foreground">Fill in any order, then submit</p>
      </div>

      {/* 1. Photo Capture — camera-first */}
      <section className="space-y-2">
        <Label className="text-sm font-medium">Photos <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <PhotoCapture
          bucket="issue-photos"
          photos={selectedPhotos}
          onPhotosChange={setSelectedPhotos}
          maxPhotos={5}
        />
      </section>

      {/* 2. Category chips — horizontal scroll */}
      <section className="space-y-2">
        <Label className="text-sm font-medium">What's the issue?</Label>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {SIMPLE_CATEGORIES.map((cat) => (
            <CategoryChip
              key={cat.id}
              category={cat}
              selected={selectedCategory === cat.id}
              onSelect={() => setSelectedCategory(cat.id)}
            />
          ))}
        </div>
      </section>

      {/* 3. Room — compact badge or picker */}
      <section className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Location
        </Label>

        {isLoadingRooms ? (
          <Skeleton className="h-10 w-full rounded-lg" />
        ) : hasAssignedRooms && !continueWithoutRoom ? (
          <div className="space-y-2">
            {/* Show selected room as badge, tap to change */}
            {selectedRoom ? (
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="secondary"
                  className="gap-1.5 py-1.5 px-3 text-sm cursor-pointer hover:bg-secondary/80 touch-manipulation"
                  onClick={() => setShowRoomPicker(!showRoomPicker)}
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Room {getRoomNumber(selectedRoom)}
                  {selectedRoom.building_name && (
                    <span className="text-muted-foreground">· {selectedRoom.building_name}</span>
                  )}
                </Badge>
                {assignedRooms!.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setShowRoomPicker(!showRoomPicker)}
                    className="text-xs text-primary underline touch-manipulation"
                  >
                    Change
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { setContinueWithoutRoom(true); setSelectedRoomId(null); }}
                  className="text-xs text-muted-foreground underline touch-manipulation"
                >
                  Different location
                </button>
              </div>
            ) : null}

            {/* Expandable room list */}
            {showRoomPicker && (
              <div className="flex gap-2 flex-wrap">
                {assignedRooms!.map((room) => {
                  const rid = getRoomId(room);
                  return (
                    <Badge
                      key={rid}
                      variant={selectedRoomId === rid ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer py-1.5 px-3 touch-manipulation active:scale-[0.97] min-h-[44px] flex items-center",
                        selectedRoomId === rid && "ring-2 ring-primary ring-offset-1"
                      )}
                      onClick={() => { setSelectedRoomId(rid); setShowRoomPicker(false); }}
                    >
                      {getRoomNumber(room)}
                      {selectedRoomId === rid && <Check className="h-3.5 w-3.5 ml-1" />}
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>
        ) : selectedSearchedRoom && !continueWithoutRoom ? (
          /* Room selected via live search — show badge */
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="secondary"
              className="gap-1.5 py-1.5 px-3 text-sm"
            >
              <MapPin className="h-3.5 w-3.5" />
              Room {selectedSearchedRoom.room_number}
              {selectedSearchedRoom.name && (
                <span className="text-muted-foreground">· {selectedSearchedRoom.name}</span>
              )}
              {selectedSearchedRoom.floors?.buildings?.name && (
                <span className="text-muted-foreground">· {selectedSearchedRoom.floors.buildings.name}</span>
              )}
            </Badge>
            <button
              type="button"
              onClick={clearSearchedRoom}
              className="text-xs text-primary underline touch-manipulation"
            >
              Change
            </button>
            <button
              type="button"
              onClick={() => { clearSearchedRoom(); setContinueWithoutRoom(true); }}
              className="text-xs text-muted-foreground underline touch-manipulation"
            >
              Different location
            </button>
          </div>
        ) : (
          /* Live room search UI (no assigned rooms, or 'Different location' clicked) */
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search room number or name…"
                value={roomSearchQuery}
                onChange={(e) => setRoomSearchQuery(e.target.value)}
                className="pl-10 min-h-[44px]"
                autoFocus
              />
            </div>

            {/* Search results */}
            {roomSearchQuery.trim() && (
              <ScrollArea className="h-[180px] border rounded-lg">
                {roomsSearchLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredRooms.length === 0 ? (
                  <div className="py-6 px-4 text-center space-y-3">
                    <AlertCircle className="h-5 w-5 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No room found for &ldquo;{roomSearchQuery}&rdquo;
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="min-h-[40px]"
                      onClick={() => { setRoomSearchQuery(''); setContinueWithoutRoom(true); }}
                    >
                      Describe location instead
                    </Button>
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {filteredRooms.map((room) => (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => handleSearchedRoomSelect(room)}
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors touch-manipulation"
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

            {/* Free-text fallback — shown when user can't find the room */}
            {continueWithoutRoom && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Describe the location:</p>
                <Input
                  placeholder="e.g., 5th floor hallway near elevator"
                  value={locationDescription}
                  onChange={(e) => setLocationDescription(e.target.value)}
                  className="min-h-[44px]"
                />
                <button
                  type="button"
                  className="text-xs text-primary underline touch-manipulation"
                  onClick={() => setContinueWithoutRoom(false)}
                >
                  Search room instead
                </button>
              </div>
            )}

            {/* Back to assigned rooms (for users who clicked 'Different location') */}
            {hasAssignedRooms && (
              <button
                type="button"
                className="text-xs text-primary underline touch-manipulation"
                onClick={() => {
                  setContinueWithoutRoom(false);
                  setRoomSearchQuery('');
                  setLocationDescription('');
                  const primary = assignedRooms?.find(r => r.is_primary)
                    || assignedRooms?.find(r => r.assignment_type === 'primary_office')
                    || assignedRooms?.[0];
                  if (primary) setSelectedRoomId(getRoomId(primary));
                }}
              >
                Use my assigned room
              </button>
            )}
          </div>
        )}
      </section>

      {/* 4. Description with mic */}
      <section className="space-y-2">
        <Label className="text-sm font-medium">Describe the issue</Label>
        <div className="relative">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's the problem? Tap the mic to dictate…"
            className="min-h-[100px] pr-12"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 min-h-[44px] min-w-[44px]"
            onClick={isRecording ? stopDictation : startDictation}
          >
            {isRecording ? (
              <MicOff className="h-5 w-5 text-destructive animate-pulse" />
            ) : (
              <Mic className="h-5 w-5 text-muted-foreground" />
            )}
          </Button>
        </div>
      </section>

      {/* Sticky submit bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border z-50">
        <div className="max-w-lg mx-auto flex gap-3">
          <Button variant="outline" onClick={onCancel} className="flex-1 min-h-[48px]">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || createIssueMutation.isPending}
            className="flex-1 min-h-[48px] text-base"
          >
            {createIssueMutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting…</>
            ) : (
              'Submit'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function CategoryChip({ category, selected, onSelect }: { category: SimpleCategory; selected: boolean; onSelect: () => void }) {
  const Icon = category.icon;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium border transition-all",
        "min-h-[44px] touch-manipulation active:scale-[0.97]",
        selected
          ? "border-primary bg-primary/10 text-primary ring-2 ring-primary ring-offset-1"
          : "border-border bg-background hover:border-primary/50 hover:bg-primary/5"
      )}
    >
      <Icon className={cn("h-4 w-4", category.color)} />
      {category.label}
    </button>
  );
}
