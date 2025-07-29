/**
 * Advanced Analytics Dashboard Component
 * Showcases Phase 4 analytics capabilities
 * Built on top of optimized Phase 3 foundation
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Wrench,
  Zap,
  Target,
  RefreshCw,
  Download,
  Calendar,
  Building,
  Users,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import {
  useAnalyticsDashboard,
  useAnalyticsAlerts,
  useAnalyticsCacheManager,
  useFacilityReport,
  useSpaceOptimization,
} from '@/hooks/analytics/useAdvancedAnalytics';
import { useBuildingHierarchy } from '@/hooks/optimized/useOptimizedSpaces';

interface AdvancedAnalyticsDashboardProps {
  className?: string;
}

export default function AdvancedAnalyticsDashboard({ 
  className = '' 
}: AdvancedAnalyticsDashboardProps) {
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');

  // Hooks
  const { data: hierarchyData } = useBuildingHierarchy();
  const { data, summary, isLoading } = useAnalyticsDashboard(selectedBuilding === 'all' ? undefined : selectedBuilding);
  const { alerts, hasAlerts } = useAnalyticsAlerts(selectedBuilding === 'all' ? undefined : selectedBuilding);
  const { data: optimizationData } = useSpaceOptimization();
  const { refreshAllAnalytics } = useAnalyticsCacheManager();

  // Building options for filter
  const buildingOptions = useMemo(() => {
    if (!hierarchyData) return [];
    
    const buildings = new Map();
    hierarchyData.forEach(item => {
      if (!buildings.has(item.building_id)) {
        buildings.set(item.building_id, {
          id: item.building_id,
          name: item.building_name,
        });
      }
    });
    
    return Array.from(buildings.values());
  }, [hierarchyData]);

  // Handle refresh
  const handleRefresh = async () => {
    await refreshAllAnalytics();
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advanced Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive facility insights and predictive analytics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Buildings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Buildings</SelectItem>
              {buildingOptions.map((building) => (
                <SelectItem key={building.id} value={building.id}>
                  {building.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {hasAlerts && (
        <div className="space-y-3">
          {alerts.slice(0, 3).map((alert) => (
            <Alert key={alert.id} variant={alert.type === 'critical' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{alert.title}</AlertTitle>
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Facility Overview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Space Utilization</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isNaN(summary.facility_overview.average_utilization) ? '0' : summary.facility_overview.average_utilization}%
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={
                  summary.facility_overview.utilization_status === 'high' ? 'default' :
                  summary.facility_overview.utilization_status === 'medium' ? 'secondary' : 'outline'
                }>
                  {summary.facility_overview.utilization_status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {summary.facility_overview.total_spaces} spaces
                </span>
              </div>
              <Progress 
                value={isNaN(summary.facility_overview.average_utilization) ? 0 : summary.facility_overview.average_utilization} 
                className="mt-3" 
              />
            </CardContent>
          </Card>

          {/* Issue Resolution */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Issue Resolution</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isNaN(summary.issues_summary.resolution_rate) ? '0' : summary.issues_summary.resolution_rate}%
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={
                  summary.issues_summary.resolution_status === 'excellent' ? 'default' :
                  summary.issues_summary.resolution_status === 'good' ? 'secondary' : 'destructive'
                }>
                  {summary.issues_summary.resolution_status.replace('_', ' ')}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {summary.issues_summary.resolved_issues}/{summary.issues_summary.total_issues} resolved
                </span>
              </div>
              <Progress 
                value={isNaN(summary.issues_summary.resolution_rate) ? 0 : summary.issues_summary.resolution_rate} 
                className="mt-3" 
              />
            </CardContent>
          </Card>

          {/* Maintenance Score */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Maintenance Health</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isNaN(summary.maintenance_summary.average_score) ? '0' : summary.maintenance_summary.average_score}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={
                  summary.maintenance_summary.maintenance_status === 'excellent' ? 'default' :
                  summary.maintenance_summary.maintenance_status === 'good' ? 'secondary' : 'destructive'
                }>
                  {summary.maintenance_summary.maintenance_status.replace('_', ' ')}
                </Badge>
                {summary.maintenance_summary.critical_count > 0 && (
                  <span className="text-xs text-red-600">
                    {summary.maintenance_summary.critical_count} critical
                  </span>
                )}
              </div>
              <Progress 
                value={isNaN(summary.maintenance_summary.average_score) ? 0 : summary.maintenance_summary.average_score} 
                className="mt-3" 
              />
            </CardContent>
          </Card>

          {/* Energy Efficiency */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Energy Efficiency</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isNaN(summary.energy_summary.average_efficiency) ? '0' : summary.energy_summary.average_efficiency}%
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={
                  summary.energy_summary.efficiency_status === 'excellent' ? 'default' :
                  summary.energy_summary.efficiency_status === 'good' ? 'secondary' : 'outline'
                }>
                  {summary.energy_summary.efficiency_status.replace('_', ' ')}
                </Badge>
                <span className="text-xs text-green-600">
                  ${isNaN(summary.energy_summary.potential_savings) ? '0' : summary.energy_summary.potential_savings.toLocaleString()} savings
                </span>
              </div>
              <Progress 
                value={isNaN(summary.energy_summary.average_efficiency) ? 0 : summary.energy_summary.average_efficiency} 
                className="mt-3" 
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="utilization">Utilization</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Utilization Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Utilization Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data?.trends ? (
                  <div className="space-y-4">
                    {data.trends.slice(0, 5).map((trend, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{trend.room_type}</div>
                          <div className="text-sm text-muted-foreground">
                            Avg: {trend.average_occupancy} | Peak: {trend.peak_occupancy}
                          </div>
                        </div>
                        <Badge variant={
                          trend.utilization_trend === 'increasing' ? 'default' :
                          trend.utilization_trend === 'decreasing' ? 'destructive' : 'secondary'
                        }>
                          {trend.utilization_trend}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No trend data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Issues */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Issue Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data?.issues ? (
                  <div className="space-y-4">
                    {data.issues.slice(0, 5).map((issue, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{issue.issue_type}</div>
                          <Badge variant="outline">
                            {issue.total_count} total
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{issue.resolved_count} resolved</span>
                          <span>Avg: {issue.average_resolution_time}d</span>
                        </div>
                        <Progress 
                          value={(issue.resolved_count / issue.total_count) * 100} 
                          className="h-2" 
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No issue data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="utilization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Building Utilization Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {data?.utilization ? (
                <div className="space-y-6">
                  {data.utilization.map((building, index) => (
                    <div key={index} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{building.building_name}</h4>
                        <div className="text-sm text-muted-foreground">
                          {building.occupied_spaces}/{building.total_spaces} occupied
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Utilization Rate</span>
                          <span>{building.utilization_rate}%</span>
                        </div>
                        <Progress value={building.utilization_rate} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No utilization data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Priority List</CardTitle>
            </CardHeader>
            <CardContent>
              {data?.maintenance ? (
                <div className="space-y-4">
                  {data.maintenance.slice(0, 10).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">{item.space_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.space_type} • Score: {item.maintenance_score}
                        </div>
                        {item.predicted_issues.length > 0 && (
                          <div className="text-xs text-orange-600">
                            {item.predicted_issues[0]}
                          </div>
                        )}
                      </div>
                      <Badge variant={
                        item.maintenance_score < 50 ? 'destructive' :
                        item.maintenance_score < 70 ? 'secondary' : 'default'
                      }>
                        {item.maintenance_score < 50 ? 'Critical' :
                         item.maintenance_score < 70 ? 'Attention' : 'Good'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No maintenance data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Space Optimization Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {optimizationData ? (
                <div className="space-y-4">
                  {optimizationData.slice(0, 8).map((rec, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{rec.space_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Current: {rec.current_usage}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {rec.confidence_score}% confidence
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-blue-600">
                          Recommended: {rec.recommended_usage}
                        </p>
                        <p className="text-sm text-green-600">
                          {rec.potential_benefit}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No optimization recommendations available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
