import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DataTable } from "@/components/data-display/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, Save, X, Edit, Filter, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRealtime } from "@/hooks/useRealtime";

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
}

interface EditingCell {
  rowId: string;
  field: string;
}

export const CourtAssignmentTable = () => {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const [filterValue, setFilterValue] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

      // Get all court assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from("court_assignments")
        .select("id, room_id, part, justice, clerks, sergeant, tel, fax, calendar_day");

      if (assignmentsError) throw assignmentsError;

      // Define court part ordering based on the provided document
      const getPartOrder = (part: string | null): number => {
        if (!part) return 9999; // Unassigned parts go to the end
        
        // Handle multiple parts by taking the first one for ordering
        const firstPart = part.split(',')[0].trim();
        
        const partOrderMap: { [key: string]: number } = {
          'TAP A': 1, 'TAP G': 2, 'GWP1': 3, 'TAP B': 4,
          'AT1 21': 5, '1': 6, '22 W': 7, '23 W': 8, '32 W': 9,
          '37': 10, '41 Th': 11, '42 W': 12, '51 Th': 13, '53': 14,
          '54': 15, '59': 16, '59M': 17, '59M W': 18, '61 T': 19,
          '62 Th': 20, '66': 21, '71 M': 22, '72': 23, '73': 24,
          '75': 25, '77': 26, '81 M': 27, '85': 28, 'MDC-92': 29,
          '93 T': 30, '94 Post Judgment': 31, '95': 32, '99': 33,
          'IDV': 34, 'N-SCT': 35, '1A Post Judgment': 36
        };
        
        return partOrderMap[firstPart] || 1000; // Unknown parts go near the end
      };

      // Join the data manually and sort by court part order
      const result = courtRooms.map((room: any) => {
        const assignment = assignments?.find((a: any) => a.room_id === room.room_id);
        
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
        };
      }) as CourtAssignmentRow[];

      // Sort by part order first, then by room number
      return result.sort((a, b) => {
        const aPartOrder = getPartOrder(a.part);
        const bPartOrder = getPartOrder(b.part);
        
        if (aPartOrder !== bPartOrder) {
          return aPartOrder - bPartOrder;
        }
        
        // If same part order (or both unassigned), sort by room number
        return a.room_number.localeCompare(b.room_number);
      });
    },
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: async ({ roomId, field, value }: { roomId: string; field: string; value: string }) => {
      const existingAssignment = courtAssignments?.find(row => row.room_id === roomId);
      
      if (existingAssignment?.assignment_id) {
        // Update existing assignment
        const updateData: any = { [field]: field === 'clerks' ? value.split(',').map(c => c.trim()) : value };
        const { error } = await supabase
          .from("court_assignments")
          .update(updateData)
          .eq("id", existingAssignment.assignment_id);
        if (error) throw error;
      } else {
        // Create new assignment
        const insertData: any = {
          room_id: roomId,
          room_number: existingAssignment?.room_number || "",
          [field]: field === 'clerks' ? value.split(',').map(c => c.trim()) : value
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

  const handleCellEdit = (rowId: string, field: string, currentValue: string) => {
    setEditingCell({ rowId, field });
    setEditingValue(currentValue || "");
  };

  const handleSave = async () => {
    if (!editingCell) return;
    
    await updateAssignmentMutation.mutateAsync({
      roomId: editingCell.rowId,
      field: editingCell.field,
      value: editingValue,
    });
  };

  const handleCancel = () => {
    setEditingCell(null);
    setEditingValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const filteredData = courtAssignments?.filter(row =>
    row.room_number.toLowerCase().includes(filterValue.toLowerCase()) ||
    row.justice?.toLowerCase().includes(filterValue.toLowerCase()) ||
    row.part?.toLowerCase().includes(filterValue.toLowerCase())
  );

  const renderEditableCell = (row: CourtAssignmentRow, field: keyof CourtAssignmentRow, displayValue: string) => {
    const isEditing = editingCell?.rowId === row.room_id && editingCell?.field === field;
    
    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          <Input
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8"
            autoFocus
          />
          <Button size="sm" variant="ghost" onClick={handleSave}>
            <Save className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancel}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    return (
      <div 
        className="cursor-pointer hover:bg-muted/50 p-1 rounded min-h-[32px] flex items-center"
        onClick={() => handleCellEdit(row.room_id, field as string, displayValue)}
      >
        {displayValue || (
          <span className="text-muted-foreground italic">Click to add</span>
        )}
      </div>
    );
  };

  const columns = [
    {
      id: "room_number",
      header: "Room",
      cell: (row: CourtAssignmentRow) => (
        <div className="font-medium">
          {row.room_number}
          {row.courtroom_number && (
            <div className="text-sm text-muted-foreground">
              Court {row.courtroom_number}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "part",
      header: "Part",
      cell: (row: CourtAssignmentRow) => renderEditableCell(row, "part", row.part || ""),
    },
    {
      id: "justice",
      header: "Justice",
      cell: (row: CourtAssignmentRow) => renderEditableCell(row, "justice", row.justice || ""),
    },
    {
      id: "clerks",
      header: "Clerks",
      cell: (row: CourtAssignmentRow) => {
        const clerksStr = row.clerks?.join(", ") || "";
        return renderEditableCell(row, "clerks", clerksStr);
      },
    },
    {
      id: "sergeant",
      header: "Sergeant",
      cell: (row: CourtAssignmentRow) => renderEditableCell(row, "sergeant", row.sergeant || ""),
    },
    {
      id: "tel",
      header: "Phone",
      cell: (row: CourtAssignmentRow) => renderEditableCell(row, "tel", row.tel || ""),
    },
    {
      id: "fax",
      header: "Fax",
      cell: (row: CourtAssignmentRow) => renderEditableCell(row, "fax", row.fax || ""),
    },
    {
      id: "calendar_day",
      header: "Calendar Day",
      cell: (row: CourtAssignmentRow) => renderEditableCell(row, "calendar_day", row.calendar_day || ""),
    },
    {
      id: "status",
      header: "Status",
      cell: (row: CourtAssignmentRow) => (
        <Badge variant={row.assignment_id ? "default" : "secondary"}>
          {row.assignment_id ? "Assigned" : "Available"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: (row: CourtAssignmentRow) => (
        <div className="flex gap-1">
          {row.assignment_id && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => deleteAssignmentMutation.mutate(row.assignment_id!)}
              className="h-8 w-8 p-0 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      ),
    },
  ];

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
          <div className="text-2xl font-bold">{courtAssignments?.length || 0}</div>
          <div className="text-sm text-muted-foreground">Total Courtrooms</div>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-2xl font-bold">
            {courtAssignments?.filter(row => row.assignment_id).length || 0}
          </div>
          <div className="text-sm text-muted-foreground">Assigned</div>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-2xl font-bold">
            {courtAssignments?.filter(row => !row.assignment_id).length || 0}
          </div>
          <div className="text-sm text-muted-foreground">Available</div>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-2xl font-bold">
            {new Set(courtAssignments?.filter(row => row.justice).map(row => row.justice)).size || 0}
          </div>
          <div className="text-sm text-muted-foreground">Unique Justices</div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-muted/50 p-4 rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Instructions:</strong> Click on any cell to edit. Press Enter to save or Escape to cancel. 
          Multiple clerks should be separated by commas.
        </p>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredData || []}
        emptyMessage="No courtrooms found"
        isLoading={isLoading}
        className="border rounded-lg"
      />
    </div>
  );
};