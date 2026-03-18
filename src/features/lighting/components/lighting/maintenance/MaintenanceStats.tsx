
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Legend
} from "recharts";

export function MaintenanceStats() {
  // Fetch maintenance data by type
  const { data: maintenanceByType, isLoading: loadingTypeStats } = useQuery({
    queryKey: ['maintenance-type-stats'],
    queryFn: async () => {
      // In a real implementation, this would fetch from your database or create a view
      // For demo purposes, we'll use placeholder data
      return [
        { name: 'Bulb Replacement', count: 42, percentage: 42 },
        { name: 'Ballast Repair', count: 23, percentage: 23 },
        { name: 'Wiring Issues', count: 18, percentage: 18 },
        { name: 'Fixture Replacement', count: 12, percentage: 12 },
        { name: 'Other', count: 5, percentage: 5 },
      ];
    }
  });
  
  // Fetch maintenance data by month
  const { data: maintenanceByMonth, isLoading: loadingMonthlyStats } = useQuery({
    queryKey: ['maintenance-monthly-stats'],
    queryFn: async () => {
      // In a real implementation, this would fetch aggregated data from your database
      // For demo purposes, we'll use placeholder data
      return [
        { month: 'Jan', completed: 12, scheduled: 15 },
        { month: 'Feb', completed: 18, scheduled: 20 },
        { month: 'Mar', completed: 14, scheduled: 15 },
        { month: 'Apr', completed: 22, scheduled: 25 },
        { month: 'May', completed: 16, scheduled: 18 },
        { month: 'Jun', completed: 19, scheduled: 19 },
      ];
    }
  });
  
  // Fetch efficiency data
  const { data: efficiencyData, isLoading: loadingEfficiency } = useQuery({
    queryKey: ['maintenance-efficiency'],
    queryFn: async () => {
      // In a real implementation, this would calculate efficiency metrics
      // For demo purposes, we'll use placeholder data
      return {
        onTimeCompletion: 87,
        averageResolutionDays: 2.3,
        pendingRequests: 7,
        completionRateByPriority: {
          high: 94,
          medium: 86,
          low: 72
        }
      };
    }
  });
  
  // For the pie chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  if (loadingTypeStats || loadingMonthlyStats || loadingEfficiency) {
    return <div className="flex justify-center p-8">Loading maintenance statistics...</div>;
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">On-time Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {efficiencyData?.onTimeCompletion}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Tasks completed on schedule</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg Resolution Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {efficiencyData?.averageResolutionDays} days
            </div>
            <p className="text-xs text-muted-foreground mt-1">From report to resolution</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {efficiencyData?.pendingRequests}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting scheduling</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">High Priority Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {efficiencyData?.completionRateByPriority.high}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">On-time resolution rate</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Maintenance by Type</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={maintenanceByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {maintenanceByType?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => [`${value} tasks`, name]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Monthly Maintenance Activity</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={maintenanceByMonth}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 0,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="scheduled" fill="#8884d8" name="Scheduled" />
                  <Bar dataKey="completed" fill="#82ca9d" name="Completed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Completion Rate by Priority</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col items-center">
              <div className="text-lg font-semibold text-red-600 dark:text-red-400">High Priority</div>
              <div className="text-3xl font-bold">{efficiencyData?.completionRateByPriority.high}%</div>
              <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                <div 
                  className="h-full bg-red-600 rounded-full" 
                  style={{ width: `${efficiencyData?.completionRateByPriority.high}%` }}
                />
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="text-lg font-semibold text-amber-600">Medium Priority</div>
              <div className="text-3xl font-bold">{efficiencyData?.completionRateByPriority.medium}%</div>
              <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                <div 
                  className="h-full bg-amber-600 rounded-full" 
                  style={{ width: `${efficiencyData?.completionRateByPriority.medium}%` }}
                />
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">Low Priority</div>
              <div className="text-3xl font-bold">{efficiencyData?.completionRateByPriority.low}%</div>
              <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                <div 
                  className="h-full bg-blue-600 rounded-full" 
                  style={{ width: `${efficiencyData?.completionRateByPriority.low}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
