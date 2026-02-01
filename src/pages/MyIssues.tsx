import { useState } from "react";
import { Plus, AlertCircle, CheckCircle, Settings, ArrowUpCircle } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useUserIssues } from "@/hooks/dashboard/useUserIssues";
import { useOccupantAssignments } from "@/hooks/occupants/useOccupantAssignments";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { SimpleReportWizard } from "@/components/issues/wizard/SimpleReportWizard";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { MobileIssueCard } from "@/components/issues/mobile/MobileIssueCard";
import { MobileRequestForm } from "@/components/mobile/MobileRequestForm";
import { UserIssueDetailDialog } from "@/components/issues/UserIssueDetailDialog";
import { DataState } from "@/ui";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const statusConfig = {
  open: { 
    icon: AlertCircle, 
    label: "Open",
    variant: "destructive" as const
  },
  in_progress: { 
    icon: Settings, 
    label: "In Progress",
    variant: "secondary" as const
  },
  resolved: { 
    icon: CheckCircle, 
    label: "Resolved",
    variant: "default" as const
  },
  closed: { 
    icon: CheckCircle, 
    label: "Closed",
    variant: "outline" as const
  }
};

const priorityConfig = {
  low: { label: "Low", variant: "outline" as const },
  medium: { label: "Medium", variant: "secondary" as const },
  high: { label: "destructive" as const, variant: "destructive" as const },
  urgent: { label: "Urgent", variant: "destructive" as const }
};

export default function MyIssues() {
  const [showIssueWizard, setShowIssueWizard] = useState(false);
  const [showMobileForm, setShowMobileForm] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const { user } = useAuth();
  const { userIssues: issues = [], isLoading, refetchIssues } = useUserIssues(user?.id);
  const { data: occupantData } = useOccupantAssignments(user?.id || '');
  const isMobile = useIsMobile();

  const handleIssueCreated = () => {
    setShowIssueWizard(false);
    setShowMobileForm(false);
    refetchIssues();
  };

  const handleViewDetails = (issueId: string) => {
    setSelectedIssueId(issueId);
  };

  const handleEscalate = async (issueId: string) => {
    try {
      const { error } = await supabase
        .from('issues')
        .update({ priority: 'high' })
        .eq('id', issueId);
      
      if (error) throw error;
      toast.success('Issue escalated to high priority');
      refetchIssues();
      setSelectedIssueId(null);
    } catch (error) {
      toast.error('Failed to escalate issue');
      console.error('Escalate error:', error);
    }
  };

  const handleFollowUp = (issueId: string) => {
    // Open the issue detail with comments tab
    setSelectedIssueId(issueId);
    toast.info('Add a comment to follow up on this issue');
  };

  return (
    <PageContainer>
      <PageHeader 
        title="My Issues" 
        description="Track issues you've reported"
      >
        <Button onClick={() => isMobile ? setShowMobileForm(true) : setShowIssueWizard(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Report Issue
        </Button>
      </PageHeader>

      <ResponsiveDialog open={showIssueWizard} onOpenChange={setShowIssueWizard} title="">
        <SimpleReportWizard
          onSuccess={handleIssueCreated}
          onCancel={() => setShowIssueWizard(false)}
          assignedRooms={occupantData?.roomAssignments || []}
        />
      </ResponsiveDialog>

      <MobileRequestForm 
        open={showMobileForm}
        onClose={() => setShowMobileForm(false)}
        onSubmit={handleIssueCreated}
        type="issue_report"
      />

      <DataState
        data={issues}
        isLoading={isLoading}
        onRetry={refetchIssues}
        loadingSkeleton={{ type: 'list', count: 5 }}
        emptyState={{
          title: 'No issues reported',
          description: "You haven't reported any issues yet. Help us maintain the facility by reporting problems when you see them.",
          icon: <AlertCircle className="h-6 w-6 text-muted-foreground" />,
          action: {
            label: 'Report Your First Issue',
            onClick: () => isMobile ? setShowMobileForm(true) : setShowIssueWizard(true),
          },
        }}
      >
        {(issues) => (
          <div className="space-y-4">
            {isMobile ? (
              // Mobile view with enhanced cards
              issues.map((issue) => (
                <MobileIssueCard
                  key={issue.id}
                  issue={issue}
                  onViewDetails={() => handleViewDetails(issue.id)}
                  onAddComment={() => handleViewDetails(issue.id)}
                  onFollowUp={() => handleFollowUp(issue.id)}
                  onEscalate={() => handleEscalate(issue.id)}
                />
              ))
            ) : (
              // Desktop view
              issues.map((issue) => {
            const statusConf = statusConfig[issue.status as keyof typeof statusConfig];
            const priorityConf = priorityConfig[issue.priority as keyof typeof priorityConfig];
            const StatusIcon = statusConf?.icon || AlertCircle;
            
            return (
              <Card 
                key={issue.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleViewDetails(issue.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg mb-1">{issue.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant={statusConf?.variant || "secondary"}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConf?.label || issue.status}
                        </Badge>
                        <Badge variant={priorityConf?.variant || "outline"}>
                          {priorityConf?.label || issue.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(issue.unified_spaces?.name || issue.buildings?.name) && (
                    <div>
                      <p className="font-medium text-sm text-muted-foreground mb-1">Location</p>
                      <p className="text-sm">
                        {issue.buildings?.name && `${issue.buildings.name}`}
                        {issue.unified_spaces?.name && ` - ${issue.unified_spaces.name}`}
                        {issue.unified_spaces?.room_number && ` (${issue.unified_spaces.room_number})`}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <p className="font-medium text-sm text-muted-foreground mb-1">Description</p>
                    <p className="text-sm line-clamp-2">{issue.description}</p>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
                    <span>Reported: {format(new Date(issue.created_at), "MMM d, yyyy 'at' h:mm a")}</span>
                    <div className="flex gap-2">
                      {issue.status === 'resolved' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleFollowUp(issue.id); }}
                        >
                          Follow Up
                        </Button>
                      )}
                      {['open', 'in_progress'].includes(issue.status) && issue.priority !== 'urgent' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); handleEscalate(issue.id); }}
                        >
                          <ArrowUpCircle className="h-4 w-4 mr-1" />
                          Escalate
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
            })
          )}
          </div>
        )}
      </DataState>

      {/* Issue Detail Dialog */}
      <UserIssueDetailDialog
        issueId={selectedIssueId}
        open={!!selectedIssueId}
        onClose={() => setSelectedIssueId(null)}
        onFollowUp={handleFollowUp}
        onEscalate={handleEscalate}
      />
    </PageContainer>
  );
}