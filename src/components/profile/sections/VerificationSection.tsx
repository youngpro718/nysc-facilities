
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { VerificationHeader } from "./verification/VerificationHeader";
import { BulkActionBar } from "./verification/BulkActionBar";
import { VerificationTable } from "./verification/VerificationTable";
import { NoUsersFound } from "./verification/components/NoUsersFound";
import { useVerification } from "./verification/hooks/useVerification";
import { PostVerificationBar } from "./verification/components/PostVerificationBar";
import { AssignRoomsDialog } from "@/components/occupants/AssignRoomsDialog";
import { AssignKeysDialog } from "@/components/occupants/AssignKeysDialog";

export function VerificationSection() {
  const [showAssignRooms, setShowAssignRooms] = useState(false);
  const [showAssignKeys, setShowAssignKeys] = useState(false);

  const {
    selectedUsers,
    setSelectedUsers,
    selectedDepartment,
    setSelectedDepartment,
    departments,
    users,
    isLoading,
    verificationRequests,
    handleVerification,
    handleBulkVerification,
    handleToggleAdmin,
    handleDeleteUser,
    clearSelections
  } = useVerification();

  const approvedUsers = selectedUsers.filter(user => 
    verificationRequests.find(r => r.id === user.requestId)?.status === 'approved'
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <VerificationHeader />
      <CardContent>
        {selectedUsers.length > 0 && (
          <>
            <BulkActionBar
              selectedCount={selectedUsers.length}
              departments={departments}
              selectedDepartment={selectedDepartment}
              onDepartmentChange={setSelectedDepartment}
              onApprove={() => handleBulkVerification(true)}
              onReject={() => handleBulkVerification(false)}
            />
            {approvedUsers.length > 0 && (
              <PostVerificationBar
                selectedCount={approvedUsers.length}
                onAssignRooms={() => setShowAssignRooms(true)}
                onAssignKeys={() => setShowAssignKeys(true)}
                className="mt-4"
              />
            )}
          </>
        )}

        {users?.length === 0 ? (
          <NoUsersFound />
        ) : (
          <VerificationTable
            requests={verificationRequests}
            selectedUsers={selectedUsers}
            onSelectAll={(selected) => {
              if (selected) {
                const pendingUsers = verificationRequests
                  .filter(r => r.status === 'pending')
                  .map(r => ({
                    requestId: r.id,
                    userId: r.user_id,
                    name: `${r.profile?.first_name || ''} ${r.profile?.last_name || ''}`.trim()
                  }));
                setSelectedUsers(pendingUsers);
              } else {
                setSelectedUsers([]);
              }
            }}
            onSelectOne={(requestId, userId, name, selected) => {
              if (selected) {
                setSelectedUsers([...selectedUsers, { requestId, userId, name }]);
              } else {
                setSelectedUsers(selectedUsers.filter(u => u.requestId !== requestId));
              }
            }}
            onVerify={handleVerification}
            onAssignRooms={() => setShowAssignRooms(true)}
            onAssignKeys={() => setShowAssignKeys(true)}
            onToggleAdmin={handleToggleAdmin}
            onDeleteUser={handleDeleteUser}
          />
        )}

        <AssignRoomsDialog
          open={showAssignRooms}
          onOpenChange={setShowAssignRooms}
          selectedOccupants={approvedUsers.map(u => u.userId)}
          onSuccess={() => {
            setShowAssignRooms(false);
          }}
        />

        <AssignKeysDialog
          open={showAssignKeys}
          onOpenChange={setShowAssignKeys}
          selectedOccupants={approvedUsers.map(u => u.userId)}
          onSuccess={() => {
            setShowAssignKeys(false);
          }}
        />
      </CardContent>
    </Card>
  );
}
