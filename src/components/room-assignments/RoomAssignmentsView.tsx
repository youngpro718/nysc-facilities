import { useState } from "react";
import { Plus, Download, Upload, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RoomAssignmentsTable } from "./RoomAssignmentsTable";
import { RoomAssignmentFilters } from "./RoomAssignmentFilters";
import { RoomAssignmentStats } from "./RoomAssignmentStats";
import { AssignRoomBulkDialog } from "./AssignRoomBulkDialog";
import { useRoomAssignmentsList } from "./hooks/useRoomAssignmentsList";

export function RoomAssignmentsView() {
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkAssignDialog, setShowBulkAssignDialog] = useState(false);

  const {
    assignments,
    isLoading,
    error,
    refetch,
    searchQuery,
    setSearchQuery,
    departmentFilter,
    setDepartmentFilter,
    assignmentTypeFilter,
    setAssignmentTypeFilter,
    statusFilter,
    setStatusFilter,
    selectedAssignments,
    toggleSelectAssignment,
    handleSelectAll,
    handleBulkDelete,
    handleUpdateAssignment
  } = useRoomAssignmentsList();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Room Assignments</h1>
          <p className="text-muted-foreground">
            Comprehensive management of all room assignments across occupants
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button onClick={() => setShowBulkAssignDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Bulk Assign
          </Button>
        </div>
      </div>

      {/* Stats */}
      <RoomAssignmentStats assignments={assignments} />

      {/* Filters */}
      {showFilters && (
        <Card className="p-4">
          <RoomAssignmentFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            departmentFilter={departmentFilter}
            onDepartmentChange={setDepartmentFilter}
            assignmentTypeFilter={assignmentTypeFilter}
            onAssignmentTypeChange={setAssignmentTypeFilter}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
          />
        </Card>
      )}

      {/* Main Content */}
      <RoomAssignmentsTable
        assignments={assignments}
        isLoading={isLoading}
        error={error}
        selectedAssignments={selectedAssignments}
        onToggleSelect={toggleSelectAssignment}
        onSelectAll={handleSelectAll}
        onUpdateAssignment={handleUpdateAssignment}
        onBulkDelete={handleBulkDelete}
        onRefresh={refetch}
      />

      {/* Dialogs */}
      <AssignRoomBulkDialog
        open={showBulkAssignDialog}
        onOpenChange={setShowBulkAssignDialog}
        onSuccess={refetch}
      />
    </div>
  );
}