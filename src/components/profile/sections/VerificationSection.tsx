
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { VerificationHeader } from "./verification/VerificationHeader";
import { BulkActionBar } from "./verification/BulkActionBar";
import { VerificationTable } from "./verification/VerificationTable";
import { VerificationDialogs } from "./verification/components/VerificationDialogs";
import { NoUsersFound } from "./verification/components/NoUsersFound";
import { useVerification } from "./verification/hooks/useVerification";

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
    handleBulkVerification
  } = useVerification();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <VerificationHeader />
      <CardContent>
        {selectedUsers.length > 0 && (
          <BulkActionBar
            selectedCount={selectedUsers.length}
            departments={departments}
            selectedDepartment={selectedDepartment}
            onDepartmentChange={setSelectedDepartment}
            onApprove={() => handleBulkVerification(true)}
            onReject={() => handleBulkVerification(false)}
          />
        )}

        {users?.length === 0 ? (
          <NoUsersFound />
        ) : (
          <VerificationTable
            requests={verificationRequests}
            departments={departments}
            selectedOccupants={selectedUsers}
            selectedDepartment={selectedDepartment}
            onSelectAll={(selected) => {
              const pendingUsers = verificationRequests.filter(u => u.status === 'pending');
              setSelectedUsers(selected ? pendingUsers.map(u => u.id) : []);
            }}
            onSelectOne={(id, selected) => {
              if (selected) {
                setSelectedUsers([...selectedUsers, id]);
              } else {
                setSelectedUsers(selectedUsers.filter(i => i !== id));
              }
            }}
            onDepartmentChange={setSelectedDepartment}
            onVerify={handleVerification}
            onAssignRooms={(userId) => {
              setSelectedUsers([userId]);
              setShowAssignRooms(true);
            }}
            onAssignKeys={(userId) => {
              setSelectedUsers([userId]);
              setShowAssignKeys(true);
            }}
          />
        )}

        <VerificationDialogs
          showAssignRooms={showAssignRooms}
          setShowAssignRooms={setShowAssignRooms}
          showAssignKeys={showAssignKeys}
          setShowAssignKeys={setShowAssignKeys}
          selectedUsers={selectedUsers}
          setSelectedUsers={setSelectedUsers}
        />
      </CardContent>
    </Card>
  );
}
