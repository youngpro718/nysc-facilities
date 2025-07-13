
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IssueDialog } from "@/components/issues/IssueDialog";
import { MobileIssuesList } from "@/components/issues/MobileIssuesList";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { PrimaryRoomWidget } from "@/components/dashboard/PrimaryRoomWidget";
import { QuickIssueReportWidget } from "@/components/dashboard/QuickIssueReportWidget";
import { useAuth } from "@/hooks/useAuth";
import { useEnhancedRoomAssignments } from "@/hooks/dashboard/useEnhancedRoomAssignments";
import type { UserAssignment } from "@/types/dashboard";

const Issues = () => {
  const { user } = useAuth();
  const { assignedRooms } = useEnhancedRoomAssignments(user?.id);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [selectedRoomForIssue, setSelectedRoomForIssue] = useState<UserAssignment | null>(null);
  const [preselectedIssueType, setPreselectedIssueType] = useState<string | undefined>();

  const handleQuickReport = (roomData: UserAssignment, issueType?: string) => {
    setSelectedRoomForIssue(roomData);
    setPreselectedIssueType(issueType);
    setShowIssueForm(true);
  };

  const handleViewIssues = (roomData: UserAssignment) => {
    // TODO: Navigate to room-specific issues view
    console.log('View issues for room:', roomData.room_name);
  };

  const handleIssueFormClose = () => {
    setShowIssueForm(false);
    setSelectedRoomForIssue(null);
    setPreselectedIssueType(undefined);
  };
  
  return (
    <PageContainer>
      <PageHeader 
        title="Issues" 
        description="Manage and track facility issues"
      >
        <Button onClick={() => setShowIssueForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Report Issue
        </Button>
      </PageHeader>

      {/* Enhanced Dashboard Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <PrimaryRoomWidget 
          onQuickReport={handleQuickReport}
          onViewIssues={handleViewIssues}
        />
        <QuickIssueReportWidget 
          onReportIssue={handleQuickReport}
        />
      </div>

      <IssueDialog 
        open={showIssueForm} 
        onOpenChange={handleIssueFormClose}
      />
      
      <MobileIssuesList onCreateIssue={() => setShowIssueForm(true)} />
    </PageContainer>
  );
};

export default Issues;
