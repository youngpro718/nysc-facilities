
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
import { useAuth } from "@features/auth/hooks/useAuth";
import { SIMPLE_CATEGORIES, SimpleCategory, getBackendIssueType } from "./constants/simpleCategories";
import { PhotoCapture } from "@shared/components/common/common/PhotoCapture";
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
  const [roomSelectedViaSearch, setRoomSelectedViaSearch] = useState(false);

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

  // Live room search — enabled when browsing outside assigned rooms
  const showSearchUI = !hasAssignedRooms || continueWithoutRoom || roomSelectedViaSearch;

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
    enabled: showSearchUI || roomSelectedViaSearch,
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
    setRoomSelectedViaSearch(true);
    setContinueWithoutRoom(false);
    setLocationDescription('');
  };

  const clearSearchedRoom = () => {
    setSelectedRoomId(null);
    setSelectedRoomBuildingId(null);
    setSelectedRoomFloorId(null);
    setRoomSelectedViaSearch(false);
    setRoomSearchQuery('');
    setContinueWithoutRoom(true);
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

      // Auto-generate descriptive title
      const roomLabel = selectedSearchedRoom
        ? `Room ${selectedSearchedRoom.room_number}`
        : selectedRoom
          ? `Room ${getRoomNumber(selectedRoom)}`
          : null;
      const categoryLabel = selectedCategoryData?.label || issueType;
      const autoTitle = roomLabel
        ? `${categoryLabel} Issue - ${roomLabel}`
        : `${categoryLabel} Issue`;

      const { error } = await supabase
        .from('issues')
        .insert({
          title: autoTitle,
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

  // Progress tracking
  const hasCategory = !!selectedCategory;
  const hasLocation = !!(selectedRoomId || (continueWithoutRoom && locationDescription.trim()));
  const hasDescription = !!description.trim();
  const completedSteps = [hasCategory, hasLocation, hasDescription].filter(Boolean).length;

  return (
    <div className="w-full max-w-lg mx-auto pb-28">
      {/* Header with progress */}
      <div className="text-center space-y-3 mb-6">
        <h2 className="text-xl font-bold tracking-tight">Report an Issue</h2>
        <div className="flex items-center justify-center gap-1.5">
          {[0, 1, 2].map(i => (
            <div key={i} className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i < completedSteps ? "w-8 bg-primary" : "w-4 bg-muted-foreground/20"
            )} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{completedSteps}/3 required fields</p>
      </div>

      {/* 1. Category — visual grid cards */}
      <section className="mb-6">
        <SectionHeader step={1} label="What's the issue?" done={hasCategory} />
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {SIMPLE_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                  "touch-manipulation active:scale-[0.97] min-h-[90px]",
                  active
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border bg-card hover:border-primary/40 hover:bg-accent/30"
                )}
              >
                <div className={cn(
                  "p-2.5 rounded-lg transition-colors",
                  active ? "bg-primary/10" : "bg-muted/50"
                )}>
                  <Icon className={cn("h-5 w-5", cat.color)} />
                </div>
                <div className="text-center">
                  <p className={cn("text-sm font-medium leading-tight", active && "text-primary")}>{cat.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{cat.description}</p>
                </div>
                {active && <Check className="h-3.5 w-3.5 text-primary absolute top-2 right-2" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Location — card-based */}
      <section className="mb-6">
        <SectionHeader step={2} label="Where is it?" done={hasLocation} />

        {isLoadingRooms ? (
          <Skeleton className="h-14 w-full rounded-xl" />
        ) : roomSelectedViaSearch && selectedSearchedRoom ? (
          /* Room selected via live search — show confirmation card */
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-primary bg-primary/5">
              <div className="p-2 rounded-lg bg-primary/10">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary">Room {selectedSearchedRoom.room_number}</p>
                <p className="text-xs text-muted-foreground">
                  {[selectedSearchedRoom.name, selectedSearchedRoom.floors?.buildings?.name].filter(Boolean).join(' · ')}
                </p>
              </div>
              <Button type="button" variant="ghost" size="sm" className="text-xs shrink-0 h-7" onClick={clearSearchedRoom}>
                Change
              </Button>
            </div>
            {hasAssignedRooms && (
              <button type="button"
                className="text-xs text-primary hover:underline touch-manipulation px-1"
                onClick={() => {
                  setRoomSelectedViaSearch(false);
                  setContinueWithoutRoom(false);
                  setRoomSearchQuery('');
                  setLocationDescription('');
                  const primary = assignedRooms?.find(r => r.is_primary)
                    || assignedRooms?.find(r => r.assignment_type === 'primary_office')
                    || assignedRooms?.[0];
                  if (primary) setSelectedRoomId(getRoomId(primary));
                }}>
                ← Use my assigned room
              </button>
            )}
          </div>
        ) : hasAssignedRooms && !continueWithoutRoom && !roomSelectedViaSearch ? (
          <div className="space-y-2.5">
            {/* Assigned rooms as tappable cards */}
            <div className="grid grid-cols-1 gap-2">
              {assignedRooms!.map((room) => {
                const rid = getRoomId(room);
                const active = selectedRoomId === rid;
                return (
                  <button
                    key={rid}
                    type="button"
                    onClick={() => { setSelectedRoomId(rid); setRoomSelectedViaSearch(false); setShowRoomPicker(false); }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
                      "touch-manipulation active:scale-[0.99]",
                      active
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/40"
                    )}
                  >
                    <div className={cn("p-2 rounded-lg", active ? "bg-primary/10" : "bg-muted/50")}>
                      <MapPin className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-medium", active && "text-primary")}>Room {getRoomNumber(room)}</p>
                      {room.building_name && <p className="text-xs text-muted-foreground">{room.building_name}</p>}
                    </div>
                    {active && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => { setContinueWithoutRoom(true); setSelectedRoomId(null); setRoomSelectedViaSearch(false); }}
              className="text-xs text-muted-foreground hover:text-primary transition-colors touch-manipulation px-1"
            >
              Not listed? Search or describe a different location →
            </button>
          </div>
        ) : (
          /* Live room search */
          <div className="space-y-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Type a room number…"
                value={roomSearchQuery}
                onChange={(e) => setRoomSearchQuery(e.target.value)}
                className="pl-10 min-h-[48px] rounded-xl"
                autoFocus
              />
            </div>

            {roomSearchQuery.trim() && (
              <div className="border rounded-xl overflow-hidden">
                <ScrollArea className="max-h-[200px]">
                  {roomsSearchLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredRooms.length === 0 ? (
                    <div className="py-6 px-4 text-center space-y-3">
                      <p className="text-sm text-muted-foreground">No rooms match "{roomSearchQuery}"</p>
                      <Button type="button" size="sm" variant="outline" className="rounded-lg"
                        onClick={() => { setRoomSearchQuery(''); setContinueWithoutRoom(true); }}>
                        Describe location instead
                      </Button>
                    </div>
                  ) : (
                    <div className="p-1.5">
                      {filteredRooms.map((room) => (
                        <button
                          key={room.id}
                          type="button"
                          onClick={() => handleSearchedRoomSelect(room)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors touch-manipulation text-left"
                        >
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <div>
                            <span className="font-medium text-sm">{room.room_number}</span>
                            {room.name && <span className="text-xs text-muted-foreground ml-2">{room.name}</span>}
                            {room.floors?.buildings?.name && (
                              <span className="text-xs text-muted-foreground ml-1">· {room.floors.buildings.name}</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}

            {continueWithoutRoom && !roomSearchQuery.trim() && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Or describe the location:</p>
                <Input
                  placeholder="e.g., 5th floor hallway near elevator"
                  value={locationDescription}
                  onChange={(e) => setLocationDescription(e.target.value)}
                  className="min-h-[48px] rounded-xl"
                />
              </div>
            )}

            {!continueWithoutRoom && !roomSearchQuery.trim() && (
              <button type="button"
                className="text-xs text-muted-foreground hover:text-primary transition-colors touch-manipulation px-1"
                onClick={() => setContinueWithoutRoom(true)}>
                Can't find it? Describe the location instead →
              </button>
            )}

            {hasAssignedRooms && (
              <button type="button"
                className="text-xs text-primary hover:underline touch-manipulation px-1"
                onClick={() => {
                  setRoomSelectedViaSearch(false);
                  setContinueWithoutRoom(false);
                  setRoomSearchQuery('');
                  setLocationDescription('');
                  const primary = assignedRooms?.find(r => r.is_primary)
                    || assignedRooms?.find(r => r.assignment_type === 'primary_office')
                    || assignedRooms?.[0];
                  if (primary) setSelectedRoomId(getRoomId(primary));
                }}>
                ← Use my assigned room
              </button>
            )}
          </div>
        )}
      </section>

      {/* 3. Description with mic */}
      <section className="mb-6">
        <SectionHeader step={3} label="Describe the problem" done={hasDescription} />
        <div className="relative">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What happened? When did you notice it?"
            className="min-h-[120px] pr-14 rounded-xl resize-none"
          />
          <Button
            type="button"
            variant={isRecording ? "destructive" : "secondary"}
            size="icon"
            className="absolute right-2 top-2 h-10 w-10 rounded-lg"
            onClick={isRecording ? stopDictation : startDictation}
          >
            {isRecording ? (
              <MicOff className="h-4 w-4 animate-pulse" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
          {isRecording && (
            <p className="text-xs text-destructive mt-1 animate-pulse">Listening… tap to stop</p>
          )}
        </div>
      </section>

      {/* 4. Photos — optional, after description */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Photos</span>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Optional</Badge>
        </div>
        <PhotoCapture
          bucket="issue-photos"
          photos={selectedPhotos}
          onPhotosChange={setSelectedPhotos}
          maxPhotos={5}
        />
      </section>

      {/* Sticky submit bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-border z-50">
        <div className="max-w-lg mx-auto space-y-2">
          {/* Mini status */}
          {!canSubmit && (
            <div className="flex items-center gap-2 justify-center">
              <AlertCircle className="h-3 w-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                {!hasCategory ? 'Select an issue type' : !hasLocation ? 'Choose a location' : 'Add a description'}
              </p>
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onCancel} className="min-h-[48px] px-6">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || createIssueMutation.isPending}
              className="flex-1 min-h-[48px] text-[15px] font-semibold rounded-xl"
            >
              {createIssueMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting…</>
              ) : (
                'Submit Report'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ step, label, done }: { step: number; label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2.5 mb-2.5">
      <div className={cn(
        "h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors shrink-0",
        done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      )}>
        {done ? <Check className="h-3.5 w-3.5" /> : step}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
