
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { VerificationHeader } from "./VerificationHeader";
import { BulkActionBar } from "./BulkActionBar";
import { VerificationTable } from "./VerificationTable";
import { VerificationDialogs } from "./components/VerificationDialogs";
import { NoUsersFound } from "./components/NoUsersFound";
import { useVerification } from "./hooks/useVerification";

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
  } = useVerification();

  const handleSelectAll = (selected: boolean) => {
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
  };

  const handleSelectOne = (requestId: string, userId: string, name: string, selected: boolean) => {
    if (selected) {
      setSelectedUsers([...selectedUsers, { requestId, userId, name }]);
    } else {
      setSelectedUsers(selectedUsers.filter(u => u.requestId !== requestId));
    }
  };

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
            selectedUsers={selectedUsers}
            onSelectAll={handleSelectAll}
            onSelectOne={handleSelectOne}
            onVerify={handleVerification}
            onAssignRooms={(userId) => {
              setSelectedUsers([{
                userId,
                requestId: verificationRequests.find(r => r.user_id === userId)?.id || '',
                name: ''
              }]);
              setShowAssignRooms(true);
            }}
            onAssignKeys={(userId) => {
              setSelectedUsers([{
                userId,
                requestId: verificationRequests.find(r => r.user_id === userId)?.id || '',
                name: ''
              }]);
              setShowAssignKeys(true);
            }}
            onToggleAdmin={handleToggleAdmin}
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
