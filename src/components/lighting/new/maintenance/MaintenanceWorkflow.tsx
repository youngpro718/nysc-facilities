import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { MaintenanceWorkItem } from "../types";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Wrench, 
  AlertTriangle,
  CheckCircle,
  Plus,
  Filter
} from "lucide-react";

export function MaintenanceWorkflow() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');

  const { data: workItems, isLoading } = useQuery({
    queryKey: ['maintenance-work-items'],
    queryFn: async (): Promise<MaintenanceWorkItem[]> => {
      // This would come from a maintenance_work_items table
      // For now, we'll simulate data based on fixtures that need attention
      const { data: fixtures, error } = await supabase
        .from('lighting_fixtures')
        .select(`
          id,
          name,
          status,
          requires_electrician,
          ballast_issue,
          updated_at
        `)
        .or('status.eq.maintenance_needed,requires_electrician.eq.true,ballast_issue.eq.true');

      if (error) throw error;

      // Convert fixtures to work items
      return fixtures?.map((fixture, index) => ({
        id: `work-${fixture.id}`,
        type: fixture.requires_electrician ? 'repair' : 
              fixture.ballast_issue ? 'repair' : 'inspection',
        fixture_id: fixture.id,
        priority: fixture.requires_electrician ? 'high' as const : 'medium' as const,
        scheduled_date: new Date(Date.now() + (index * 24 * 60 * 60 * 1000)).toISOString(),
        status: 'scheduled' as const,
        title: `${fixture.requires_electrician ? 'Electrical Repair' : 'Maintenance'} - ${fixture.name}`,
        description: `Fixture maintenance needed`,
        estimated_duration: fixture.requires_electrician ? 120 : 30,
        assigned_to: undefined
      })) || [];
    }
  });

  const { data: maintenanceStats } = useQuery({
    queryKey: ['maintenance-stats'],
    queryFn: async () => {
      if (!workItems) return null;
      
      const scheduled = workItems.filter(item => item.status === 'scheduled').length;
      const inProgress = workItems.filter(item => item.status === 'in_progress').length;
      const completed = workItems.filter(item => item.status === 'completed').length;
      const overdue = workItems.filter(item => 
        item.status === 'scheduled' && new Date(item.scheduled_date) < new Date()
      ).length;
      
      return { scheduled, inProgress, completed, overdue };
    },
    enabled: !!workItems
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'scheduled': return <CalendarIcon className="h-4 w-4 text-gray-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'repair': return <Wrench className="h-4 w-4" />;
      case 'replacement': return <AlertTriangle className="h-4 w-4" />;
      case 'inspection': return <CheckCircle className="h-4 w-4" />;
      case 'cleaning': return <Clock className="h-4 w-4" />;
      default: return <Wrench className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-md"></div>
          ))}
        </div>
        <div className="h-96 bg-muted animate-pulse rounded-md"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{maintenanceStats?.scheduled || 0}</div>
              <div className="text-sm text-muted-foreground">Scheduled</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{maintenanceStats?.inProgress || 0}</div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{maintenanceStats?.completed || 0}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{maintenanceStats?.overdue || 0}</div>
              <div className="text-sm text-muted-foreground">Overdue</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="schedule" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
          </TabsList>
          
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Work
          </Button>
        </div>

        <TabsContent value="schedule" className="space-y-4">
          {/* Priority Queue */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Priority Queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {workItems
                  ?.filter(item => item.priority === 'critical' || item.priority === 'high')
                  .slice(0, 5)
                  .map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(item.type)}
                        <div>
                          <div className="font-medium">{item.title}</div>
                          <div className="text-sm text-muted-foreground">{item.description}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(item.priority)}>
                          {item.priority}
                        </Badge>
                        <Button size="sm">
                          Assign
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* All Work Items */}
          <Card>
            <CardHeader>
              <CardTitle>All Scheduled Work</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {workItems?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(item.status)}
                      {getTypeIcon(item.type)}
                      <div>
                        <div className="font-medium">{item.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.description} • {new Date(item.scheduled_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(item.priority)}>
                        {item.priority}
                      </Badge>
                      
                      {item.estimated_duration && (
                        <Badge variant="outline">
                          {item.estimated_duration}min
                        </Badge>
                      )}
                      
                      <Button size="sm" variant="outline">
                        Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
                
                <div className="space-y-4">
                  <h4 className="font-semibold">
                    {selectedDate ? selectedDate.toLocaleDateString() : 'Select a date'}
                  </h4>
                  
                  {selectedDate && (
                    <div className="space-y-2">
                      {workItems
                        ?.filter(item => 
                          new Date(item.scheduled_date).toDateString() === selectedDate.toDateString()
                        )
                        .map((item) => (
                          <div key={item.id} className="p-3 border rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              {getTypeIcon(item.type)}
                              <span className="font-medium">{item.title}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {item.description}
                            </div>
                            <div className="flex gap-2 mt-2">
                              <Badge className={getPriorityColor(item.priority)}>
                                {item.priority}
                              </Badge>
                              {item.estimated_duration && (
                                <Badge variant="outline">
                                  {item.estimated_duration}min
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Maintenance history feature coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendors">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Vendor management feature coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}