import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, FileText, Eye, TrendingUp } from "lucide-react";
import { ReportsSection } from "@/components/profile/reports/ReportsSection";
import { MonitoringDashboard } from "@/components/monitoring/MonitoringDashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export function AdminAnalyticsTab() {
  const systemMetrics = {
    uptime: 99.8,
    responseTime: 245,
    activeUsers: 42,
    totalRequests: 15420,
    errorRate: 0.2
  };

  const recentReports = [
    { name: "Monthly Facility Usage", date: "2024-01-15", status: "completed" },
    { name: "Key Assignment Report", date: "2024-01-14", status: "completed" },
    { name: "Maintenance Summary", date: "2024-01-13", status: "pending" },
    { name: "Security Audit", date: "2024-01-12", status: "completed" }
  ];

  return (
    <div className="space-y-6">
      {/* Quick Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">System Uptime</p>
                <p className="text-2xl font-bold">{systemMetrics.uptime}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <Progress value={systemMetrics.uptime} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Response Time</p>
                <p className="text-2xl font-bold">{systemMetrics.responseTime}ms</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{systemMetrics.activeUsers}</p>
              </div>
              <Eye className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Error Rate</p>
                <p className="text-2xl font-bold">{systemMetrics.errorRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reports" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reports" className="gap-2">
            <FileText className="h-4 w-4" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="gap-2">
            <Eye className="h-4 w-4" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Report Generation
                  </CardTitle>
                  <CardDescription>
                    Generate and manage facility reports
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ReportsSection />
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Reports</CardTitle>
                  <CardDescription>
                    Latest generated reports
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentReports.map((report, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{report.name}</p>
                        <p className="text-xs text-muted-foreground">{report.date}</p>
                      </div>
                      <Badge 
                        variant={report.status === 'completed' ? 'default' : 'secondary'}
                      >
                        {report.status}
                      </Badge>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full mt-4">
                    View All Reports
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                System Monitoring
              </CardTitle>
              <CardDescription>
                Real-time system performance and health monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MonitoringDashboard />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Usage Analytics
                </CardTitle>
                <CardDescription>
                  Facility usage patterns and trends
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Spaces Utilization</span>
                    <span className="text-sm font-medium">78%</span>
                  </div>
                  <Progress value={78} />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Key Usage</span>
                    <span className="text-sm font-medium">65%</span>
                  </div>
                  <Progress value={65} />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Issue Resolution</span>
                    <span className="text-sm font-medium">92%</span>
                  </div>
                  <Progress value={92} />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">User Satisfaction</span>
                    <span className="text-sm font-medium">87%</span>
                  </div>
                  <Progress value={87} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
                <CardDescription>
                  Key performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 border rounded-lg">
                    <p className="text-2xl font-bold text-green-600">15.4K</p>
                    <p className="text-xs text-muted-foreground">Total Requests</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">245ms</p>
                    <p className="text-xs text-muted-foreground">Avg Response</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">42</p>
                    <p className="text-xs text-muted-foreground">Active Users</p>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">0.2%</p>
                    <p className="text-xs text-muted-foreground">Error Rate</p>
                  </div>
                </div>

                <Button className="w-full mt-4">
                  View Detailed Analytics
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
