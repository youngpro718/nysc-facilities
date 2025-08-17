import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Save, X, Filter, Download, GripVertical, AlertTriangle, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRealtime } from "@/hooks/useRealtime";
import { useCourtPersonnel } from "@/hooks/useCourtPersonnel";
import { useCourtIssuesIntegration } from "@/hooks/useCourtIssuesIntegration";
import { PersonnelSelector } from "./PersonnelSelector";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  urgentIssues
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
        return (
          <div className="flex items-center gap-2">
            <Select value={editingValue as string} onValueChange={setEditingValue}>
              <SelectTrigger className="h-8 w-32">
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50">
                <SelectItem value="Monday">Monday</SelectItem>
                <SelectItem value="Tuesday">Tuesday</SelectItem>
                <SelectItem value="Wednesday">Wednesday</SelectItem>
                <SelectItem value="Thursday">Thursday</SelectItem>
                <SelectItem value="Friday">Friday</SelectItem>
              </SelectContent>
            </Select>
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
          displayValue || (
            <span className="text-muted-foreground italic">Click to add</span>
          )
        )}
      </div>
    );
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b hover:bg-muted/50 ${urgentIssues ? 'bg-red-50 border-red-200' : hasIssues ? 'bg-yellow-50 border-yellow-200' : ''}`}
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
              {hasIssues && !urgentIssues && (
                <div title="Issues reported in this courtroom">
                  <Bell className="h-4 w-4 text-yellow-500" />
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
        {renderEditableCell("justice", row.justice || "")}
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
        <Badge variant={row.assignment_id ? "default" : "secondary"}>
          {row.assignment_id ? "Assigned" : "Available"}
        </Badge>
      </td>
      <td className="p-2">
        <div className="flex items-center gap-2">
          {row.assignment_id && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(row.assignment_id!)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
};

export const EnhancedCourtAssignmentTable = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editingValue, setEditingValue] = useState<string | string[]>("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Use our custom hooks
  const { personnel, isLoading: personnelLoading } = useCourtPersonnel();
  const { 
    courtIssues, 
    getIssuesForRoom, 
    hasUrgentIssues, 
    getCourtImpactSummary 
  } = useCourtIssuesIntegration();

  // Get impact summary
  const impactSummary = getCourtImpactSummary();

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Mutation for updating assignments
  const updateAssignmentMutation = useMutation({
    mutationFn: async ({ roomId, field, value }: { roomId: string; field: string; value: string | string[] }) => {
      console.log('🔄 Saving assignment:', { roomId, field, value });
      const existingAssignment = assignments?.find(row => row.room_id === roomId);
      console.log('📋 Existing assignment:', existingAssignment);
      
      if (existingAssignment?.assignment_id) {
        // Update existing assignment
        const updateData: any = { [field]: value };
        console.log('✏️ Updating existing assignment:', updateData);
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
        const insertData: any = {
          room_id: existingAssignment?.room_id || roomId,
          room_number: existingAssignment?.room_number || "",
          [field]: value,
          sort_order: maxSort + 1
        };
        console.log('➕ Creating new assignment:', insertData);
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
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete assignment: " + error.message,
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
        if (assignment.assignment_id) {
          await supabase
            .from('court_assignments')
            .update({ sort_order: index + 1 })
            .eq('id', assignment.assignment_id);
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
          courtroom_number
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

      // Create a map of assignments by room_id (authoritative key)
      const assignmentMap = new Map();
      assignmentsData?.forEach(assignment => {
        assignmentMap.set(assignment.room_id, assignment);
      });

      const mappedData = (roomsData || []).map((room, index) => {
        const assignment = assignmentMap.get(room.room_id);
        return {
          room_id: room.room_id,
          room_number: room.room_number,
          courtroom_number: room.courtroom_number,
          assignment_id: assignment?.id || null,
          part: assignment?.part || null,
          justice: assignment?.justice || null,
          clerks: assignment?.clerks ? assignment.clerks.filter((clerk: string) => 
            clerk !== 'CHRISTOPHER DISANTO ESQ' && clerk !== 'LISABETTA GARCIA'
          ) : null,
          sergeant: assignment?.sergeant || null,
          tel: assignment?.tel || null,
          fax: assignment?.fax || null,
          calendar_day: assignment?.calendar_day || null,
          is_active: true, // Default to active
          sort_order: assignment?.sort_order ?? index + 1,
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
      {/* Impact Summary Alert */}
      {impactSummary && impactSummary.totalAffectedRooms > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Court Operations Alert:</strong> {impactSummary.totalAffectedRooms} courtroom(s) affected by issues
            {impactSummary.urgentIssues > 0 && `, including ${impactSummary.urgentIssues} urgent issue(s)`}.
            {impactSummary.affectedAssignments > 0 && ` ${impactSummary.affectedAssignments} assignment(s) may be impacted.`}
          </AlertDescription>
        </Alert>
      )}

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
              <th className="p-3 text-left font-medium">Actions</th>
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

              return (
                <SortableRow
                  key={row.room_id}
                  row={row}
                  onEdit={(rowId, field, currentValue) => {
                    setEditingCell({ rowId, field });
                    setEditingValue(currentValue);
                  }}
                  editingCell={editingCell}
                  editingValue={editingValue}
                  setEditingValue={setEditingValue}
                  onSave={() => {
                    console.log('💾 Save button clicked:', { editingCell, editingValue });
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
                      console.log('⏎ Enter key pressed:', { editingCell, editingValue });
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
                />
              );
            })}
            </tbody>
          </SortableContext>
          </table>
        </div>
      </DndContext>
    </div>
  );
};
