import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Home,
  DoorOpen,
  Navigation,
  Zap,
  Users,
  Square
} from 'lucide-react';
import { FloorPlanNode } from '../types/floorPlanTypes';

interface AnalyticsDashboardProps {
  objects: FloorPlanNode[];
  selectedFloorName?: string;
}

interface RoomStats {
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  withLighting: number;
  withIssues: number;
  totalArea: number;
  averageSize: number;
}

export function AnalyticsDashboard({ objects, selectedFloorName }: AnalyticsDashboardProps) {
  const stats = useMemo((): RoomStats => {
    // Add safety check for objects array
    if (!objects || !Array.isArray(objects)) {
      return {
        total: 0,
        byType: {},
        byStatus: {},
        withLighting: 0,
        withIssues: 0,
        totalArea: 0,
        averageSize: 0
      };
    }

    const roomStats: RoomStats = {
      total: objects.length,
      byType: {},
      byStatus: {},
      withLighting: 0,
      withIssues: 0,
      totalArea: 0,
      averageSize: 0
    };

    objects.forEach(obj => {
      // Add safety checks for object structure
      if (!obj) return;
      
      // Count by type
      const type = obj.type || 'unknown';
      roomStats.byType[type] = (roomStats.byType[type] || 0) + 1;

      // Count by status - add more safety checks
      const status = obj.data?.properties?.status || 'unknown';
      roomStats.byStatus[status] = (roomStats.byStatus[status] || 0) + 1;

      // Count lighting
      if (obj.data?.properties?.lighting_status) {
        roomStats.withLighting++;
      }

      // Count issues
      if (status !== 'active') {
        roomStats.withIssues++;
      }

      // Calculate area with safety checks
      const width = obj.data?.size?.width || 0;
      const height = obj.data?.size?.height || 0;
      const area = (width * height) / 10000; // Convert to square meters (assuming pixels to meters conversion)
      roomStats.totalArea += area;
    });

    roomStats.averageSize = roomStats.total > 0 ? roomStats.totalArea / roomStats.total : 0;

    return roomStats;
  }, [objects]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'room': return <Home className="h-4 w-4" />;
      case 'door': return <DoorOpen className="h-4 w-4" />;
      case 'hallway': return <Navigation className="h-4 w-4" />;
      default: return <Square className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 dark:bg-green-900/30 text-green-800 border-green-200 dark:border-green-800';
      case 'maintenance': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 border-yellow-200 dark:border-yellow-800';
      case 'inactive': return 'bg-red-100 dark:bg-red-900/30 text-red-800 border-red-200 dark:border-red-800';
      default: return 'bg-gray-100 dark:bg-gray-800/30 text-gray-800 border-gray-200';
    }
  };

  const healthScore = useMemo(() => {
    if (stats.total === 0) return 0;
    const activeRooms = stats.byStatus['active'] || 0;
    return Math.round((activeRooms / stats.total) * 100);
  }, [stats]);

  const utilizationScore = useMemo(() => {
    if (stats.total === 0) return 0;
    // Mock utilization based on room types and status
    const offices = stats.byType['office'] || 0;
    const conferences = stats.byType['conference'] || 0;
    const activeRooms = stats.byStatus['active'] || 0;
    return Math.round(((offices + conferences * 2) / stats.total + activeRooms / stats.total) * 50);
  }, [stats]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Floor Analytics
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {selectedFloorName || 'Current Floor'} • Real-time insights
          </p>
        </div>
        <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800">
          Live Data
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Spaces</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.total}</p>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Square className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Area</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {stats.totalArea.toFixed(0)}m²
              </p>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Health Score</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{healthScore}%</p>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <Progress value={healthScore} className="mt-2 h-2" />
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Utilization</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{utilizationScore}%</p>
            </div>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <Progress value={utilizationScore} className="mt-2 h-2" />
        </Card>
      </div>

      {/* Space Types Breakdown */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="h-4 w-4 text-slate-600" />
          <h4 className="font-medium text-slate-900 dark:text-slate-100">Space Types</h4>
        </div>
        <div className="space-y-3">
          {Object.entries(stats.byType).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getTypeIcon(type)}
                <span className="text-sm text-slate-700 dark:text-slate-300 capitalize">
                  {type}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${(count / stats.total) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100 min-w-[2rem] text-right">
                  {count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Status Overview */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-4 w-4 text-slate-600" />
          <h4 className="font-medium text-slate-900 dark:text-slate-100">Status Overview</h4>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {Object.entries(stats.byStatus).map(([status, count]) => (
            <div key={status} className="flex items-center justify-between p-2 rounded-lg border">
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(status)}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Badge>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {count} space{count !== 1 ? 's' : ''}
                </span>
              </div>
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {Math.round((count / stats.total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Additional Insights */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-4 w-4 text-slate-600" />
          <h4 className="font-medium text-slate-900 dark:text-slate-100">Insights</h4>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-950/30 dark:bg-blue-900/20 rounded-lg">
            <span className="text-sm text-slate-700 dark:text-slate-300">
              Spaces with lighting data
            </span>
            <Badge variant="secondary">
              {stats.withLighting}/{stats.total}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-950/30 dark:bg-yellow-900/20 rounded-lg">
            <span className="text-sm text-slate-700 dark:text-slate-300">
              Spaces requiring attention
            </span>
            <Badge variant="secondary">
              {stats.withIssues}/{stats.total}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950/30 dark:bg-green-900/20 rounded-lg">
            <span className="text-sm text-slate-700 dark:text-slate-300">
              Average space size
            </span>
            <Badge variant="secondary">
              {stats.averageSize.toFixed(1)}m²
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}
