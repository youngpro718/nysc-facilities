import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
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
  Download, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  Calendar,
  FileText,
  Search,
  Filter,
  Eye
} from "lucide-react";
import { LightingIssue } from "../types";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function ReportsView() {
  const [reportPeriod, setReportPeriod] = useState('monthly');
  const [selectedBuilding, setSelectedBuilding] = useState('all');
  const [issueFilter, setIssueFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Real issues tracking data
  const { data: issuesData, isLoading: issuesLoading } = useQuery({
    queryKey: ['lighting-issues-report', reportPeriod, issueFilter],
    queryFn: async () => {
      const { data: issues, error } = await supabase
        .from('lighting_issues')
        .select(`
          id,
          fixture_id,
          issue_type,
          priority,
          status,
          reported_at,
          resolved_at,
          description,
          assigned_to,
          resolution_notes
        `);
      
      if (error) throw error;

      const now = new Date();
      const processedIssues = issues?.map(issue => {
        const reportedDate = new Date(issue.reported_at);
        const resolvedDate = issue.resolved_at ? new Date(issue.resolved_at) : null;
        const daysOpen = Math.floor((now.getTime() - reportedDate.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          ...issue,
          days_open: daysOpen,
          is_overdue: daysOpen > 7 && issue.status !== 'resolved',
          resolution_time: resolvedDate ? 
            Math.floor((resolvedDate.getTime() - reportedDate.getTime()) / (1000 * 60 * 60 * 24)) : null
        };
      }) || [];

      // Filter issues based on period
      let filteredIssues = processedIssues;
      const cutoffDate = new Date();
      
      switch(reportPeriod) {
        case 'weekly':
          cutoffDate.setDate(cutoffDate.getDate() - 7);
          break;
        case 'monthly':
          cutoffDate.setMonth(cutoffDate.getMonth() - 1);
          break;
        case 'quarterly':
          cutoffDate.setMonth(cutoffDate.getMonth() - 3);
          break;
        case 'yearly':
          cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
          break;
      }
      
      filteredIssues = processedIssues.filter(issue => 
        new Date(issue.reported_at) >= cutoffDate
      );

      // Apply additional filters
      if (issueFilter !== 'all') {
        if (issueFilter === 'overdue') {
          filteredIssues = filteredIssues.filter(issue => issue.is_overdue);
        } else if (issueFilter === 'critical') {
          filteredIssues = filteredIssues.filter(issue => issue.priority === 'critical');
        } else if (issueFilter === 'unresolved') {
          filteredIssues = filteredIssues.filter(issue => issue.status !== 'resolved');
        }
      }

      // Calculate analytics
      const statusCounts = filteredIssues.reduce((acc, issue) => {
        acc[issue.status] = (acc[issue.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const priorityCounts = filteredIssues.reduce((acc, issue) => {
        acc[issue.priority] = (acc[issue.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const typeCounts = filteredIssues.reduce((acc, issue) => {
        acc[issue.issue_type] = (acc[issue.issue_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const longRunningIssues = filteredIssues.filter(issue => issue.days_open > 30);
      const overdueIssues = filteredIssues.filter(issue => issue.is_overdue);
      const resolvedIssues = filteredIssues.filter(issue => issue.status === 'resolved');
      
      const avgResolutionTime = resolvedIssues.length > 0 ? 
        resolvedIssues.reduce((sum, issue) => sum + (issue.resolution_time || 0), 0) / resolvedIssues.length : 0;

      return {
        issues: filteredIssues,
        longRunningIssues,
        overdueIssues,
        totalIssues: filteredIssues.length,
        unresolvedIssues: filteredIssues.filter(issue => issue.status !== 'resolved').length,
        criticalIssues: filteredIssues.filter(issue => issue.priority === 'critical').length,
        avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
        statusChart: Object.entries(statusCounts).map(([status, count]) => ({
          name: status.replace('_', ' ').toUpperCase(),
          value: count,
          percentage: Math.round((count / filteredIssues.length) * 100)
        })),
        priorityChart: Object.entries(priorityCounts).map(([priority, count]) => ({
          name: priority.toUpperCase(),
          value: count,
          percentage: Math.round((count / filteredIssues.length) * 100)
        })),
        typeChart: Object.entries(typeCounts).map(([type, count]) => ({
          name: type.replace('_', ' '),
          value: count
        }))
      };
    }
  });

  // Fixture status data
  const { data: statusData } = useQuery({
    queryKey: ['lighting-status-report'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lighting_fixtures')
        .select('status, technology, type, name');
      
      if (error) throw error;
      
      const statusCounts = data?.reduce((acc: any, fixture) => {
        acc[fixture.status] = (acc[fixture.status] || 0) + 1;
        return acc;
      }, {});
      
      return Object.entries(statusCounts || {}).map(([status, count]) => ({
        name: status.replace('_', ' ').toUpperCase(),
        value: count as number,
        percentage: Math.round(((count as number) / (data?.length || 1)) * 100)
      }));
    }
  });

  // Trend data for issues over time
  const trendData = [
    { month: 'Jul', reported: 8, resolved: 6, overdue: 2 },
    { month: 'Aug', reported: 12, resolved: 10, overdue: 4 },
    { month: 'Sep', reported: 6, resolved: 8, overdue: 2 },
    { month: 'Oct', reported: 9, resolved: 7, overdue: 3 },
    { month: 'Nov', reported: 11, resolved: 9, overdue: 5 },
    { month: 'Dec', reported: 7, resolved: 6, overdue: 1 }
  ];

  const exportReport = (type: string) => {
    console.log('Exporting report:', type);
    // Implementation would generate and download reports
  };

  const filteredLongRunningIssues = issuesData?.longRunningIssues?.filter(issue =>
    searchQuery === '' || 
    issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    issue.issue_type.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'deferred': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Report Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex gap-2">
              <Select value={reportPeriod} onValueChange={setReportPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Buildings</SelectItem>
                  <SelectItem value="building1">Building 1</SelectItem>
                  <SelectItem value="building2">Building 2</SelectItem>
                </SelectContent>
              </Select>

              <Select value={issueFilter} onValueChange={setIssueFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter Issues" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Issues</SelectItem>
                  <SelectItem value="overdue">Overdue Only</SelectItem>
                  <SelectItem value="critical">Critical Only</SelectItem>
                  <SelectItem value="unresolved">Unresolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => exportReport('pdf')}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" onClick={() => exportReport('excel')}>
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="issues" className="space-y-4">
        <TabsList>
          <TabsTrigger value="issues">Issue Tracking</TabsTrigger>
          <TabsTrigger value="overview">System Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="long-running">Long-Running Issues</TabsTrigger>
        </TabsList>

        <TabsContent value="issues" className="space-y-6">
          {/* Key Issue Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {issuesData?.criticalIssues || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Critical Issues</div>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {issuesData?.overdueIssues?.length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Overdue (&gt;7 days)</div>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      {issuesData?.avgResolutionTime || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Avg Resolution (days)</div>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      {issuesData?.totalIssues || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Issues</div>
                  </div>
                  <FileText className="h-8 w-8 text-gray-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Issue Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Issue Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={issuesData?.statusChart}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {issuesData?.statusChart?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Issue Types</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={issuesData?.typeChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fixture Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Issue Trends Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="reported" stroke="#8884d8" name="Reported" />
                  <Line type="monotone" dataKey="resolved" stroke="#82ca9d" name="Resolved" />
                  <Line type="monotone" dataKey="overdue" stroke="#ff7300" name="Overdue" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="long-running" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Long-Running Issues (&gt;30 days)</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search issues..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredLongRunningIssues.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No long-running issues found
                  </div>
                ) : (
                  filteredLongRunningIssues.map((issue) => (
                    <div key={issue.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(issue.priority)}>
                            {issue.priority.toUpperCase()}
                          </Badge>
                          <Badge className={getStatusColor(issue.status)}>
                            {issue.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {issue.days_open} days open
                          </span>
                        </div>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                      <div>
                        <div className="font-medium">
                          {issue.issue_type.replace('_', ' ').toUpperCase()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {issue.description}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Reported: {new Date(issue.reported_at).toLocaleDateString()}
                        {issue.assigned_to && ` • Assigned to: ${issue.assigned_to}`}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}