import { useState, useEffect } from "react";
import { logger } from '@/lib/logger';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Save, X, Filter, Download, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRealtime } from "@/hooks/useRealtime";
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
  onEdit: (rowId: string, field: string, currentValue: string) => void;
  editingCell: EditingCell | null;
  editingValue: string;
  setEditingValue: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onDelete: (assignmentId: string) => void;
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
  onDelete 
}: SortableRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: row.room_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const renderEditableCell = (field: keyof CourtAssignmentRow, displayValue: string) => {
    const isEditing = editingCell?.rowId === row.room_id && editingCell?.field === field;
    
    if (isEditing) {
      // Special handling for calendar_day field
      if (field === 'calendar_day') {
        return (
          <div className="flex items-center gap-2">
            <Select value={editingValue} onValueChange={setEditingValue}>
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
      
      return (
        <div className="flex items-center gap-2">
          <Input
            value={editingValue}
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

    return (
      <div 
        className="cursor-pointer hover:bg-muted/50 p-2 rounded min-h-[32px] flex items-center"
        onClick={() => onEdit(row.room_id, field as string, displayValue)}
      >
        {displayValue || (
          <span className="text-muted-foreground italic">Click to add</span>
        )}
      </div>
    );
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="border-b hover:bg-muted/50"
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
            {row.room_number}
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
        {renderEditableCell("clerks", row.clerks?.join(", ") || "")}
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
        <div className="flex gap-1">
          {row.assignment_id && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(row.assignment_id!)}
              className="h-8 w-8 p-0 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
};

export const CourtAssignmentTable = () => {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const [filterValue, setFilterValue] = useState("");
  const [sortedData, setSortedData] = useState<CourtAssignmentRow[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Real-time updates
  useRealtime({
    table: "court_assignments",
    queryKeys: ["court-assignments-table"],
    showToasts: true,
  });

  useRealtime({
    table: "court_rooms",
    queryKeys: ["court-assignments-table"],
    showToasts: false,
  });

  const { data: courtAssignments, isLoading } = useQuery({
    queryKey: ["court-assignments-table"],
    queryFn: async () => {
      // Get all court rooms
      const { data: courtRooms, error: roomsError } = await supabase
        .from("court_rooms")
        .select("room_id, room_number, courtroom_number, is_active")
        .eq("is_active", true)
        .order("room_number");

      if (roomsError) throw roomsError;

      // Get all court assignments with sort_order
      const { data: assignments, error: assignmentsError } = await supabase
        .from("court_assignments")
        .select("id, room_id, part, justice, clerks, sergeant, tel, fax, calendar_day, sort_order");

      if (assignmentsError) throw assignmentsError;

      // Join the data manually
      const result = courtRooms.map((room: Record<string, unknown>) => {
        const assignment = assignments?.find((a: Record<string, unknown>) => a.room_id === room.room_id);
        
        return {
          room_id: room.room_id,
          room_number: room.room_number,
          courtroom_number: room.courtroom_number,
          assignment_id: assignment?.id || null,
          part: assignment?.part || null,
          justice: assignment?.justice || null,
          clerks: assignment?.clerks || null,
          sergeant: assignment?.sergeant || null,
          tel: assignment?.tel || null,
          fax: assignment?.fax || null,
          calendar_day: assignment?.calendar_day || null,
          is_active: room.is_active,
          sort_order: assignment?.sort_order || 0,
        };
      }) as CourtAssignmentRow[];

      // Sort by custom sort_order if available, otherwise by room number
      return result.sort((a, b) => {
        if (a.sort_order > 0 && b.sort_order > 0) {
          return a.sort_order - b.sort_order;
        }
        return a.room_number.localeCompare(b.room_number);
      });
    },
  });

  // Update local sorted data when query data changes
  useEffect(() => {
    if (courtAssignments) {
      setSortedData(courtAssignments);
    }
  }, [courtAssignments]);

  const updateSortOrderMutation = useMutation({
    mutationFn: async (updates: (
      { id: string; sort_order: number } | 
      { room_id: string; room_number: string; sort_order: number; isNew: true }
    )[]) => {
      for (const update of updates) {
        if ('isNew' in update) {
          // Create new assignment for unassigned room to store sort order
          const { error } = await supabase
            .from("court_assignments")
            .insert({ 
              room_id: update.room_id, 
              room_number: update.room_number, 
              sort_order: update.sort_order 
            });
          if (error) throw error;
        } else {
          // Update existing assignment
          const { error } = await supabase
            .from("court_assignments")
            .update({ sort_order: update.sort_order })
            .eq("id", update.id);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["court-assignments-table"] });
      toast({
        title: "Order updated",
        description: "Court assignment order has been updated.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update order: " + error.message,
      });
    },
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: async ({ roomId, field, value }: { roomId: string; field: string; value: string }) => {
      const existingAssignment = sortedData?.find(row => row.room_id === roomId);
      
      if (existingAssignment?.assignment_id) {
        // Update existing assignment
        const updateData: Record<string, unknown> = { [field]: field === 'clerks' ? value.split(',').map(c => c.trim()) : value };
        const { error } = await supabase
          .from("court_assignments")
          .update(updateData)
          .eq("id", existingAssignment.assignment_id);
        if (error) throw error;
      } else {
        // Create new assignment
        const insertData: Record<string, unknown> = {
          room_id: roomId,
          room_number: existingAssignment?.room_number || "",
          [field]: field === 'clerks' ? value.split(',').map(c => c.trim()) : value,
          sort_order: sortedData.length + 1
        };
        const { error } = await supabase
          .from("court_assignments")
          .insert(insertData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["court-assignments-table"] });
      setEditingCell(null);
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

  const deleteAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from("court_assignments")
        .delete()
        .eq("id", assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["court-assignments-table"] });
      toast({
        title: "Assignment deleted",
        description: "Court assignment has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete assignment: " + error.message,
      });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = sortedData.findIndex(item => item.room_id === active.id);
      const newIndex = sortedData.findIndex(item => item.room_id === over?.id);

      const newData = arrayMove(sortedData, oldIndex, newIndex);
      setSortedData(newData);

      // Update sort orders in database for all rows
      const updates = newData.map((row, index) => {
        if (row.assignment_id) {
          // Update existing assignment
          return { id: row.assignment_id, sort_order: index + 1 };
        } else {
          // Create assignment for unassigned rooms to store sort order
          return { 
            room_id: row.room_id, 
            room_number: row.room_number, 
            sort_order: index + 1,
            isNew: true as const
          };
        }
      });

      updateSortOrderMutation.mutate(updates);
    }
  };

  const handleCellEdit = (rowId: string, field: string, currentValue: string) => {
    setEditingCell({ rowId, field });
    setEditingValue(currentValue || "");
  };

  const handleSave = async () => {
    if (!editingCell) return;
    
    try {
      await updateAssignmentMutation.mutateAsync({
        roomId: editingCell.rowId,
        field: editingCell.field,
        value: editingValue,
      });
      
      // Clear editing state after successful save
      setEditingCell(null);
      setEditingValue("");
    } catch (error) {
      logger.error('Error saving assignment:', error);
      // Keep editing state on error so user can retry
    }
  };

  const handleCancel = () => {
    setEditingCell(null);
    setEditingValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    }
  };

  const filteredData = sortedData?.filter(row =>
    row.room_number.toLowerCase().includes(filterValue.toLowerCase()) ||
    row.justice?.toLowerCase().includes(filterValue.toLowerCase()) ||
    row.part?.toLowerCase().includes(filterValue.toLowerCase())
  );

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading court assignments...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filter by room, justice, or part..."
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              className="pl-9 w-80"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-2xl font-bold">{sortedData?.length || 0}</div>
          <div className="text-sm text-muted-foreground">Total Courtrooms</div>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-2xl font-bold">
            {sortedData?.filter(row => row.assignment_id).length || 0}
          </div>
          <div className="text-sm text-muted-foreground">Assigned</div>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-2xl font-bold">
            {sortedData?.filter(row => !row.assignment_id).length || 0}
          </div>
          <div className="text-sm text-muted-foreground">Available</div>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-2xl font-bold">
            {new Set(sortedData?.filter(row => row.justice).map(row => row.justice)).size || 0}
          </div>
          <div className="text-sm text-muted-foreground">Unique Justices</div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-muted/50 p-4 rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Instructions:</strong> Drag the grip handle to reorder rows. Click on any cell to edit. 
          Press Enter to save or Escape to cancel. Multiple clerks should be separated by commas.
        </p>
      </div>

      {/* Draggable Table */}
      <div className="border rounded-lg overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
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
            <tbody>
              <SortableContext
                items={filteredData?.map(row => row.room_id) || []}
                strategy={verticalListSortingStrategy}
              >
                {filteredData?.map((row) => (
                  <SortableRow
                    key={row.room_id}
                    row={row}
                    onEdit={handleCellEdit}
                    editingCell={editingCell}
                    editingValue={editingValue}
                    setEditingValue={setEditingValue}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    onKeyDown={handleKeyDown}
                    onDelete={deleteAssignmentMutation.mutate}
                  />
                ))}
              </SortableContext>
            </tbody>
          </table>
        </DndContext>
      </div>
    </div>
  );
};