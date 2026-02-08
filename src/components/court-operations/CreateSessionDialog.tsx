import { useState, useEffect, useRef } from 'react';
import { logger } from '@/lib/logger';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import { DatePicker } from '@/components/ui/date-picker';
import { Loader2, Users, CheckCircle, AlertCircle, UserX, Calendar as CalendarIcon, ChevronsUpDown, Check } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCreateCourtSession } from '@/hooks/useCourtSessions';
import { useAbsentStaffNames } from '@/hooks/useStaffAbsences';
import { SessionPeriod, BuildingCode } from '@/types/courtSessions';
import { SESSION_STATUSES } from '@/constants/sessionStatuses';

interface CreateSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  period: SessionPeriod;
  buildingCode: BuildingCode;
}

export function CreateSessionDialog({ 
  open, 
  onOpenChange, 
  date, 
  period, 
  buildingCode: initialBuildingCode 
}: CreateSessionDialogProps) {
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingCode>(initialBuildingCode);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [status, setStatus] = useState('OUT');
  const [customStatus, setCustomStatus] = useState('');
  const [statusDetail, setStatusDetail] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState<Record<string, unknown> | null>(null);
  const [roomSearch, setRoomSearch] = useState('');
  const [statusSearch, setStatusSearch] = useState('');
  const [showCustomStatus, setShowCustomStatus] = useState(false);
  const [partSearch, setPartSearch] = useState('');
  const [partDropdownOpen, setPartDropdownOpen] = useState(false);
  const [statusDetailDateOpen, setStatusDetailDateOpen] = useState(false);
  const [notesDateOpen, setNotesDateOpen] = useState(false);
  
  // New calendar fields
  const [partsEnteredBy, setPartsEnteredBy] = useState('');
  const [defendants, setDefendants] = useState('');
  const [purpose, setPurpose] = useState('');
  const [dateTranStart, setDateTranStart] = useState<Date | undefined>(undefined);
  const [topCharge, setTopCharge] = useState('');
  const [attorney, setAttorney] = useState('');

  const createSession = useCreateCourtSession();
  const dateStr = format(date, 'yyyy-MM-dd');
  
  // Ref for auto-focusing the first field after save
  const defendantsInputRef = useRef<HTMLInputElement>(null);
  
  // Get absent staff for this date
  const { absentStaffMap } = useAbsentStaffNames(date);

  // Fetch all rooms from both buildings categorized by availability
  const { data: availableRooms, isLoading: partsLoading } = useQuery({
    queryKey: ['available-courtrooms', dateStr],
    queryFn: async () => {
      // Get all court rooms from both buildings
      const { data: rooms, error: roomsError } = await supabase
        .from('court_rooms')
        .select(`
          id,
          room_number,
          courtroom_number,
          room_id,
          rooms!inner(
            floor_id,
            floors!inner(
              building_id,
              buildings!inner(
                name
              )
            )
          )
        `)
        .eq('is_active', true)
        .order('room_number');
      
      if (roomsError) throw roomsError;

      // Get all court assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('court_assignments')
        .select('room_id, justice, part');
      
      if (assignmentsError) throw assignmentsError;

      // Create a map of room_id to assignment
      const assignmentMap = new Map(
        assignments?.map(a => [a.room_id, a]) || []
      );

      // Categorize rooms into 3 groups
      const emptyRooms: Array<{ room_number: string; part?: string; judge?: string }> = [];
      const absentJudgeRooms: Array<{ room_number: string; part?: string; judge: string }> = [];
      const presentJudgeRooms: Array<{ room_number: string; part: string; judge: string }> = [];
      
      rooms?.forEach(room => {
        const assignment = assignmentMap.get(room.room_id);
        
        if (!assignment || !assignment.justice || assignment.justice.trim() === '') {
          // Empty room (no assignment or no judge)
          emptyRooms.push({
            room_number: room.room_number,
            part: assignment?.part
          });
        } else {
          // Room has a judge - check if absent
          const judgeKey = assignment.justice.toLowerCase();
          if (absentStaffMap.has(judgeKey)) {
            absentJudgeRooms.push({
              room_number: room.room_number,
              part: assignment.part,
              judge: assignment.justice
            });
          } else {
            // Judge is present - may have capacity
            presentJudgeRooms.push({
              room_number: room.room_number,
              part: assignment.part,
              judge: assignment.justice
            });
          }
        }
      });
      
      // Sort all groups by room number
      const sortByRoomNumber = (a: Record<string, unknown>, b: Record<string, unknown>) => {
        const numA = parseInt(a.room_number);
        const numB = parseInt(b.room_number);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.room_number.localeCompare(b.room_number);
      };
      
      return {
        empty: emptyRooms.sort(sortByRoomNumber),
        absent: absentJudgeRooms.sort(sortByRoomNumber),
        present: presentJudgeRooms.sort(sortByRoomNumber),
        all: [...emptyRooms, ...absentJudgeRooms, ...presentJudgeRooms]
      };
    },
    enabled: absentStaffMap.size >= 0,
  });

  // Fetch court rooms with assignments for selected building
  const { data: roomsWithAssignments, isLoading: roomsLoading } = useQuery({
    queryKey: ['court-rooms-with-assignments', selectedBuilding],
    queryFn: async () => {
      // Get building ID for selected building code
      const buildingName = selectedBuilding === '100' ? '100 Centre Street Supreme Court' : '111 Centre Street Supreme Court';
      
      const { data: building, error: buildingError } = await supabase
        .from('buildings')
        .select('id')
        .eq('name', buildingName)
        .single();
      
      if (buildingError) throw buildingError;

      // Get court rooms for this building through rooms → floors → buildings join
      const { data: rooms, error: roomsError } = await supabase
        .from('court_rooms')
        .select(`
          id, 
          room_number, 
          courtroom_number, 
          room_id,
          rooms!inner(
            floor_id,
            floors!inner(
              building_id
            )
          )
        `)
        .eq('is_active', true)
        .eq('rooms.floors.building_id', building.id)
        .order('room_number');
      
      if (roomsError) throw roomsError;

      // Get court assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('court_assignments')
        .select('room_id, justice, part, clerks, sergeant, calendar_day')
        .not('justice', 'is', null);
      
      if (assignmentsError) throw assignmentsError;

      // Combine data
      return rooms.map(room => {
        const assignment = assignments?.find(a => a.room_id === room.room_id);
        return {
          ...room,
          assignment,
          hasAssignment: !!assignment,
        };
      });
    },
  });

  // Auto-select assignment when room is selected
  useEffect(() => {
    if (selectedRoomId && roomsWithAssignments) {
      const room = roomsWithAssignments.find(r => r.id === selectedRoomId);
      if (room?.assignment) {
        setSelectedAssignment(room.assignment);
      } else {
        setSelectedAssignment(null);
      }
    }
  }, [selectedRoomId, roomsWithAssignments]);

  // Auto-populate status and status detail when judge is absent
  useEffect(() => {
    if (selectedAssignment?.justice && absentStaffMap.size > 0) {
      const judgeKey = selectedAssignment.justice.toLowerCase();
      const absence = absentStaffMap.get(judgeKey);
      
      if (absence) {
        // Judge is absent - auto-populate OUT status
        setStatus('OUT');
        
        // Auto-fill status detail with absence dates
        const startDate = format(new Date(absence.starts_on), 'MM/dd');
        const endDate = format(new Date(absence.ends_on), 'MM/dd');
        setStatusDetail(`OUT ${startDate}-${endDate}`);
        
        logger.debug('✅ Auto-populated absence for', selectedAssignment.justice, ':', `OUT ${startDate}-${endDate}`);
      }
    }
  }, [selectedAssignment, absentStaffMap]);

  // Filter rooms based on search
  const filteredRooms = roomsWithAssignments?.filter(room => {
    if (!roomSearch) return true;
    const searchLower = roomSearch.toLowerCase();
    const roomMatch = room.room_number?.toLowerCase().includes(searchLower);
    const partMatch = room.assignment?.part?.toLowerCase().includes(searchLower);
    const judgeMatch = room.assignment?.justice?.toLowerCase().includes(searchLower);
    return roomMatch || partMatch || judgeMatch;
  }) || [];

  // Filter statuses based on search
  const filteredStatuses = SESSION_STATUSES.filter(s => {
    if (!statusSearch) return true;
    return s.label.toLowerCase().includes(statusSearch.toLowerCase()) ||
           s.value.toLowerCase().includes(statusSearch.toLowerCase());
  });

  // Filter available rooms based on search
  const filteredAvailableRooms = availableRooms?.all.filter(room => {
    if (!partSearch) return true;
    return room.room_number.toLowerCase().includes(partSearch.toLowerCase()) ||
           room.part?.toLowerCase().includes(partSearch.toLowerCase());
  }) || [];

  // Track previous open state to detect when dialog first opens
  const prevOpenRef = useRef(false);
  
  // Reset form only when dialog first opens (not on subsequent prop changes)
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      // Dialog just opened - reset everything
      setSelectedBuilding(initialBuildingCode);
      setSelectedRoomId('');
      setStatus('OUT');
      setCustomStatus('');
      setStatusDetail('');
      setNotes('');
      setSelectedAssignment(null);
      setRoomSearch('');
      setStatusSearch('');
      setShowCustomStatus(false);
      setPartSearch('');
      setPartDropdownOpen(false);
      setStatusDetailDateOpen(false);
      setNotesDateOpen(false);
      // Reset new calendar fields
      setPartsEnteredBy('');
      setDefendants('');
      setPurpose('');
      setDateTranStart(undefined);
      setTopCharge('');
      setAttorney('');
    }
    prevOpenRef.current = open;
  }, [open, initialBuildingCode]);

  // Reset only case-specific fields after successful save
  const resetCaseFields = () => {
    setPartsEnteredBy('');
    setDefendants('');
    setPurpose('');
    setDateTranStart(undefined);
    setTopCharge('');
    setAttorney('');
    setNotes('');
    
    // Auto-focus on defendants field for quick data entry
    setTimeout(() => {
      defendantsInputRef.current?.focus();
    }, 100);
  };

  const handleSubmit = async (keepOpen = false) => {
    if (!selectedRoomId) return;

    // Use custom status if "CUSTOM" is selected, otherwise use selected status
    const finalStatus = status === 'CUSTOM' ? customStatus : status;

    try {
      await createSession.mutateAsync({
        session_date: dateStr,
        period,
        building_code: selectedBuilding,
        court_room_id: selectedRoomId,
        status: finalStatus,
        status_detail: statusDetail || undefined,
        judge_name: selectedAssignment?.justice || undefined,
        part_number: selectedAssignment?.part || undefined,
        clerk_names: selectedAssignment?.clerks || undefined,
        sergeant_name: selectedAssignment?.sergeant || undefined,
        calendar_day: selectedAssignment?.calendar_day || undefined,
        notes: notes || undefined,
        // Calendar fields (now added to database schema)
        parts_entered_by: partsEnteredBy || 'OWN', // Default to OWN if blank
        defendants: defendants || undefined,
        purpose: purpose || undefined,
        date_transferred_or_started: dateTranStart ? format(dateTranStart, 'yyyy-MM-dd') : undefined,
        top_charge: topCharge || undefined,
        attorney: attorney || undefined,
      });

      if (keepOpen) {
        // Reset only case-specific fields, keep judge/room/status
        resetCaseFields();
      } else {
        onOpenChange(false);
      }
    } catch (error) {
      logger.error('Session creation error:', error);
      // Error toast is already handled in the mutation's onError
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Session</DialogTitle>
          <DialogDescription>
            {format(date, 'EEEE, MMMM d, yyyy')} - {period} Period
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Building Selection */}
          <div className="space-y-2">
            <Label>Building *</Label>
            <RadioGroup
              value={selectedBuilding}
              onValueChange={(value) => {
                setSelectedBuilding(value as BuildingCode);
                setSelectedRoomId(''); // Reset room selection
              }}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="100" id="building-100" />
                <Label htmlFor="building-100" className="cursor-pointer font-normal">
                  100 Centre Street
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="111" id="building-111" />
                <Label htmlFor="building-111" className="cursor-pointer font-normal">
                  111 Centre Street
                </Label>
              </div>
            </RadioGroup>
          </div>
          {/* Court Room Selection with Auto-Complete */}
          <div className="space-y-2">
            <Label htmlFor="room-search">Courtroom * {filteredRooms.length > 0 && `(${filteredRooms.length} matches)`}</Label>
            <div className="relative">
              <Input
                id="room-search"
                placeholder="Type room number, part, or judge name..."
                value={roomSearch}
                onChange={(e) => setRoomSearch(e.target.value)}
                onFocus={() => setRoomSearch('')}
                className="pr-10"
              />
              {roomsLoading && (
                <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            
            {/* Auto-filtered results */}
            {roomSearch && (
              <div className="border rounded-md max-h-[300px] overflow-y-auto bg-background">
                {filteredRooms.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground text-center">
                    No courtrooms found matching "{roomSearch}"
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredRooms.map((room) => (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => {
                          setSelectedRoomId(room.id);
                          setRoomSearch('');
                        }}
                        className="w-full p-3 text-left hover:bg-muted transition-colors flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="font-medium">Room {room.room_number}</div>
                          {room.assignment && (
                            <div className="text-sm text-muted-foreground">
                              Part {room.assignment.part} - {room.assignment.justice}
                            </div>
                          )}
                        </div>
                        {!room.assignment && (
                          <Badge variant="outline" className="text-xs">Empty</Badge>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Selected room display */}
            {selectedRoomId && !roomSearch && (
              <div className="p-3 border rounded-md bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">
                      Room {roomsWithAssignments?.find(r => r.id === selectedRoomId)?.room_number}
                    </div>
                    {selectedAssignment && (
                      <div className="text-sm text-muted-foreground">
                        Part {selectedAssignment.part} - {selectedAssignment.justice}
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedRoomId('');
                      setSelectedAssignment(null);
                    }}
                  >
                    Change
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Assignment Details - Auto-populated from Room */}
          {selectedRoomId && (
            <div className="rounded-lg border-2 border-primary/20 p-4 bg-primary/5 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <h4 className="font-medium text-primary">Auto-Populated Personnel</h4>
                <Badge variant="secondary" className="ml-auto text-xs">From Room Assignment</Badge>
              </div>
              
              {selectedAssignment ? (
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2 bg-background rounded border">
                      <div className="text-xs text-muted-foreground mb-1">Part Number</div>
                      <div className="font-medium">{selectedAssignment.part}</div>
                    </div>
                    <div className="p-2 bg-background rounded border">
                      <div className="text-xs text-muted-foreground mb-1">Judge</div>
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{selectedAssignment.justice}</div>
                        {selectedAssignment.justice && absentStaffMap.has(selectedAssignment.justice.toLowerCase()) && (
                          <Badge variant="destructive" className="text-xs flex items-center gap-1">
                            <UserX className="h-3 w-3" />
                            Absent
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="p-2 bg-background rounded border">
                    <div className="text-xs text-muted-foreground mb-1">Court Clerks</div>
                    <div className="font-medium">{selectedAssignment.clerks?.join(', ') || 'None assigned'}</div>
                  </div>
                  <div className="p-2 bg-background rounded border">
                    <div className="text-xs text-muted-foreground mb-1">Court Sergeant</div>
                    <div className="font-medium">{selectedAssignment.sergeant || 'None assigned'}</div>
                  </div>
                  {selectedAssignment.calendar_day && (
                    <div className="p-2 bg-background rounded border">
                      <div className="text-xs text-muted-foreground mb-1">Calendar Day</div>
                      <div className="font-medium flex items-center gap-2">
                        <CalendarIcon className="h-3 w-3" />
                        {selectedAssignment.calendar_day}
                      </div>
                    </div>
                  )}
                  {selectedAssignment.justice && absentStaffMap.has(selectedAssignment.justice.toLowerCase()) ? (
                    <Alert className="mt-2 border-amber-500/30 bg-amber-500/5">
                      <UserX className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-xs">
                        <strong>✅ Absence Auto-Populated:</strong> {selectedAssignment.justice} is marked as absent on this date ({absentStaffMap.get(selectedAssignment.justice.toLowerCase())?.absence_reason}). The status has been automatically set to "OUT" with absence dates in the status detail field.
                        <br/>
                        <span className="text-muted-foreground italic mt-1 block">
                          You can modify these fields if needed before creating the session.
                        </span>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="mt-2 border-primary/30 bg-primary/5">
                      <CheckCircle className="h-4 w-4 text-primary" />
                      <AlertDescription className="text-xs">
                        <strong>Automatic Assignment:</strong> These personnel details are automatically populated from the room's current assignment. They will be saved with this session.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <Alert className="border-amber-500/30 bg-amber-500/5">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  <AlertDescription className="text-xs">
                    <strong>No Assignment:</strong> This courtroom has no current personnel assignment. The session will be created without assigned personnel.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select 
              value={status} 
              onValueChange={(value) => {
                setStatus(value);
                setShowCustomStatus(value === 'CUSTOM');
              }}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SESSION_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
                <SelectItem value="CUSTOM" className="font-medium text-primary">
                  + Add Custom Status
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Status Input */}
          {showCustomStatus && (
            <div className="space-y-2">
              <Label htmlFor="custom-status">Custom Status *</Label>
              <Input
                id="custom-status"
                placeholder="Enter custom status (e.g., SETTLEMENT, CONFERENCE)"
                value={customStatus}
                onChange={(e) => setCustomStatus(e.target.value.toUpperCase())}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Enter a custom status code. This will be saved and can be used for future sessions.
              </p>
            </div>
          )}

          {/* Status Detail (Optional) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="status-detail">Status Detail (Optional)</Label>
              <Popover open={statusDetailDateOpen} onOpenChange={setStatusDetailDateOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" type="button">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    Insert Date
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={undefined}
                    onSelect={(selectedDate) => {
                      if (selectedDate) {
                        const dateStr = format(selectedDate, 'MM/dd');
                        setStatusDetail(prev => prev ? `${prev} ${dateStr}` : dateStr);
                        setStatusDetailDateOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Input
              id="status-detail"
              placeholder="e.g., HRG CONT'D 10/23"
              value={statusDetail}
              onChange={(e) => setStatusDetail(e.target.value)}
            />
          </div>

          {/* New Calendar Fields */}
          <div className="grid grid-cols-2 gap-4">
            {/* Sending Part */}
            <div className="space-y-2">
              <Label htmlFor="parts-entered-by">
                Sending Part {availableRooms && `(${availableRooms.empty.length} empty, ${availableRooms.absent.length} absent, ${availableRooms.present.length} active)`}
                <span className="text-xs text-muted-foreground ml-2">(Leave blank for OWN)</span>
              </Label>
              <Popover open={partDropdownOpen} onOpenChange={setPartDropdownOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={partDropdownOpen}
                    className="w-full justify-between"
                  >
                    {partsEnteredBy || "OWN - Select a room..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Search rooms or parts..." 
                      value={partSearch}
                      onValueChange={setPartSearch}
                    />
                    <CommandList className="max-h-[400px] overflow-y-auto">
                      <CommandEmpty>No available rooms found.</CommandEmpty>
                      
                      {/* Empty Rooms Group */}
                      {availableRooms?.empty && availableRooms.empty.length > 0 && (
                        <CommandGroup heading="Empty Rooms">
                          {availableRooms.empty
                            .filter(room => 
                              !partSearch || 
                              room.room_number.toLowerCase().includes(partSearch.toLowerCase()) ||
                              room.part?.toLowerCase().includes(partSearch.toLowerCase())
                            )
                            .map((room) => (
                              <CommandItem
                                key={`empty-${room.room_number}`}
                                value={`${room.room_number} ${room.part || ''}`}
                                onSelect={() => {
                                  setPartsEnteredBy(room.part || room.room_number);
                                  setPartDropdownOpen(false);
                                  setPartSearch('');
                                }}
                                className="cursor-pointer"
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    partsEnteredBy === (room.part || room.room_number) ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                                <div className="flex-1">
                                  <div className="font-medium">Room {room.room_number}</div>
                                  {room.part ? (
                                    <div className="text-xs text-muted-foreground">Part {room.part} • Empty</div>
                                  ) : (
                                    <div className="text-xs text-muted-foreground">No part assigned</div>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      )}
                      
                      {/* Absent Judge Rooms Group */}
                      {availableRooms?.absent && availableRooms.absent.length > 0 && (
                        <CommandGroup heading="Judge Absent">
                          {availableRooms.absent
                            .filter(room => 
                              !partSearch || 
                              room.room_number.toLowerCase().includes(partSearch.toLowerCase()) ||
                              room.part?.toLowerCase().includes(partSearch.toLowerCase()) ||
                              room.judge?.toLowerCase().includes(partSearch.toLowerCase())
                            )
                            .map((room) => (
                              <CommandItem
                                key={`absent-${room.room_number}`}
                                value={`${room.room_number} ${room.part || ''} ${room.judge || ''}`}
                                onSelect={() => {
                                  setPartsEnteredBy(room.part || room.room_number);
                                  setPartDropdownOpen(false);
                                  setPartSearch('');
                                }}
                                className="cursor-pointer"
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    partsEnteredBy === (room.part || room.room_number) ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                                <div className="flex-1">
                                  <div className="font-medium">Room {room.room_number}</div>
                                  <div className="text-xs text-amber-600">
                                    Part {room.part} • {room.judge} (Absent)
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      )}
                      
                      {/* Present Judge Rooms Group (May Have Capacity) */}
                      {availableRooms?.present && availableRooms.present.length > 0 && (
                        <CommandGroup heading="Judge Present / Available">
                          {availableRooms.present
                            .filter(room => 
                              !partSearch || 
                              room.room_number.toLowerCase().includes(partSearch.toLowerCase()) ||
                              room.part?.toLowerCase().includes(partSearch.toLowerCase()) ||
                              room.judge?.toLowerCase().includes(partSearch.toLowerCase())
                            )
                            .map((room) => (
                              <CommandItem
                                key={`present-${room.room_number}`}
                                value={`${room.room_number} ${room.part} ${room.judge}`}
                                onSelect={() => {
                                  setPartsEnteredBy(room.part || room.room_number);
                                  setPartDropdownOpen(false);
                                  setPartSearch('');
                                }}
                                className="cursor-pointer"
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    partsEnteredBy === (room.part || room.room_number) ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                                <div className="flex-1">
                                  <div className="font-medium">Room {room.room_number}</div>
                                  <div className="text-xs text-muted-foreground">
                                    Part {room.part} • {room.judge} (In Session)
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              
              {/* Clear button when part is selected */}
              {partsEnteredBy && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPartsEnteredBy('')}
                  className="w-full text-xs"
                >
                  Clear Selection (Default to OWN)
                </Button>
              )}
            </div>

            {/* Defendants */}
            <div className="space-y-2">
              <Label htmlFor="defendants">Defendants</Label>
              <Input
                ref={defendantsInputRef}
                id="defendants"
                placeholder="Enter defendants..."
                value={defendants}
                onChange={(e) => setDefendants(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Purpose */}
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose</Label>
              <Input
                id="purpose"
                placeholder="Enter purpose..."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </div>

            {/* Date Tran/Start */}
            <div className="space-y-2">
              <Label htmlFor="date-tran-start">Date Tran/Start</Label>
              <DatePicker
                value={dateTranStart}
                onChange={(date) => setDateTranStart(date)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Top Charge */}
            <div className="space-y-2">
              <Label htmlFor="top-charge">Top Charge</Label>
              <Input
                id="top-charge"
                placeholder="Enter top charge..."
                value={topCharge}
                onChange={(e) => setTopCharge(e.target.value)}
              />
            </div>

            {/* Attorney */}
            <div className="space-y-2">
              <Label htmlFor="attorney">Attorney</Label>
              <Input
                id="attorney"
                placeholder="Enter attorney..."
                value={attorney}
                onChange={(e) => setAttorney(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="notes">Notes</Label>
              <Popover open={notesDateOpen} onOpenChange={setNotesDateOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" type="button">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    Insert Date
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={undefined}
                    onSelect={(selectedDate) => {
                      if (selectedDate) {
                        const dateStr = format(selectedDate, 'MM/dd');
                        setNotes(prev => prev ? `${prev} ${dateStr}` : dateStr);
                        setNotesDateOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Textarea
              id="notes"
              placeholder="e.g., Cal Thurs OFF 10/23 10/24-10/25"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createSession.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleSubmit(false)}
            disabled={!selectedRoomId || (status === 'CUSTOM' && !customStatus) || createSession.isPending}
          >
            {createSession.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Create Session
          </Button>
          <Button
            onClick={() => handleSubmit(true)}
            disabled={!selectedRoomId || (status === 'CUSTOM' && !customStatus) || createSession.isPending}
            variant="default"
          >
            {createSession.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Save & Add Another
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
