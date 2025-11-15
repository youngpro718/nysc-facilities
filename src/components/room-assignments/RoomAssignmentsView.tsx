import { useState } from "react";
import { Plus, Download, Upload, Filter, UserPlus, BarChart3, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RoomAssignmentsTable } from "./RoomAssignmentsTable";
import { RoomAssignmentFilters } from "./RoomAssignmentFilters";
import { RoomAssignmentStats } from "./RoomAssignmentStats";
import { AssignRoomBulkDialog } from "./AssignRoomBulkDialog";
import { CreateAssignmentDialog } from "./CreateAssignmentDialog";
import { ReassignmentDialog } from "./ReassignmentDialog";
import { BulkOperationsDialog } from "./BulkOperationsDialog";
import { ExportImportDialog } from "./ExportImportDialog";
import { RoomAssignmentAnalytics } from "./RoomAssignmentAnalytics";
import { RealTimeUpdates } from "./RealTimeUpdates";
import { useRoomAssignmentsList } from "./hooks/useRoomAssignmentsList";
import { RoomAssignmentWithDetails } from "./hooks/useRoomAssignmentsList";

export function RoomAssignmentsView() {
  const [activeTab, setActiveTab] = useState("assignments");
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkAssignDialog, setShowBulkAssignDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [showBulkOperationsDialog, setShowBulkOperationsDialog] = useState(false);
  const [showExportImportDialog, setShowExportImportDialog] = useState(false);
  const [assignmentToReassign, setAssignmentToReassign] = useState<RoomAssignmentWithDetails | null>(null);

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
    handleDeleteAssignment,
    handleUpdateAssignment,
  } = useRoomAssignmentsList();

  const handleReassign = (assignment: RoomAssignmentWithDetails) => {
    setAssignmentToReassign(assignment);
    setShowReassignDialog(true);
  };

  return (
    <div className="space-y-6 xl:space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between xl:px-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Room Assignments</h1>
          <p className="text-muted-foreground">
            Comprehensive management of all room assignments across occupants
          </p>
        </div>
        <div className="flex items-center gap-3 xl:gap-4">
          <RealTimeUpdates onUpdateReceived={refetch} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button 
            onClick={() => setShowCreateDialog(true)}
            size="sm"
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Create
          </Button>
          <Button onClick={() => setShowBulkAssignDialog(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Bulk Assign
          </Button>
          {selectedAssignments.length > 0 && (
            <Button 
              onClick={() => setShowBulkOperationsDialog(true)} 
              size="sm"
              variant="outline"
            >
              <Settings className="h-4 w-4 mr-2" />
              Bulk Ops ({selectedAssignments.length})
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowExportImportDialog(true)}
          >
            <Download className="h-4 w-4 mr-2" />
            Export/Import
          </Button>
        </div>
      </div>

      {/* Stats */}
      <RoomAssignmentStats assignments={assignments} />

      {/* Filters */}
      {showFilters && (
        <Card className="p-4 xl:p-6">
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

      {/* Main Content with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="mt-6">
          <RoomAssignmentsTable
            assignments={assignments}
            isLoading={isLoading}
            error={error}
            selectedAssignments={selectedAssignments}
            onToggleSelect={toggleSelectAssignment}
            onSelectAll={handleSelectAll}
            onUpdateAssignment={handleUpdateAssignment}
            onDeleteAssignment={handleDeleteAssignment}
            onReassign={handleReassign}
            onBulkDelete={handleBulkDelete}
            onRefresh={refetch}
          />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <RoomAssignmentAnalytics assignments={assignments || []} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateAssignmentDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={refetch}
      />
      
      <AssignRoomBulkDialog
        open={showBulkAssignDialog}
        onOpenChange={setShowBulkAssignDialog}
        onSuccess={refetch}
      />

      <ReassignmentDialog
        open={showReassignDialog}
        onOpenChange={setShowReassignDialog}
        assignment={assignmentToReassign}
        onSuccess={refetch}
      />

      <BulkOperationsDialog
        isOpen={showBulkOperationsDialog}
        onClose={() => setShowBulkOperationsDialog(false)}
        selectedAssignments={selectedAssignments}
        assignments={assignments || []}
        onSuccess={refetch}
      />

      <ExportImportDialog
        isOpen={showExportImportDialog}
        onClose={() => setShowExportImportDialog(false)}
        assignments={assignments || []}
        onImportSuccess={refetch}
      />
    </div>
  );
}