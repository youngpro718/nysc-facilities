
import { useState } from "react";
import { LoadingState } from "../LoadingState";
import { ErrorState } from "../ErrorState";
import { OccupantHeader } from "../OccupantHeader";
import { OccupantFilters } from "../OccupantFilters";
import { OccupantContent } from "../OccupantContent";
import { OccupantViewToggle } from "../OccupantViewToggle";
import { CreateOccupantDialog } from "../CreateOccupantDialog";
import { EditOccupantDialog } from "../dialogs/EditOccupantDialog";
import { AssignKeysDialog } from "../AssignKeysDialog";
import { AssignRoomsDialog } from "../AssignRoomsDialog";
import { useOccupantList } from "../hooks/useOccupantList";
import { useOccupantDialogs } from "../hooks/useOccupantDialogs";

export function OccupantListView() {
  const [view, setView] = useState<"grid" | "list">("list");
  
  const {
    occupants,
    isLoading,
    isError,
    error,
    refetch,
    searchQuery,
    setSearchQuery,
    departmentFilter,
    setDepartmentFilter,
    statusFilter,
    setStatusFilter,
    expandedRows,
    toggleRow,
    selectedOccupants,
    toggleSelectOccupant,
    handleSelectAll,
    handleBulkStatusUpdate,
    handleDeleteOccupant
  } = useOccupantList();

  const {
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isAssignKeysDialogOpen,
    setIsAssignKeysDialogOpen,
    isAssignRoomsDialogOpen,
    setIsAssignRoomsDialogOpen,
    editingOccupant,
    startEdit
  } = useOccupantDialogs();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <OccupantHeader
          selectedOccupants={selectedOccupants}
          onBulkStatusUpdate={handleBulkStatusUpdate}
          onAssignKeys={() => setIsAssignKeysDialogOpen(true)}
          onAssignRooms={() => setIsAssignRoomsDialogOpen(true)}
          onCreateOccupant={() => setIsCreateDialogOpen(true)}
        />
        <OccupantViewToggle view={view} onViewChange={setView} />
      </div>

      <OccupantFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        departmentFilter={departmentFilter}
        onDepartmentChange={setDepartmentFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
      />

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState error={error as Error} onRetry={refetch} />
      ) : (
        <OccupantContent
          view={view}
          occupants={occupants}
          expandedRows={expandedRows}
          selectedOccupants={selectedOccupants}
          onToggleRow={toggleRow}
          onToggleSelect={toggleSelectOccupant}
          onSelectAll={handleSelectAll}
          onEdit={startEdit}
          onDelete={handleDeleteOccupant}
        />
      )}

      <CreateOccupantDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={refetch}
      />

      <EditOccupantDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        occupant={editingOccupant}
        onSuccess={refetch}
      />

      <AssignKeysDialog
        open={isAssignKeysDialogOpen}
        onOpenChange={setIsAssignKeysDialogOpen}
        selectedOccupants={selectedOccupants}
        onSuccess={refetch}
      />

      <AssignRoomsDialog
        open={isAssignRoomsDialogOpen}
        onOpenChange={setIsAssignRoomsDialogOpen}
        selectedOccupants={selectedOccupants}
        onSuccess={refetch}
      />
    </div>
  );
}
