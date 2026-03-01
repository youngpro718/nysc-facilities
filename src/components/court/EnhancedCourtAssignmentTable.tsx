import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCourtPersonnel } from "@/hooks/useCourtPersonnel";
import { useCourtIssuesIntegration } from "@/hooks/useCourtIssuesIntegration";
import { ConflictDetectionService, Conflict, Warning } from "@/services/court/conflictDetectionService";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useIsMobile } from "@/hooks/use-mobile";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
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
} from '@dnd-kit/sortable';
import { AssignmentListItem } from "./AssignmentListItem";
import { AssignmentDetailPanel } from "./AssignmentDetailPanel";

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
  justice_departed?: boolean;
  justice_inactive?: boolean;
}

export const EnhancedCourtAssignmentTable = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchParams] = useSearchParams();
  const scrollToRoomId = searchParams.get('room') || undefined;

  const { personnel, isLoading: personnelLoading } = useCourtPersonnel();
  const {
    getIssuesForRoom,
    hasUrgentIssues,
    getRecentlyAffectedRooms,
  } = useCourtIssuesIntegration();
  const recentlyAffectedRooms = getRecentlyAffectedRooms();

  // Fetch active/scheduled shutdowns
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

  const maintenanceSet = useMemo(
    () => new Set((shutdowns || []).map((s: Record<string, unknown>) => s.court_room_id)),
    [shutdowns]
  );

  // Fetch scheduling conflicts
  const { data: conflictResult } = useQuery({
    queryKey: ["assignment-conflicts"],
    queryFn: () => ConflictDetectionService.detectConflicts(),
    staleTime: 30000,
  });

  // Build a map of room_number -> conflicts for inline markers
  const roomConflictMap = useMemo(() => {
    const map = new Map<string, (Conflict | Warning)[]>();
    if (!conflictResult) return map;
    [...conflictResult.conflicts, ...conflictResult.warnings].forEach(item => {
      item.affectedRooms.forEach(roomNum => {
        if (!map.has(roomNum)) map.set(roomNum, []);
        map.get(roomNum)!.push(item);
      });
    });
    return map;
  }, [conflictResult]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Update mutation
  const updateAssignmentMutation = useMutation({
    mutationFn: async ({ roomId, field, value }: { roomId: string; field: string; value: string | string[] }) => {
      logger.debug('💾 Saving assignment:', { roomId, field, value });
      const existingAssignment = assignments?.find(row => row.room_id === roomId);

      let normalizedValue: unknown;
      if (field === 'calendar_day') {
        if (Array.isArray(value)) normalizedValue = value.join(',');
        else if (value === '' || value === undefined || value === 'none') normalizedValue = null;
        else normalizedValue = value;
      } else {
        normalizedValue = value;
      }

      if (existingAssignment?.assignment_id) {
        const { error } = await supabase
          .from("court_assignments")
          .update({ [field]: normalizedValue })
          .eq("id", existingAssignment.assignment_id);
        if (error) throw error;
      } else {
        const maxSort = Math.max(0, ...((assignments || []).filter(a => !!a.assignment_id).map(a => a.sort_order || 0)));
        const { error } = await supabase
          .from("court_assignments")
          .insert({
            room_id: existingAssignment?.room_id || roomId,
            room_number: existingAssignment?.room_number || "",
            [field]: normalizedValue,
            sort_order: maxSort + 1,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["court-assignments-enhanced"] });
      queryClient.invalidateQueries({ queryKey: ["court-personnel"] });
      queryClient.invalidateQueries({ queryKey: ["interactive-operations"] });
      queryClient.invalidateQueries({ queryKey: ["quick-actions"] });
      queryClient.invalidateQueries({ queryKey: ["assignment-stats"] });
      toast({ title: "Assignment updated", description: "Court assignment has been updated successfully." });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: "Failed to update: " + error.message });
    },
  });

  // Delete mutation
  const deleteAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase.from('court_assignments').delete().eq('id', assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["court-assignments-enhanced"] });
      queryClient.invalidateQueries({ queryKey: ["interactive-operations"] });
      queryClient.invalidateQueries({ queryKey: ["assignment-stats"] });
      setSelectedRoomId(null);
      toast({ title: "Assignment deleted", description: "Court assignment has been deleted." });
    },
    onError: (error: unknown) => {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete: " + (error as Error).message });
    },
  });

  // Drag end handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id && assignments) {
      const oldIndex = assignments.findIndex((item) => item.room_id === active.id);
      const newIndex = assignments.findIndex((item) => item.room_id === over?.id);
      const newAssignments = arrayMove(assignments, oldIndex, newIndex);
      newAssignments.forEach(async (assignment, index) => {
        if (assignment.assignment_id) {
          await supabase.from('court_assignments').update({ sort_order: index + 1 }).eq('id', assignment.assignment_id);
        }
      });
      queryClient.invalidateQueries({ queryKey: ["court-assignments-enhanced"] });
      toast({ title: "Order Updated", description: "Courtroom order updated." });
    }
  };

  // Fetch data
  const { data: assignments, isLoading } = useQuery({
    queryKey: ["court-assignments-enhanced"],
    queryFn: async () => {
      const { data: roomsData, error: roomsError } = await supabase
        .from("court_rooms")
        .select("id, room_id, room_number, courtroom_number, is_active")
        .order("room_number");
      if (roomsError) throw roomsError;

      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("court_assignments")
        .select("room_id, id, room_number, part, justice, clerks, sergeant, tel, fax, calendar_day, sort_order");
      if (assignmentsError) throw assignmentsError;

      const { data: attendanceData, error: attendanceError } = await supabase
        .from("court_attendance")
        .select("room_id, judge_present, clerks_present_count");
      if (attendanceError) logger.error("Attendance fetch error:", attendanceError);

      // Fetch judge profiles for stale detection
      const { data: judgeProfiles } = await supabase
        .from("personnel_profiles")
        .select("display_name, judge_status, is_active")
        .eq("primary_role", "judge");

      const judgeStatusMap = new Map<string, { judgeStatus: string; isActive: boolean }>();
      judgeProfiles?.forEach(j => {
        if (j.display_name) {
          judgeStatusMap.set(j.display_name, { judgeStatus: j.judge_status || 'active', isActive: j.is_active ?? true });
        }
      });

      const assignmentMap = new Map();
      assignmentsData?.forEach(a => assignmentMap.set(a.room_id, a));
      const attendanceMap = new Map();
      attendanceData?.forEach(a => attendanceMap.set(a.room_id, a));

      const mappedData = (roomsData || []).map((room, index) => {
        const assignment = assignmentMap.get(room.room_id);
        const attendance = attendanceMap.get(room.room_id);
        const justiceProfile = assignment?.justice ? judgeStatusMap.get(assignment.justice) : null;

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
          justice_departed: justiceProfile?.judgeStatus === 'departed',
          justice_inactive: justiceProfile ? !justiceProfile.isActive : false,
        } as CourtAssignmentRow;
      });

      return mappedData.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    },
  });

  // Stale judge detection
  const staleJudgeRows = useMemo(
    () => (assignments || []).filter(r => r.justice_departed || r.justice_inactive),
    [assignments]
  );

  const clearDepartedMutation = useMutation({
    mutationFn: async () => {
      for (const row of staleJudgeRows) {
        if (row.assignment_id) {
          await supabase.from('court_assignments').update({ justice: null }).eq('id', row.assignment_id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["court-assignments-enhanced"] });
      queryClient.invalidateQueries({ queryKey: ["assignment-stats"] });
      toast({ title: "Cleared departed judges", description: `Removed ${staleJudgeRows.length} stale assignment(s).` });
    },
  });

  // Filtered list
  const filteredAssignments = useMemo(() => {
    if (!assignments) return [];
    if (!searchTerm.trim()) return assignments;
    const term = searchTerm.toLowerCase();
    return assignments.filter(r =>
      r.room_number.toLowerCase().includes(term) ||
      (r.part && r.part.toLowerCase().includes(term)) ||
      (r.justice && r.justice.toLowerCase().includes(term)) ||
      (r.sergeant && r.sergeant.toLowerCase().includes(term)) ||
      (r.clerks && r.clerks.some(c => c.toLowerCase().includes(term)))
    );
  }, [assignments, searchTerm]);

  // Auto-select first room or scroll target
  useEffect(() => {
    if (scrollToRoomId && assignments?.length) {
      setSelectedRoomId(scrollToRoomId);
      setTimeout(() => {
        const el = document.getElementById(`row-${scrollToRoomId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [scrollToRoomId, assignments]);

  const selectedRow = assignments?.find(r => r.room_id === selectedRoomId) || null;

  if (isLoading || personnelLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading court assignments...</div>;
  }

  const handleDetailSave = (field: string, value: string | string[]) => {
    if (selectedRoomId) {
      updateAssignmentMutation.mutate({ roomId: selectedRoomId, field, value });
    }
  };

  const detailContent = selectedRow ? (
    <AssignmentDetailPanel
      row={selectedRow}
      onSave={handleDetailSave}
      onDelete={(id) => deleteAssignmentMutation.mutate(id)}
      hasIssues={getIssuesForRoom(selectedRow.room_id).length > 0}
      urgentIssues={hasUrgentIssues(selectedRow.room_id)}
      hasMaintenance={selectedRow.court_room_id ? maintenanceSet.has(selectedRow.court_room_id) : false}
    />
  ) : (
    <div className="h-full flex items-center justify-center text-muted-foreground text-sm p-8 text-center">
      <div>
        <div className="text-4xl mb-3">⚖️</div>
        <p className="font-medium">Select a courtroom</p>
        <p className="text-xs mt-1">Click on any room in the list to view and edit its details</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Stale judge cleanup banner */}
      {staleJudgeRows.length > 0 && (
        <Alert variant="destructive" className="border-orange-400 bg-orange-50 dark:bg-orange-950/30">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-sm">
              <strong>{staleJudgeRows.length} room{staleJudgeRows.length > 1 ? 's have' : ' has'} departed/inactive judges</strong>{' '}
              ({staleJudgeRows.map(r => `${r.justice} in ${r.room_number}`).join(', ')})
            </span>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0"
              onClick={() => clearDepartedMutation.mutate()}
              disabled={clearDepartedMutation.isPending}
            >
              {clearDepartedMutation.isPending ? 'Clearing...' : 'Clear All'}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search rooms, parts, justices..."
          className="pl-9 h-9"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            onClick={() => setSearchTerm("")}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Split Panel Layout */}
      <div className="flex rounded-lg border bg-background overflow-hidden" style={{ height: 'calc(100vh - 420px)', minHeight: '400px' }}>
        {/* Left Panel: Compact List */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className={`${isMobile ? 'w-full' : 'w-[340px] lg:w-[380px]'} flex-shrink-0 overflow-y-auto border-r`}>
            <div className="sticky top-0 z-10 px-3 py-2 bg-muted/60 backdrop-blur-sm border-b">
              <span className="text-xs font-medium text-muted-foreground">
                {filteredAssignments.length} courtroom{filteredAssignments.length !== 1 ? 's' : ''}
              </span>
            </div>
            <SortableContext
              items={filteredAssignments.map(r => r.room_id)}
              strategy={verticalListSortingStrategy}
            >
              {filteredAssignments.map((row) => {
                const roomIssues = getIssuesForRoom(row.room_id);
                const hasIssues = roomIssues.length > 0;
                const urgentIssues = hasUrgentIssues(row.room_id);
                const hasMaintenance = row.court_room_id ? maintenanceSet.has(row.court_room_id) : false;
                const isIncomplete = row.is_active && !(row.justice && row.justice.trim());
                const isRecentlyAffected = recentlyAffectedRooms.includes(row.room_id);
                const roomConflicts = roomConflictMap.get(row.room_number) || [];

                return (
                  <AssignmentListItem
                    key={row.room_id}
                    row={row}
                    isSelected={selectedRoomId === row.room_id}
                    onClick={() => setSelectedRoomId(row.room_id)}
                    hasIssues={hasIssues}
                    urgentIssues={urgentIssues}
                    hasMaintenance={hasMaintenance}
                    isIncomplete={isIncomplete}
                    isRecentlyAffected={isRecentlyAffected}
                    conflicts={roomConflicts}
                  />
                );
              })}
            </SortableContext>
          </div>
        </DndContext>

        {/* Right Panel: Detail (desktop only) */}
        {!isMobile && (
          <div className="flex-1 overflow-y-auto">
            {detailContent}
          </div>
        )}
      </div>

      {/* Mobile: Detail as bottom sheet */}
      {isMobile && (
        <ResponsiveDialog
          open={!!selectedRow}
          onOpenChange={(open) => { if (!open) setSelectedRoomId(null); }}
          title={selectedRow ? `Room ${selectedRow.room_number}` : ''}
        >
          {selectedRow && (
            <AssignmentDetailPanel
              row={selectedRow}
              onSave={handleDetailSave}
              onDelete={(id) => deleteAssignmentMutation.mutate(id)}
              hasIssues={getIssuesForRoom(selectedRow.room_id).length > 0}
              urgentIssues={hasUrgentIssues(selectedRow.room_id)}
              hasMaintenance={selectedRow.court_room_id ? maintenanceSet.has(selectedRow.court_room_id) : false}
            />
          )}
        </ResponsiveDialog>
      )}
    </div>
  );
};
