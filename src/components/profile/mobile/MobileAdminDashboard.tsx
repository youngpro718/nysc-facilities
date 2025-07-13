import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Database, 
  Shield, 
  Activity, 
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle2,
  UserCheck,
  FileText
} from "lucide-react";
import { MobileAdminCard } from "./MobileAdminCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface SystemStats {
  totalUsers: number;
  pendingVerifications: number;
  activeIssues: number;
  systemHealth: 'good' | 'warning' | 'error';
  lastBackup: string;
  databaseSize: string;
}

export function MobileAdminDashboard() {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    pendingVerifications: 0,
    activeIssues: 0,
    systemHealth: 'good',
    lastBackup: 'N/A',
    databaseSize: 'N/A'
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Get user counts
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get pending verifications
      const { count: pendingCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('verification_status', 'pending');

      // Get active issues
      const { count: issueCount } = await supabase
        .from('issues')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');

      setStats({
        totalUsers: userCount || 0,
        pendingVerifications: pendingCount || 0,
        activeIssues: issueCount || 0,
        systemHealth: 'good',
        lastBackup: new Date().toLocaleDateString(),
        databaseSize: '2.4 GB'
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      toast({
        title: "Error loading statistics",
        description: "Failed to load admin dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const userManagementActions = [
    {
      id: 'view-users',
      title: 'View All Users',
      description: 'Manage user accounts and permissions',
      icon: Users,
      count: stats.totalUsers,
      status: 'success' as const,
      action: () => navigate('/users')
    },
    {
      id: 'pending-verifications',
      title: 'Pending Verifications',
      description: 'Review user verification requests',
      icon: UserCheck,
      count: stats.pendingVerifications,
      status: stats.pendingVerifications > 0 ? 'warning' as const : 'success' as const,
      action: () => navigate('/verification')
    },
    {
      id: 'user-roles',
      title: 'Manage Roles',
      description: 'Assign and modify user roles',
      icon: Shield,
      action: () => navigate('/roles')
    }
  ];

  const systemActions = [
    {
      id: 'database-health',
      title: 'Database Health',
      description: 'Monitor database performance',
      icon: Database,
      status: 'success' as const,
      action: () => navigate('/database')
    },
    {
      id: 'system-backup',
      title: 'System Backup',
      description: `Last backup: ${stats.lastBackup}`,
      icon: Shield,
      status: 'success' as const,
      action: () => navigate('/backup')
    },
    {
      id: 'activity-logs',
      title: 'Activity Logs',
      description: 'View system activity and audit logs',
      icon: Activity,
      action: () => navigate('/activity-logs')
    }
  ];

  const issueActions = [
    {
      id: 'active-issues',
      title: 'Active Issues',
      description: 'Review and resolve open issues',
      icon: AlertTriangle,
      count: stats.activeIssues,
      status: stats.activeIssues > 0 ? 'error' as const : 'success' as const,
      action: () => navigate('/issues')
    },
    {
      id: 'issue-reports',
      title: 'Generate Reports',
      description: 'Create issue and performance reports',
      icon: FileText,
      action: () => navigate('/reports')
    }
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
              <div className="flex gap-2">
                <div className="h-6 bg-muted rounded w-16"></div>
                <div className="h-6 bg-muted rounded w-16"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* System Overview */}
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">System Overview</h2>
            <Badge 
              variant={stats.systemHealth === 'good' ? 'default' : 'destructive'}
              className="flex items-center gap-1"
            >
              <CheckCircle2 className="h-3 w-3" />
              {stats.systemHealth === 'good' ? 'Healthy' : 'Issues'}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">{stats.totalUsers}</div>
              <div className="text-xs text-muted-foreground">Total Users</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-orange-500">{stats.activeIssues}</div>
              <div className="text-xs text-muted-foreground">Active Issues</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <MobileAdminCard
        title="User Management"
        description="Manage users, verifications, and permissions"
        actions={userManagementActions}
        variant="default"
      />

      <MobileAdminCard
        title="System & Security"
        description="Monitor system health and security"
        actions={systemActions}
        variant="security"
      />

      <MobileAdminCard
        title="Issues & Reports"
        description="Track issues and generate reports"
        actions={issueActions}
        variant="activity"
      />
    </div>
  );
}