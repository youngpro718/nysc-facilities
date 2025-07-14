import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";

import { IssueGroupingControls } from "@/components/admin-issues/IssueGroupingControls";
import { EnhancedIssuesList } from "@/components/admin-issues/EnhancedIssuesList";
import { IssueAnalyticsPanel } from "@/components/admin-issues/IssueAnalyticsPanel";
import { BulkIssueManager } from "@/components/admin-issues/BulkIssueManager";
import { useAdminIssuesData } from "@/hooks/dashboard/useAdminIssuesData";
import { Button } from "@/components/ui/button";
import { Plus, BarChart3 } from "lucide-react";
import { IssueDialog } from "@/components/issues/IssueDialog";

export type GroupingMode = 'priority' | 'room' | 'date' | 'reporter' | 'status';
export type ViewMode = 'cards' | 'table' | 'timeline';

const AdminIssuesHub = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [groupingMode, setGroupingMode] = useState<GroupingMode>('priority');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const {
    allIssues,
    criticalIssues,
    issueStats,
    isLoading,
    refreshData
  } = useAdminIssuesData();

  const handleBulkAction = (action: string, issueIds: string[]) => {
    // Handle bulk actions (update status, assign, etc.)
    console.log('Bulk action:', action, 'for issues:', issueIds);
    refreshData();
  };

  const handleIssueUpdate = () => {
    refreshData();
    setSelectedIssues([]);
  };

  return (
    <PageContainer>
      <PageHeader 
        title="Issues Management Hub" 
        description="Central command center for all facility issues"
      >
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowAnalytics(!showAnalytics)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            {showAnalytics ? 'Hide' : 'Show'} Analytics
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Issue
          </Button>
        </div>
      </PageHeader>


      {/* Analytics Panel */}
      {showAnalytics && (
        <IssueAnalyticsPanel 
          stats={issueStats}
          onClose={() => setShowAnalytics(false)}
        />
      )}

      {/* Grouping and View Controls */}
      <IssueGroupingControls
        groupingMode={groupingMode}
        viewMode={viewMode}
        onGroupingChange={setGroupingMode}
        onViewModeChange={setViewMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalIssues={allIssues.length}
        selectedCount={selectedIssues.length}
      />

      {/* Bulk Management Tools */}
      {selectedIssues.length > 0 && (
        <BulkIssueManager
          selectedIssues={selectedIssues}
          onBulkAction={handleBulkAction}
          onClearSelection={() => setSelectedIssues([])}
        />
      )}

      {/* Enhanced Issues List */}
      <EnhancedIssuesList
        issues={allIssues}
        groupingMode={groupingMode}
        viewMode={viewMode}
        searchQuery={searchQuery}
        selectedIssues={selectedIssues}
        onSelectionChange={setSelectedIssues}
        onIssueUpdate={handleIssueUpdate}
        isLoading={isLoading}
      />

      {/* Create Issue Dialog */}
      <IssueDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleIssueUpdate}
      />
    </PageContainer>
  );
};

export default AdminIssuesHub;