import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { Check, Calendar as CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X, Filter, Download, GripVertical, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRealtime } from "@/hooks/useRealtime";
import { useCourtPersonnel } from "@/hooks/useCourtPersonnel";
import { useCourtIssuesIntegration } from "@/hooks/useCourtIssuesIntegration";
import { PersonnelSelector } from "./PersonnelSelector";
import { JudgeStatusDropdown, JudgeStatusBadge } from "./JudgeStatusManager";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';

interface CourtAssignmentRow {
  room_id: string;
  room_number: string;
  courtroom_number: string | null;
  court_room_id?: string | null;
  assignment_id: string | null;
  part: string | null;
  justice: string | null;
  clerks: string[] | null;
  sergeant: string | null;
  tel: string | null;
  fax: string | null;
  calendar_day: string | null;
  is_active: boolean;
  sort_order: number;
  judge_present?: boolean;
  clerks_present_count?: number;
}

interface EditingCell {
  rowId: string;
  field: string;
}

interface SortableRowProps {
  row: CourtAssignmentRow;
  onEdit: (rowId: string, field: string, currentValue: string | string[]) => void;
  editingCell: EditingCell | null;
  editingValue: string | string[];
  setEditingValue: (value: string | string[]) => void;
  onSave: () => void;
  onCancel: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onDelete: (assignmentId: string) => void;
  hasIssues: boolean;
  urgentIssues: boolean;
  hasMaintenance: boolean;
  isIncomplete: boolean;
  tooltipText?: string;
  isRecentlyAffected: boolean;
  rowElementId?: string;
}

const SortableRow = ({ 
  row, 
  onEdit, 
  editingCell, 
  editingValue, 
  setEditingValue, 
  onSave, 
  onCancel, 
  onKeyDown,
  onDelete,
  hasIssues,
  urgentIssues,
  hasMaintenance,
  isIncomplete,
  tooltipText,
  isRecentlyAffected,
  rowElementId
}: SortableRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: row.room_id });

  const { personnel } = useCourtPersonnel();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const renderEditableCell = (field: keyof CourtAssignmentRow, displayValue: string | string[]) => {
    const isEditing = editingCell?.rowId === row.room_id && editingCell?.field === field;
    
    if (isEditing) {
      // Personnel selection fields with dropdowns
      if (field === 'justice') {
        return (
          <div className="flex items-center gap-2">
            <PersonnelSelector
              value={editingValue as string}
              onValueChange={(value) => setEditingValue(value as string)}
              personnel={personnel.judges}
              placeholder="Select judge..."
              role="judge"
              allowCustom={true}
              allowClear={true}
              className="min-w-[200px]"
            />
            <Button size="sm" variant="ghost" onClick={onSave}>
              <Save className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancel}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        );
      }

      if (field === 'clerks') {
        return (
          <div className="flex items-center gap-2">
            <PersonnelSelector
              value={editingValue as string[]}
              onValueChange={(value) => setEditingValue(value as string[])}
              personnel={personnel.clerks}
              placeholder="Select clerks..."
              role="clerk"
              multiple={true}
              allowCustom={true}
              allowClear={true}
              className="min-w-[250px]"
            />
            <Button size="sm" variant="ghost" onClick={onSave}>
              <Save className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancel}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        );
      }

      if (field === 'sergeant') {
        return (
          <div className="flex items-center gap-2">
            <PersonnelSelector
              value={editingValue as string}
              onValueChange={(value) => setEditingValue(value as string)}
              personnel={personnel.sergeants}
              placeholder="Select sergeant..."
              role="sergeant"
              allowCustom={true}
              allowClear={true}
              className="min-w-[200px]"
            />
            <Button size="sm" variant="ghost" onClick={onSave}>
              <Save className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancel}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        );
      }

      // Calendar day field
      if (field === 'calendar_day') {
        const days = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
        const selected = Array.isArray(editingValue)
          ? (editingValue as string[])
          : (((editingValue as string) || '').split(',').map(s => s.trim()).filter(Boolean));
        const toggleDay = (d: string) => {
          const set = new Set(selected);
          if (set.has(d)) set.delete(d); else set.add(d);
          setEditingValue(Array.from(set));
        };
        const clearDays = () => setEditingValue([]);
        return (
          <div className="flex items-center gap-2">
            <div className="min-w-[260px]">
              <div className="mb-1 flex flex-wrap gap-1">
                {selected.length > 0 ? selected.map(d => (
                  <span key={d} className="text-xs px-2 py-0.5 rounded border bg-muted">{d}</span>
                )) : <span className="text-xs text-muted-foreground">No calendar days</span>}
              </div>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-xs">
                      <CalendarIcon className="h-3 w-3 mr-1" /> Select days
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-0" align="start">
                    <Command>
                      <CommandGroup>
                        {days.map(d => {
                          const isOn = selected.includes(d);
                          return (
                            <CommandItem key={d} onSelect={() => toggleDay(d)} className="flex items-center justify-between">
                              <span className="text-sm">{d}</span>
                              {isOn && <Check className="h-3.5 w-3.5" />}
                            </CommandItem>
                          );
                        })}
                        <CommandItem onSelect={clearDays} className="text-destructive">
                          Clear selection
                        </CommandItem>
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={clearDays}>Clear</Button>
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={onSave}>
              <Save className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancel}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        );
      }
      
      // Regular text input for other fields
      return (
        <div className="flex items-center gap-2">
          <Input
            value={editingValue as string}
            onChange={(e) => setEditingValue(e.target.value)}
            onKeyDown={onKeyDown}
            className="h-8"
            autoFocus
          />
          <Button size="sm" variant="ghost" onClick={onSave}>
            <Save className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    const handleClick = () => {
      let currentValue: string | string[];
      if (field === 'clerks' && Array.isArray(displayValue)) {
        currentValue = displayValue;
      } else if (field === 'clerks' && typeof displayValue === 'string') {
        currentValue = displayValue ? displayValue.split(', ') : [];
      } else {
        currentValue = displayValue as string || '';
      }
      onEdit(row.room_id, field as string, currentValue);
    };

    // Pretty formatting for calendar_day when not editing
    const prettyCalendar = () => {
      const dayOrder = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
      const abbr: Record<string,string> = { Monday:'Mon', Tuesday:'Tue', Wednesday:'Wed', Thursday:'Thu', Friday:'Fri' };
      const canonMap: Record<string,string> = {
        mon: 'Monday', monday: 'Monday',
        tue: 'Tuesday', tues: 'Tuesday', tuesday: 'Tuesday',
        wed: 'Wednesday', weds: 'Wednesday', wednesday: 'Wednesday',
        thu: 'Thursday', thur: 'Thursday', thurs: 'Thursday', thursday: 'Thursday',
        fri: 'Friday', friday: 'Friday'
      };
      const raw = (displayValue as string) || '';
      // Handle legacy formats like '["Thursday","Tuesday"]' by attempting JSON parse first
      let items: string[] = [];
      try {
        const maybe = JSON.parse(raw);
        if (Array.isArray(maybe)) {
          items = maybe as string[];
        }
      } catch {}
      if (items.length === 0) {
        const cleaned = raw.replace(/[\[\]"]+/g, '');
        items = cleaned.split(',').map(s => s.trim()).filter(Boolean);
      }
      const parsed = items
        .map(s => canonMap[s.toLowerCase()] || s)
        .filter((v, i, a) => a.indexOf(v) === i)
        .sort((a,b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
      if (parsed.length === 0) return <span className="text-muted-foreground italic">No calendar day</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {parsed.map(d => (
            <Badge key={d} variant="secondary" className="text-xs">
              {abbr[d] || d}
            </Badge>
          ))}
        </div>
      );
    };

    return (
      <div 
        className="cursor-pointer hover:bg-muted/50 p-2 rounded min-h-[32px] flex items-center"
        onClick={handleClick}
      >
        {Array.isArray(displayValue) ? (
          displayValue.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {displayValue.map((item, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {item}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground italic">Click to add</span>
          )
        ) : (
          field === 'calendar_day' ? (
            prettyCalendar()
          ) : (
            (displayValue as string) || (
              <span className="text-muted-foreground italic">Click to add</span>
            )
          )
        )}
      </div>
    );
  };

  const glowClass = hasMaintenance
    ? 'ring-2 ring-red-500/60 shadow-[0_0_16px_rgba(239,68,68,0.6)]'
    : !row.is_active
      ? 'ring-2 ring-blue-500/60 shadow-[0_0_16px_rgba(59,130,246,0.6)]'
      : hasIssues
        ? 'ring-2 ring-yellow-500/60 shadow-[0_0_16px_rgba(234,179,8,0.6)]'
        : isIncomplete
          ? 'ring-2 ring-purple-500/60 shadow-[0_0_16px_rgba(168,85,247,0.6)]'
          : '';

  const rowAnimationClass = hasMaintenance
    ? 'animate-red-glow'
    : (!row.is_active
        ? 'animate-blue-glow'
        : (hasIssues
            ? 'animate-yellow-glow'
            : (isIncomplete ? 'animate-purple-glow' : '')));

  const rowElement = (
    <tr
      id={rowElementId}
      ref={setNodeRef}
      style={style}
      title={tooltipText || undefined}
      className={`border-b hover:bg-muted/50 ${urgentIssues ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800' : ''} ${glowClass} ${rowAnimationClass} ${isRecentlyAffected ? 'ring-2 ring-amber-400' : ''}`}
    >
      <td className="p-2">
        <div className="flex items-center gap-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="font-medium">
            <div className="flex items-center gap-2">
              {row.room_number}
              {urgentIssues && (
                <div title="Urgent issues in this courtroom">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </div>
              )}
            </div>
            {row.courtroom_number && (
              <div className="text-sm text-muted-foreground">
                Court {row.courtroom_number}
              </div>
            )}
          </div>
        </div>
      </td>
      <td className="p-2">
        {renderEditableCell("part", row.part || "")}
      </td>
      <td className="p-2">
        <div className="flex items-center gap-2 group">
          {row.justice && (
            <span className={`inline-block h-2 w-2 rounded-full flex-shrink-0 ${row.judge_present ? 'bg-emerald-500' : 'bg-gray-400'}`} 
                  title={row.judge_present ? 'Present' : 'Status unknown'} />
          )}
          {renderEditableCell("justice", row.justice || "")}
          {row.justice && (
            <>
              <JudgeStatusBadge status={personnel.judges.find(j => j.name === row.justice)?.judgeStatus || 'active'} />
              <JudgeStatusDropdown judgeName={row.justice} compact />
            </>
          )}
        </div>
      </td>
      <td className="p-2">
        {renderEditableCell("clerks", row.clerks || [])}
      </td>
      <td className="p-2">
        {renderEditableCell("sergeant", row.sergeant || "")}
      </td>
      <td className="p-2">
        {renderEditableCell("tel", row.tel || "")}
      </td>
      <td className="p-2">
        {renderEditableCell("fax", row.fax || "")}
      </td>
      <td className="p-2">
        {renderEditableCell("calendar_day", row.calendar_day || "")}
      </td>
      <td className="p-2">
        {(() => {
          let text = "Assigned";
          let variant: unknown = "default";
          if (hasMaintenance) {
            text = "Maintenance";
            variant = "destructive";
          } else if (!row.is_active) {
            text = "Inactive";
            variant = "outline";
          } else if (!row.assignment_id) {
            text = "No assignment";
            variant = "secondary";
          } else if (!row.justice || !row.justice.trim()) {
            text = "Available";
            variant = "secondary";
          }
          return <Badge variant={variant as any}>{text}</Badge>;
        })()}
      </td>
    </tr>
  );

  return rowElement;
};

export const EnhancedCourtAssignmentTable = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editingValue, setEditingValue] = useState<string | string[]>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchParams] = useSearchParams();
  const scrollToRoomId = searchParams.get('room') || undefined;

  // Use our custom hooks
  const { personnel, isLoading: personnelLoading } = useCourtPersonnel();
  const { 
    courtIssues, 
    getIssuesForRoom, 
    hasUrgentIssues, 
    getCourtImpactSummary,
    getRecentlyAffectedRooms 
  } = useCourtIssuesIntegration();
  const recentlyAffectedRooms = getRecentlyAffectedRooms();

  // Fetch active/scheduled shutdowns to determine maintenance
  const { data: shutdowns } = useQuery({
    queryKey: ["room-shutdowns-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("room_shutdowns")
        .select("court_room_id, status")
        .or("status.eq.in_progress,status.eq.scheduled");
      if (error) throw error;
      return data || [];
    },
  });

  const maintenanceSet = useMemo(() => new Set((shutdowns || []).map((s: Record<string, unknown>) => s.court_room_id)), [shutdowns]);

  // Get impact summary
  const impactSummary = getCourtImpactSummary();

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  const updateAssignmentMutation = useMutation({
    mutationFn: async ({ roomId, field, value }: { roomId: string; field: string; value: string | string[] }) => {
      logger.debug('💾 Saving assignment:', { roomId, field, value });
      const existingAssignment = assignments?.find(row => row.room_id === roomId);
      logger.debug('📋 Existing assignment:', existingAssignment);
      
      // Normalize calendar_day for storage
      let normalizedValue: unknown;
      if (field === 'calendar_day') {
        if (Array.isArray(value)) {
          normalizedValue = value.join(',');
        } else if (value === '' || value === undefined || value === 'none') {
          normalizedValue = null;
        } else {
          normalizedValue = value;
        }
      } else {
        normalizedValue = value;
      }
      
      // Validation: Warn if creating incomplete assignment
      if (!existingAssignment?.assignment_id) {
        // Creating new assignment - check if we have minimum required fields
        const isCreatingPart = field === 'part' && normalizedValue;
        const isCreatingJustice = field === 'justice' && normalizedValue;
        
        if (!isCreatingPart && !isCreatingJustice) {
          logger.warn('⚠️ Creating assignment without Part or Justice - may be incomplete');
        }
      }
      
      if (existingAssignment?.assignment_id) {
        // Update existing assignment
        const updateData: Record<string, unknown> = { [field]: normalizedValue };
        logger.debug('✏️ Updating existing assignment:', updateData);
        const { error } = await supabase
          .from("court_assignments")
          .update(updateData)
          .eq("id", existingAssignment.assignment_id);
        if (error) throw error;
      } else {
        // Create new assignment
        const maxSort = Math.max(
          0,
          ...((assignments || [])
            .filter(a => !!a.assignment_id)
            .map(a => a.sort_order || 0))
        );
        const insertData: Record<string, unknown> = {
          room_id: existingAssignment?.room_id || roomId,
          room_number: existingAssignment?.room_number || "",
          [field]: normalizedValue,
          sort_order: maxSort + 1
        };
        logger.debug('➕ Creating new assignment:', insertData);
        const { error } = await supabase
          .from("court_assignments")
          .insert(insertData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["court-assignments-enhanced"] });
      queryClient.invalidateQueries({ queryKey: ["court-personnel"] });
      // Keep Overview and Quick Actions in sync
      queryClient.invalidateQueries({ queryKey: ["interactive-operations"] });
      queryClient.invalidateQueries({ queryKey: ["quick-actions"] });
      queryClient.invalidateQueries({ queryKey: ["assignment-stats"] });
      setEditingCell(null);
      setEditingValue("");
      toast({
        title: "Assignment updated",
        description: "Court assignment has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update assignment: " + error.message,
      });
    },
  });

  // Delete assignment mutation (component scope)
  const deleteAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('court_assignments')
        .delete()
        .eq('id', assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["court-assignments-enhanced"] });
      queryClient.invalidateQueries({ queryKey: ["interactive-operations"] });
      queryClient.invalidateQueries({ queryKey: ["quick-actions"] });
      queryClient.invalidateQueries({ queryKey: ["assignment-stats"] });
      toast({
        title: "Assignment deleted",
        description: "Court assignment has been deleted successfully.",
      });
    },
    onError: (error: unknown) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete assignment: " + (error as any).message,
      });
    },
  });

  // Handle drag end for reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && assignments) {
      const oldIndex = assignments.findIndex((item) => item.room_id === active.id);
      const newIndex = assignments.findIndex((item) => item.room_id === over?.id);

      const newAssignments = arrayMove(assignments, oldIndex, newIndex);
      
      // Update sort_order for all affected assignments
      newAssignments.forEach(async (assignment, index) => {
        if ((assignment as any).assignment_id) {
          await supabase
            .from('court_assignments')
            .update({ sort_order: index + 1 })
            .eq('id', (assignment as any).assignment_id);
        }
      });

      // Invalidate queries to refresh the data across dashboard panels
      queryClient.invalidateQueries({ queryKey: ["court-assignments-enhanced"] });
      queryClient.invalidateQueries({ queryKey: ["interactive-operations"] });
      queryClient.invalidateQueries({ queryKey: ["quick-actions"] });
      queryClient.invalidateQueries({ queryKey: ["assignment-stats"] });
      
      toast({
        title: "Order Updated",
        description: "Courtroom order has been updated successfully.",
      });
    }
  };

  // Fetch court assignments data
  const { data: assignments, isLoading } = useQuery({
    queryKey: ["court-assignments-enhanced"],
    queryFn: async () => {
      // First get court rooms with their assignments
      const { data: roomsData, error: roomsError } = await supabase
        .from("court_rooms")
        .select(`
          id,
          room_id,
          room_number,
          courtroom_number,
          is_active
        `)
        .order("room_number");

      if (roomsError) throw roomsError;

      // Then get assignments separately and join them
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("court_assignments")
        .select(`
          room_id,
          id,
          room_number,
          part,
          justice,
          clerks,
          sergeant,
          tel,
          fax,
          calendar_day,
          sort_order
        `);

      if (assignmentsError) throw assignmentsError;

      // Fetch attendance data for real-time presence
      const { data: attendanceData, error: attendanceError } = await supabase
        .from("court_attendance")
        .select("room_id, judge_present, clerks_present_count");

      if (attendanceError) logger.error("Attendance fetch error:", attendanceError);

      // Create maps for quick lookup
      const assignmentMap = new Map();
      assignmentsData?.forEach(assignment => {
        assignmentMap.set(assignment.room_id, assignment);
      });

      const attendanceMap = new Map();
      attendanceData?.forEach(attendance => {
        attendanceMap.set(attendance.room_id, attendance);
      });

      const mappedData = (roomsData || []).map((room, index) => {
        const assignment = assignmentMap.get(room.room_id);
        const attendance = attendanceMap.get(room.room_id);
        
        return {
          room_id: room.room_id,
          room_number: room.room_number,
          courtroom_number: room.courtroom_number,
          court_room_id: room.id,
          assignment_id: assignment?.id || null,
          part: assignment?.part || null,
          justice: assignment?.justice || null,
          clerks: assignment?.clerks || null,
          sergeant: assignment?.sergeant || null,
          tel: assignment?.tel || null,
          fax: assignment?.fax || null,
          calendar_day: assignment?.calendar_day || null,
          is_active: (room as Record<string, unknown>)?.is_active ?? true,
          sort_order: assignment?.sort_order ?? index + 1,
          judge_present: attendance?.judge_present || false,
          clerks_present_count: attendance?.clerks_present_count || 0,
        } as CourtAssignmentRow;
      });

      // Sort by sort_order for drag and drop functionality
      return mappedData.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    },
  });

  // Rest of the component implementation would continue here...
  // This is a partial implementation showing the key enhancements

  if (isLoading || personnelLoading) {
    return <div>Loading court assignments...</div>;
  }

  return (
    <div className="space-y-4">

      {/* Enhanced table with personnel dropdowns and issue indicators */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="rounded-md border">
          <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 text-left font-medium">Room</th>
              <th className="p-3 text-left font-medium">Part</th>
              <th className="p-3 text-left font-medium">Justice</th>
              <th className="p-3 text-left font-medium">Clerks</th>
              <th className="p-3 text-left font-medium">Sergeant</th>
              <th className="p-3 text-left font-medium">Phone</th>
              <th className="p-3 text-left font-medium">Fax</th>
              <th className="p-3 text-left font-medium">Calendar Day</th>
              <th className="p-3 text-left font-medium">Status</th>
            </tr>
          </thead>
          <SortableContext
            items={assignments?.map(row => row.room_id) || []}
            strategy={verticalListSortingStrategy}
          >
            <tbody>
            {assignments?.map((row) => {
              const roomIssues = getIssuesForRoom(row.room_id);
              const hasIssues = roomIssues.length > 0;
              const urgentIssues = hasUrgentIssues(row.room_id);
              const hasMaintenance = row.court_room_id ? maintenanceSet.has(row.court_room_id) : false;
              // Yellow highlight ONLY when no judge, and only if room is active
              const isIncomplete = row.is_active && !(row.justice && row.justice.trim());
              const isRecentlyAffected = recentlyAffectedRooms.includes(row.room_id);

              // Build detailed tooltip with issue summary
              let tooltipText: string | undefined = undefined;
              if (hasMaintenance) {
                tooltipText = '🔧 MAINTENANCE\nRoom is under maintenance and unavailable';
              } else if (!row.is_active) {
                tooltipText = '⭕ INACTIVE\nRoom is temporarily closed';
              } else if (hasIssues) {
                const issueList = roomIssues
                  .slice(0, 3)
                  .map((issue: any) => `• ${issue.title || issue.description}`)
                  .join('\n');
                const moreCount = roomIssues.length > 3 ? `\n...and ${roomIssues.length - 3} more` : '';
                const severity = urgentIssues ? '🚨 URGENT ISSUES' : '⚠️ OPEN ISSUES';
                tooltipText = `${severity}\n${issueList}${moreCount}`;
              } else if (isIncomplete) {
                tooltipText = row.assignment_id ? '⚠️ No justice assigned to this room' : 'No assignment created yet';
              }

              return (
                <SortableRow
                  key={row.room_id}
                  // Expose DOM id for deep-link scrolling
                  rowElementId={`row-${row.room_id}`}
                  row={row}
                  tooltipText={tooltipText}
                  onEdit={(rowId, field, currentValue) => {
                    setEditingCell({ rowId, field });
                    setEditingValue(currentValue);
                  }}
                  editingCell={editingCell}
                  editingValue={editingValue}
                  setEditingValue={setEditingValue}
                  onSave={() => {
                    logger.debug('💾 Save button clicked:', { editingCell, editingValue });
                    if (editingCell) {
                      updateAssignmentMutation.mutate({
                        roomId: editingCell.rowId,
                        field: editingCell.field,
                        value: editingValue
                      });
                    }
                  }}
                  onCancel={() => {
                    setEditingCell(null);
                    setEditingValue("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      logger.debug('⏎ Enter key pressed:', { editingCell, editingValue });
                      if (editingCell) {
                        updateAssignmentMutation.mutate({
                          roomId: editingCell.rowId,
                          field: editingCell.field,
                          value: editingValue
                        });
                      }
                    } else if (e.key === "Escape") {
                      setEditingCell(null);
                      setEditingValue("");
                    }
                  }}
                  onDelete={(assignmentId) => {
                    deleteAssignmentMutation.mutate(assignmentId);
                  }}
                  hasIssues={hasIssues}
                  urgentIssues={urgentIssues}
                  hasMaintenance={hasMaintenance}
                  isIncomplete={isIncomplete}
                  isRecentlyAffected={isRecentlyAffected}
                />
              );
            })}
            </tbody>
          </SortableContext>
          </table>
        </div>
      </DndContext>
      {/* Scroll to specific room if room query param is present */}
      {scrollToRoomId && (
        <ScrollHelper targetId={`row-${scrollToRoomId}`} />
      )}
    </div>
  );
};

// Small helper component to perform smooth scroll once after mount
const ScrollHelper = ({ targetId }: { targetId: string }) => {
  useEffect(() => {
    const t = setTimeout(() => {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-2', 'ring-primary');
        setTimeout(() => el.classList.remove('ring-2', 'ring-primary'), 2000);
      }
    }, 100);
    return () => clearTimeout(t);
  }, [targetId]);
  return null;
};
