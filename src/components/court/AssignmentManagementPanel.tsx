import { CourtAssignmentTable } from "./CourtAssignmentTable";

export const AssignmentManagementPanel = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Assignment Management</h2>
        <p className="text-muted-foreground">Manage court assignments with inline editing</p>
      </div>

      {/* Main Table */}
      <CourtAssignmentTable />
    </div>
  );
};