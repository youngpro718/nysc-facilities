import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  Zap, 
  Calendar, 
  ClipboardList, 
  Users, 
  Download,
  RotateCcw,
  Settings
} from "lucide-react";

interface QuickActionsPanel {
  onAction: (action: string) => void;
  needsAttentionCount?: number;
  scheduledMaintenanceCount?: number;
  overdueInspectionsCount?: number;
}

export function QuickActionsPanel({ 
  onAction, 
  needsAttentionCount = 0, 
  scheduledMaintenanceCount = 0,
  overdueInspectionsCount = 0 
}: QuickActionsPanel) {
  const actions = [
    {
      id: 'needs-attention',
      title: 'What Needs Attention?',
      description: 'Priority queue for immediate action',
      icon: AlertTriangle,
      variant: 'destructive' as const,
      count: needsAttentionCount,
      urgent: needsAttentionCount > 0
    },
    {
      id: 'report-multiple',
      title: 'Report Multiple Issues',
      description: 'Walk-through inspection mode',
      icon: ClipboardList,
      variant: 'default' as const
    },
    {
      id: 'bulk-update',
      title: 'Bulk Status Update',
      description: 'Mark multiple fixtures as fixed',
      icon: RotateCcw,
      variant: 'default' as const
    },
    {
      id: 'schedule-maintenance',
      title: 'Schedule Maintenance',
      description: 'Plan preventive work',
      icon: Calendar,
      variant: 'default' as const,
      count: scheduledMaintenanceCount
    },
    {
      id: 'export-work-orders',
      title: 'Export Work Orders',
      description: 'Generate contractor reports',
      icon: Download,
      variant: 'outline' as const
    },
    {
      id: 'vendor-management',
      title: 'Vendor Management',
      description: 'Manage external contractors',
      icon: Users,
      variant: 'outline' as const
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant}
              onClick={() => onAction(action.id)}
              className="h-auto p-3 justify-start text-left relative"
            >
              <div className="flex items-start gap-3 w-full">
                <action.icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm flex items-center gap-2">
                    {action.title}
                    {action.count && action.count > 0 && (
                      <Badge 
                        variant={action.urgent ? "destructive" : "secondary"}
                        className="text-xs px-1.5 py-0.5"
                      >
                        {action.count}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs opacity-80 mt-0.5">
                    {action.description}
                  </div>
                </div>
              </div>
            </Button>
          ))}
        </div>
        
        {/* Emergency Action */}
        {overdueInspectionsCount > 0 && (
          <div className="mt-4 pt-4 border-t">
            <Button
              variant="destructive"
              onClick={() => onAction('overdue-inspections')}
              className="w-full"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              {overdueInspectionsCount} Overdue Inspections Require Immediate Attention
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}