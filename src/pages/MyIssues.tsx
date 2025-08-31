import { useState, useEffect } from "react";
import { Plus, AlertCircle, Clock, CheckCircle, Settings } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useUserIssues } from "@/hooks/dashboard/useUserIssues";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { IssueWizard } from "@/components/issues/wizard/IssueWizard";
import { MobileIssueCard } from "@/components/issues/mobile/MobileIssueCard";
import { MobileRequestForm } from "@/components/mobile/MobileRequestForm";

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
  const [isMobile, setIsMobile] = useState(false);
  const { user } = useAuth();
  const { userIssues: issues = [], refetchIssues } = useUserIssues(user?.id);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleIssueCreated = () => {
    setShowIssueWizard(false);
    setShowMobileForm(false);
    refetchIssues();
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

      {showIssueWizard && (
        <IssueWizard
          onSuccess={handleIssueCreated}
          onCancel={() => setShowIssueWizard(false)}
        />
      )}

      <MobileRequestForm 
        open={showMobileForm}
        onClose={() => setShowMobileForm(false)}
        onSubmit={handleIssueCreated}
        type="issue_report"
      />

      {issues.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No issues reported</h3>
            <p className="text-muted-foreground mb-4">
              You haven't reported any issues yet. Help us maintain the facility by reporting problems when you see them.
            </p>
            <Button onClick={() => isMobile ? setShowMobileForm(true) : setShowIssueWizard(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Report Your First Issue
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {isMobile ? (
            // Mobile view with enhanced cards
            issues.map((issue) => (
              <MobileIssueCard
                key={issue.id}
                issue={issue}
                onViewDetails={() => {/* Handle view details */}}
                onAddComment={() => {/* Handle add comment */}}
                onFollowUp={() => {/* Handle follow up */}}
                onEscalate={() => {/* Handle escalate */}}
              />
            ))
          ) : (
            // Desktop view
            issues.map((issue) => {
            const statusConf = statusConfig[issue.status as keyof typeof statusConfig];
            const priorityConf = priorityConfig[issue.priority as keyof typeof priorityConfig];
            const StatusIcon = statusConf?.icon || AlertCircle;
            
            return (
              <Card key={issue.id}>
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
                    <p className="text-sm">{issue.description}</p>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <p>Status: {issue.status}</p>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
                    <span>Reported: {format(new Date(issue.created_at), "MMM d, yyyy 'at' h:mm a")}</span>
                  </div>
                </CardContent>
              </Card>
            );
            })
          )}
        </div>
      )}
    </PageContainer>
  );
}