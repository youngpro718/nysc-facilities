
import { Card, CardContent } from "@/components/ui/card";
import { VerificationHeader } from "./VerificationHeader";
import { BulkActionBar } from "./BulkActionBar";
import { VerificationTable } from "./VerificationTable";
import { NoUsersFound } from "./components/NoUsersFound";
import { useVerification } from "./hooks/useVerification";

export function VerificationSection() {
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
            onToggleAdmin={handleToggleAdmin}
            onDeleteUser={handleDeleteUser}
          />
        )}
      </CardContent>
    </Card>
  );
}
