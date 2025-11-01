import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle, Clock, Users, Activity } from 'lucide-react';
import { toast } from 'sonner';

interface SecurityMetrics {
  timestamp: string;
  failed_logins_24h: number;
  suspicious_activities: number;
  policy_violations: number;
  admin_actions_24h: number;
  security_level: 'low_risk' | 'medium_risk' | 'high_risk';
  active_sessions: number;
  total_users: number;
}

interface SecurityAlert {
  id: string;
  notification_type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

interface CompliancePolicy {
  id: string;
  policy_name: string;
  compliance_status: 'compliant' | 'non_compliant' | 'warning';
  details: any;
  last_checked: string;
  next_check_due: string;
}

export const SecurityDashboard = () => {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [compliance, setCompliance] = useState<CompliancePolicy[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSecurityData = async () => {
    try {
      setIsLoading(true);

      // Load security metrics
      const { data: metricsData, error: metricsError } = await supabase
        .rpc('enhanced_security_monitor');

      if (metricsError) {
        console.error('Error loading security metrics:', metricsError);
        toast.error('Failed to load security metrics');
      } else {
        setMetrics(metricsData);
      }

      // Load security alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('security_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (alertsError) {
        console.error('Error loading security alerts:', alertsError);
      } else {
        setAlerts(alertsData || []);
      }

      // Load compliance policies
      const { data: complianceData, error: complianceError } = await supabase
        .from('security_policy_compliance')
        .select('*')
        .order('last_checked', { ascending: false });

      if (complianceError) {
        console.error('Error loading compliance data:', complianceError);
      } else {
        setCompliance(complianceData || []);
      }

    } catch (error) {
      console.error('Error loading security dashboard:', error);
      toast.error('Failed to load security dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const runComplianceCheck = async () => {
    try {
      const { error } = await supabase.rpc('check_security_compliance');
      if (error) {
        toast.error('Failed to run compliance check');
        console.error('Compliance check error:', error);
      } else {
        toast.success('Compliance check completed');
        loadSecurityData();
      }
    } catch (error) {
      console.error('Error running compliance check:', error);
      toast.error('Failed to run compliance check');
    }
  };

  const markAlertAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('security_notifications')
        .update({ is_read: true })
        .eq('id', alertId);

      if (error) {
        console.error('Error marking alert as read:', error);
      } else {
        setAlerts(prev => prev.map(alert => 
          alert.id === alertId ? { ...alert, is_read: true } : alert
        ));
      }
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  useEffect(() => {
    loadSecurityData();
    
    // Set up periodic refresh
    const interval = setInterval(loadSecurityData, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const getSecurityLevelColor = (level: string) => {
    switch (level) {
      case 'low_risk': return 'text-success';
      case 'medium_risk': return 'text-warning';
      case 'high_risk': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getSecurityLevelIcon = (level: string) => {
    switch (level) {
      case 'low_risk': return <CheckCircle className="h-5 w-5" />;
      case 'medium_risk': return <AlertTriangle className="h-5 w-5" />;
      case 'high_risk': return <Shield className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info': return 'bg-blue-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'non_compliant': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-slate-200 h-10 w-10"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 rounded"></div>
              <div className="h-4 bg-slate-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Level Overview */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${getSecurityLevelColor(metrics.security_level)}`}>
                  {getSecurityLevelIcon(metrics.security_level)}
                </div>
                <div>
                  <p className="text-sm font-medium">Security Level</p>
                  <p className={`text-lg font-bold ${getSecurityLevelColor(metrics.security_level)}`}>
                    {metrics.security_level.replace('_', ' ').toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm font-medium">Active Sessions</p>
                  <p className="text-lg font-bold">{metrics.active_sessions}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-warning" />
                <div>
                  <p className="text-sm font-medium">Failed Logins (24h)</p>
                  <p className="text-lg font-bold">{metrics.failed_logins_24h}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Activity className="h-8 w-8 text-success" />
                <div>
                  <p className="text-sm font-medium">Admin Actions (24h)</p>
                  <p className="text-lg font-bold">{metrics.admin_actions_24h}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Security Alerts</CardTitle>
            <Button variant="outline" size="sm" onClick={loadSecurityData}>
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No security alerts</p>
              ) : (
                alerts.map((alert) => (
                  <Alert key={alert.id} className={!alert.is_read ? 'border-l-4 border-l-primary' : ''}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant="secondary" 
                            className={`${getSeverityColor(alert.severity)} text-white`}
                          >
                            {alert.severity}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(alert.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold">{alert.title}</h4>
                        <AlertDescription className="text-xs mt-1">
                          {alert.message}
                        </AlertDescription>
                      </div>
                      {!alert.is_read && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => markAlertAsRead(alert.id)}
                        >
                          Mark Read
                        </Button>
                      )}
                    </div>
                  </Alert>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Compliance Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Policy Compliance</CardTitle>
            <Button variant="outline" size="sm" onClick={runComplianceCheck}>
              Run Check
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {compliance.length === 0 ? (
                <p className="text-sm text-muted-foreground">No compliance data</p>
              ) : (
                compliance.map((policy) => (
                  <div key={policy.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{policy.policy_name}</span>
                      <Badge 
                        variant="secondary"
                        className={`${getComplianceColor(policy.compliance_status)} text-white`}
                      >
                        {policy.compliance_status}
                      </Badge>
                    </div>
                    {policy.details?.score && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Coverage Score</span>
                          <span>{policy.details.score}%</span>
                        </div>
                        <Progress value={policy.details.score} className="h-2" />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Last checked: {new Date(policy.last_checked).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Metrics Summary */}
      {metrics && (
        <Card>
          <CardHeader>
            <CardTitle>Security Metrics Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium mb-2">Threat Detection</p>
                <p>Suspicious Activities: {metrics.suspicious_activities}</p>
                <p>Policy Violations: {metrics.policy_violations}</p>
              </div>
              <div>
                <p className="font-medium mb-2">User Activity</p>
                <p>Total Users: {metrics.total_users}</p>
                <p>Active Sessions: {metrics.active_sessions}</p>
              </div>
              <div>
                <p className="font-medium mb-2">System Status</p>
                <p>Last Updated: {new Date(metrics.timestamp).toLocaleString()}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Clock className="h-4 w-4" />
                  <span>Real-time monitoring active</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};