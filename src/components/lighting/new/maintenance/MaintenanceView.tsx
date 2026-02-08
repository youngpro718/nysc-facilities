import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar,
  Clock,
  Wrench,
  AlertTriangle,
  CheckCircle,
  User,
  Building,
  Plus
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface MaintenanceTask {
  id: string;
  title: string;
  description: string;
  fixture_name: string;
  room_number: string;
  building_name: string;
  scheduled_date: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigned_to: string | null;
  estimated_duration: number; // in hours
  notes: string | null;
}

export function MaintenanceView() {
  const [activeTab, setActiveTab] = useState("schedule");

  const { data: maintenanceTasks, isLoading } = useQuery({
    queryKey: ['maintenance-tasks'],
    queryFn: async () => {
      // Mock data for now - in real implementation would fetch from maintenance_schedules
      const mockTasks: MaintenanceTask[] = [
        {
          id: "1",
          title: "Ballast Replacement",
          description: "Replace faulty ballast in fluorescent fixture",
          fixture_name: "Ceiling Light 12",
          room_number: "Court 3",
          building_name: "Main Building",
          scheduled_date: "2024-01-15T10:00:00Z",
          status: 'scheduled',
          priority: 'high',
          assigned_to: "John Smith",
          estimated_duration: 2,
          notes: "Requires electrical contractor"
        },
        {
          id: "2", 
          title: "LED Upgrade",
          description: "Upgrade fluorescent to LED",
          fixture_name: "Hallway Light 8",
          room_number: "Main Hallway",
          building_name: "Main Building",
          scheduled_date: "2024-01-10T14:00:00Z",
          status: 'completed',
          priority: 'medium',
          assigned_to: "Jane Doe",
          estimated_duration: 1,
          notes: "Completed ahead of schedule"
        }
      ];
      return mockTasks;
    }
  });

  const { data: maintenanceStats, isLoading: statsLoading } = useQuery({
    queryKey: ['maintenance-stats'],
    queryFn: async () => {
      return {
        totalTasks: 45,
        completedThisMonth: 12,
        overdueCount: 3,
        scheduledCount: 8,
        averageResolutionDays: 2.5
      };
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'overdue': return 'destructive';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'outline';
      default: return 'outline';
    }
  };

  if (isLoading || statsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Lighting Maintenance</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Maintenance
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Overdue</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maintenanceStats?.overdueCount || 0}</div>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">Requires immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Scheduled</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maintenanceStats?.scheduledCount || 0}</div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Upcoming maintenance tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Completed</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maintenanceStats?.completedThisMonth || 0}</div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">Avg resolution: {maintenanceStats?.averageResolutionDays} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Total Tasks</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maintenanceStats?.totalTasks || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">All maintenance records</p>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="active">Active Tasks</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Maintenance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {maintenanceTasks?.filter(task => task.status === 'scheduled').map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{task.title}</h4>
                        <Badge variant={getPriorityColor(task.priority)}>{task.priority}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {task.room_number}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(task.scheduled_date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {task.estimated_duration}h
                        </span>
                        {task.assigned_to && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {task.assigned_to}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="default" size="sm">Start</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Maintenance Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {maintenanceTasks?.filter(task => task.status === 'in_progress' || task.status === 'overdue').map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{task.title}</h4>
                        <Badge variant={getStatusColor(task.status)}>{task.status}</Badge>
                        <Badge variant={getPriorityColor(task.priority)}>{task.priority}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {task.room_number}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(task.scheduled_date).toLocaleDateString()}
                        </span>
                        {task.assigned_to && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {task.assigned_to}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Update</Button>
                      <Button variant="default" size="sm">Complete</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {maintenanceTasks?.filter(task => task.status === 'completed').map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{task.title}</h4>
                        <Badge variant="default">Completed</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {task.room_number}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(task.scheduled_date).toLocaleDateString()}
                        </span>
                        {task.assigned_to && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {task.assigned_to}
                          </span>
                        )}
                      </div>
                      {task.notes && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">{task.notes}</p>
                      )}
                    </div>
                    <Button variant="outline" size="sm">View Details</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Vendors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Acme Electrical Services</h4>
                  <p className="text-sm text-muted-foreground mb-2">Licensed electrical contractor</p>
                  <div className="space-y-1 text-xs">
                    <p><strong>Phone:</strong> (555) 123-4567</p>
                    <p><strong>Email:</strong> service@acme-electric.com</p>
                    <p><strong>Specialties:</strong> Ballast repair, LED installations</p>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm">Contact</Button>
                    <Button variant="outline" size="sm">Schedule</Button>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Bright Light Solutions</h4>
                  <p className="text-sm text-muted-foreground mb-2">General lighting maintenance</p>
                  <div className="space-y-1 text-xs">
                    <p><strong>Phone:</strong> (555) 987-6543</p>
                    <p><strong>Email:</strong> info@brightlight.com</p>
                    <p><strong>Specialties:</strong> Bulb replacement, fixture cleaning</p>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm">Contact</Button>
                    <Button variant="outline" size="sm">Schedule</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}