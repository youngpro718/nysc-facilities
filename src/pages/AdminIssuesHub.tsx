import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";

import { IssueGroupingControls } from "@/components/admin-issues/IssueGroupingControls";
import { EnhancedIssuesList } from "@/components/admin-issues/EnhancedIssuesList";
import { IssueAnalyticsPanel } from "@/components/admin-issues/IssueAnalyticsPanel";
import { BulkIssueManager } from "@/components/admin-issues/BulkIssueManager";
import { useAdminIssuesData } from "@/hooks/dashboard/useAdminIssuesData";
import { useBulkUpdateIssueMutation } from "@/components/issues/hooks/mutations/useBulkUpdateIssueMutation";
import { Button } from "@/components/ui/button";
import { Plus, BarChart3, RefreshCw } from "lucide-react";
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

  const bulkUpdateMutation = useBulkUpdateIssueMutation();

  const handleBulkAction = async (action: string, issueIds: string[]) => {
    console.log('Bulk action:', action, 'for issues:', issueIds);
    
    try {
      switch (action) {
        case 'mark_resolved':
          await bulkUpdateMutation.mutateAsync({
            issueIds,
            updates: { status: 'resolved' }
          });
          break;
        case 'mark_in_progress':
          await bulkUpdateMutation.mutateAsync({
            issueIds,
            updates: { status: 'in_progress' }
          });
          break;
        case 'mark_open':
          await bulkUpdateMutation.mutateAsync({
            issueIds,
            updates: { status: 'open' }
          });
          break;
        case 'set_high_priority':
          await bulkUpdateMutation.mutateAsync({
            issueIds,
            updates: { priority: 'high' }
          });
          break;
        case 'set_medium_priority':
          await bulkUpdateMutation.mutateAsync({
            issueIds,
            updates: { priority: 'medium' }
          });
          break;
        case 'set_low_priority':
          await bulkUpdateMutation.mutateAsync({
            issueIds,
            updates: { priority: 'low' }
          });
          break;
        default:
          console.warn('Unknown bulk action:', action);
      }
      
      // Clear selection after successful action
      setSelectedIssues([]);
      refreshData();
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
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
            onClick={() => refreshData()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
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