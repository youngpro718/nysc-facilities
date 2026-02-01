// @ts-nocheck
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, 
  Lightbulb, 
  Building2, 
  Users, 
  KeyRound, 
  Package,
  Wrench,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Shield
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ProductionSecurityGuard } from "@/components/security/ProductionSecurityGuard";

interface ModuleCardProps {
  title: string;
  icon: React.ReactNode;
  count?: number;
  status?: string;
  description?: string;
  route: string;
  color?: string;
  loading?: boolean;
  secondaryLabel?: string;
  secondaryRoute?: string;
}

const ModuleCard = ({ title, icon, count, status, description, route, color = "primary", loading, secondaryLabel, secondaryRoute }: ModuleCardProps) => {
  const navigate = useNavigate();
  
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'red':
        return 'border-red-200 hover:border-red-300 bg-red-50';
      case 'yellow':
        return 'border-yellow-200 hover:border-yellow-300 bg-yellow-50';
      case 'green':
        return 'border-green-200 hover:border-green-300 bg-green-50';
      case 'blue':
        return 'border-blue-200 hover:border-blue-300 bg-blue-50';
      case 'purple':
        return 'border-purple-200 hover:border-purple-300 bg-purple-50';
      case 'orange':
        return 'border-orange-200 hover:border-orange-300 bg-orange-50';
      default:
        return 'border-gray-200 hover:border-gray-300';
    }
  };

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${getColorClasses(color)}`}
      onClick={() => navigate(route)}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-lg font-semibold">{title}</span>
          </div>
          {count !== undefined && (
            <Badge variant={count > 0 ? "default" : "secondary"}>
              {loading ? "..." : count}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {description && (
          <p className="text-sm text-muted-foreground mb-3">{description}</p>
        )}
        {status && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{status}</span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate(route);
              }}
            >
              View Details
            </Button>
          </div>
        )}
        {!status && secondaryLabel && secondaryRoute && (
          <div className="flex items-center justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                navigate(secondaryRoute);
              }}
            >
              {secondaryLabel}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const IssuesDashboardCard = () => {
  const { data: issues, isLoading } = useQuery({
    queryKey: ['dashboard-issues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('issues')
        .select('id, status, priority, created_at')
        .neq('status', 'resolved');
      
      if (error) throw error;
      return data;
    }
  });

  const openIssues = issues?.filter(i => i.status === 'open')?.length || 0;
  const inProgressIssues = issues?.filter(i => i.status === 'in_progress')?.length || 0;
  const highPriorityIssues = issues?.filter(i => i.priority === 'high')?.length || 0;

  return (
    <ModuleCard
      title="Issues Management"
      icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
      count={issues?.length || 0}
      description={`${openIssues} open, ${inProgressIssues} in progress, ${highPriorityIssues} high priority`}
      route="/operations"
      color="red"
      loading={isLoading}
    />
  );
};

export const LightingDashboardCard = () => {
  const { data: lightingStats, isLoading } = useQuery({
    queryKey: ['dashboard-lighting'],
    queryFn: async () => {
      try {
        const { data: fixtures } = await supabase
          .from('lighting_fixtures')
          .select('status');
        
        if (!fixtures) return { total: 0, functional: 0, issues: 0, critical: 0 };
        
        const total = fixtures.length;
        const functional = fixtures.filter(f => f.status === 'functional').length;
        const nonFunctional = fixtures.filter(f => f.status === 'non_functional').length;
        const maintenance = fixtures.filter(f => f.status === 'maintenance_needed').length;
        const issues = nonFunctional + maintenance;
        
        return {
          total,
          functional,
          issues,
          critical: nonFunctional
        };
      } catch (error) {
        console.error('Error fetching lighting stats:', error);
        return { total: 0, functional: 0, issues: 0, critical: 0 };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const functionalPercentage = lightingStats?.total 
    ? Math.round((lightingStats.functional / lightingStats.total) * 100)
    : 0;

  return (
    <ModuleCard
      title="Lighting Management"
      icon={<Lightbulb className="h-5 w-5 text-yellow-500" />}
      count={lightingStats?.total}
      status={lightingStats?.critical > 10 ? "critical" : lightingStats?.issues > 20 ? "warning" : "good"}
      description={`${functionalPercentage}% functional, ${lightingStats?.issues || 0} issues`}
      route="/lighting"
      color="yellow"
      loading={isLoading}
    />
  );
};

export const SpacesDashboardCard = () => {
  const { data: spaces, isLoading } = useQuery({
    queryKey: ['dashboard-spaces'],
    queryFn: async () => {
      const { data: buildings, error } = await supabase
        .from('buildings')
        .select('id, name, status');
      
      if (error) throw error;
      return buildings;
    }
  });

  const activeBuildings = spaces?.filter(b => b.status === 'active')?.length || 0;
  const totalBuildings = spaces?.length || 0;

  return (
    <ModuleCard
      title="Spaces Management"
      icon={<Building2 className="h-5 w-5 text-blue-500" />}
      count={totalBuildings}
      description={`${activeBuildings} active buildings, ${totalBuildings - activeBuildings} under maintenance`}
      route="/spaces"
      color="blue"
      loading={isLoading}
    />
  );
};

export const KeysDashboardCard = () => {
  const { data: keys, isLoading } = useQuery({
    queryKey: ['dashboard-keys'],
    queryFn: async () => {
      const { data: totalKeys, error: totalError } = await supabase
        .from('keys')
        .select('id');
      
      const { data: assignedKeys, error: assignedError } = await supabase
        .from('key_assignments')
        .select('id')
        .is('returned_at', null);

      const { data: pendingRequests, error: requestsError } = await supabase
        .from('key_requests')
        .select('id')
        .eq('status', 'pending');

      if (totalError || assignedError || requestsError) throw totalError || assignedError || requestsError;
      
      return {
        total: totalKeys?.length || 0,
        assigned: assignedKeys?.length || 0,
        available: (totalKeys?.length || 0) - (assignedKeys?.length || 0),
        pendingRequests: pendingRequests?.length || 0
      };
    }
  });

  const hasPending = (keys?.pendingRequests || 0) > 0;

  return (
    <ModuleCard
      title="Keys Management"
      icon={<KeyRound className="h-5 w-5 text-purple-500" />}
      count={keys?.total || 0}
      description={`${keys?.assigned || 0} assigned, ${keys?.available || 0} available${hasPending ? `, ${keys?.pendingRequests} pending requests` : ''}`}
      route="/keys"
      color="purple"
      loading={isLoading}
      secondaryLabel={hasPending ? `${keys?.pendingRequests} Pending` : undefined}
      secondaryRoute={hasPending ? "/admin/key-requests" : undefined}
    />
  );
};

export const MaintenanceDashboardCard = () => {
  const { data: maintenance, isLoading } = useQuery({
    queryKey: ['dashboard-maintenance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('issues')
        .select('id, status, priority')
        .neq('status', 'resolved');
      
      if (error) throw error;
      return data;
    }
  });

  const scheduled = maintenance?.filter(m => (m as any).status === 'pending')?.length || 0;
  const inProgress = maintenance?.filter(m => (m as any).status === 'in_progress')?.length || 0;
  const urgent = maintenance?.filter(m => (m as any).priority === 'high')?.length || 0;

  return (
    <ModuleCard
      title="Maintenance"
      icon={<Wrench className="h-5 w-5 text-green-500" />}
      count={maintenance?.length || 0}
      description={`${scheduled} scheduled, ${inProgress} in progress, ${urgent} urgent`}
      route="/operations"
      color="green"
      loading={isLoading}
    />
  );
};

export const SupplyDashboardCard = () => {
  const { data: supply, isLoading } = useQuery({
    queryKey: ['dashboard-supply'],
    queryFn: async () => {
      const { data: requests, error } = await supabase
        .from('supply_requests')
        .select('id, status')
        .not('status', 'in', '(completed,cancelled)');
      
      if (error) throw error;
      return requests;
    }
  });

  const submitted = supply?.filter(s => s.status === 'submitted')?.length || 0;
  const processing = supply?.filter(s => ['received', 'processing'].includes(s.status))?.length || 0;
  const ready = supply?.filter(s => s.status === 'ready')?.length || 0;

  return (
    <ModuleCard
      title="Supply History"
      icon={<Package className="h-5 w-5 text-orange-500" />}
      count={supply?.length || 0}
      description={`${submitted} new, ${processing} processing, ${ready} ready`}
      route="/admin/supply-requests"
      color="orange"
      loading={isLoading}
      secondaryLabel="Supply Room"
      secondaryRoute="/supply-room"
    />
  );
};

export const ModuleCards = () => {
  // Module cards disabled - use individual cards where needed
  return null;
};
