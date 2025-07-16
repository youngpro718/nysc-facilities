import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  Users, 
  Building, 
  Calendar,
  TrendingUp,
  AlertTriangle,
  Clock
} from 'lucide-react';

interface RoomAssignmentAnalyticsProps {
  assignments: any[];
}

export function RoomAssignmentAnalytics({ assignments }: RoomAssignmentAnalyticsProps) {
  // Calculate analytics data
  const analytics = React.useMemo(() => {
    if (!assignments.length) return null;

    // Basic statistics
    const totalAssignments = assignments.length;
    const primaryAssignments = assignments.filter(a => a.is_primary).length;
    const uniqueOccupants = new Set(assignments.map(a => a.occupant_id)).size;
    const uniqueRooms = new Set(assignments.map(a => a.room_id)).size;

    // Department distribution
    const departmentCounts = assignments.reduce((acc, assignment) => {
      const dept = assignment.department || 'Unknown';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const departmentData = Object.entries(departmentCounts).map(([name, value]) => ({
      name,
      value,
      percentage: Math.round((value / totalAssignments) * 100)
    }));

    // Assignment type distribution
    const typeData = assignments.reduce((acc, assignment) => {
      const type = assignment.assignment_type || 'general';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const assignmentTypeData = Object.entries(typeData).map(([name, value]) => ({
      name: name.replace(/_/g, ' '),
      value,
      percentage: Math.round((value / totalAssignments) * 100)
    }));

    // Building distribution
    const buildingCounts = assignments.reduce((acc, assignment) => {
      const building = assignment.building_name || 'Unknown';
      acc[building] = (acc[building] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const buildingData = Object.entries(buildingCounts).map(([name, value]) => ({
      name,
      assignments: value,
      utilization: Math.round((value / totalAssignments) * 100)
    }));

    // Assignment trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentAssignments = assignments.filter(a => 
      new Date(a.assigned_at) >= thirtyDaysAgo
    );

    const trendData = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      const dateStr = date.toISOString().split('T')[0];
      
      const dayAssignments = recentAssignments.filter(a => 
        a.assigned_at.startsWith(dateStr)
      ).length;

      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        assignments: dayAssignments
      };
    });

    // Expiring assignments (if expiration data exists)
    const expiringCount = assignments.filter(a => {
      if (!a.expiration_date) return false;
      const expDate = new Date(a.expiration_date);
      const oneMonthFromNow = new Date();
      oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
      return expDate <= oneMonthFromNow;
    }).length;

    // Room utilization metrics
    const roomUtilization = buildingData.reduce((total, building) => 
      total + building.assignments, 0
    ) / buildingData.length;

    return {
      totalAssignments,
      primaryAssignments,
      uniqueOccupants,
      uniqueRooms,
      departmentData,
      assignmentTypeData,
      buildingData,
      trendData,
      expiringCount,
      roomUtilization: Math.round(roomUtilization * 100) / 100
    };
  }, [assignments]);

  if (!analytics) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">No data available for analytics</p>
      </Card>
    );
  }

  const COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--secondary))',
    'hsl(var(--accent))', 
    'hsl(var(--muted))',
    'hsl(var(--destructive))',
    'hsl(var(--warning))'
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Assignments</p>
              <p className="text-2xl font-bold">{analytics.totalAssignments}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary/10 rounded-lg">
              <Building className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unique Rooms</p>
              <p className="text-2xl font-bold">{analytics.uniqueRooms}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <TrendingUp className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Primary Assignments</p>
              <p className="text-2xl font-bold">{analytics.primaryAssignments}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expiring Soon</p>
              <p className="text-2xl font-bold">{analytics.expiringCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Department Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.departmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analytics.departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} assignments`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {analytics.departmentData.slice(0, 5).map((dept, index) => (
              <div key={dept.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm">{dept.name}</span>
                </div>
                <Badge variant="outline">{dept.percentage}%</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Assignment Types */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Assignment Types</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.assignmentTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Building Utilization */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Building Utilization</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.buildingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="assignments" fill="hsl(var(--secondary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Assignment Trends */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Assignment Trends (30 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="assignments" 
                  stroke="hsl(var(--accent))" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Summary Insights */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Key Insights</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="font-medium">Occupancy Rate</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {Math.round((analytics.uniqueOccupants / analytics.uniqueRooms) * 100)}% of rooms are occupied
            </p>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-secondary" />
              <span className="font-medium">Primary vs Secondary</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {Math.round((analytics.primaryAssignments / analytics.totalAssignments) * 100)}% are primary assignments
            </p>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-accent" />
              <span className="font-medium">Average per Occupant</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {Math.round((analytics.totalAssignments / analytics.uniqueOccupants) * 10) / 10} assignments per person
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}