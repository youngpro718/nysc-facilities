import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ChevronRight, 
  Database, 
  Shield, 
  Users, 
  Settings,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";
import { useState } from "react";
import { MobileActionSheet } from "@/components/mobile/MobileActionSheet";

interface AdminAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  status?: 'success' | 'warning' | 'error' | 'pending';
  count?: number;
  action: () => void;
}

interface MobileAdminCardProps {
  title: string;
  description: string;
  actions: AdminAction[];
  variant?: 'default' | 'security' | 'database' | 'activity';
}

const variantStyles = {
  default: "border-border",
  security: "border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30",
  database: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30",
  activity: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
};

const getStatusIcon = (status?: string) => {
  switch (status) {
    case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case 'pending': return <Clock className="h-4 w-4 text-blue-500" />;
    default: return null;
  }
};

export function MobileAdminCard({ title, description, actions, variant = 'default' }: MobileAdminCardProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <>
      <Card 
        className={`${variantStyles[variant]} hover:shadow-md transition-all duration-200 cursor-pointer`}
        onClick={() => setShowActions(true)}
      >
        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate">{title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {description}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground ml-2 flex-shrink-0" />
          </div>

          {/* Quick Status Indicators */}
          <div className="flex items-center gap-2 flex-wrap">
            {actions.slice(0, 3).map((action) => (
              <div key={action.id} className="flex items-center gap-1.5">
                <action.icon className="h-3.5 w-3.5 text-muted-foreground" />
                {action.count !== undefined && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                    {action.count}
                  </Badge>
                )}
                {action.status && getStatusIcon(action.status)}
              </div>
            ))}
            {actions.length > 3 && (
              <Badge variant="outline" className="h-5 px-1.5 text-xs">
                +{actions.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      </Card>

      <MobileActionSheet
        trigger={<div />}
        title={title}
        description={description}
        open={showActions}
        onOpenChange={setShowActions}
        actions={actions.map(action => ({
          id: action.id,
          label: action.title,
          icon: <action.icon className="h-4 w-4" />,
          onClick: action.action,
          variant: action.status === 'error' ? 'destructive' as const : 'default' as const
        }))}
      />
    </>
  );
}