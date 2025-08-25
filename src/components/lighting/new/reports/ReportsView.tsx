import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
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
  DollarSign, 
  Clock, 
  Zap,
  Calendar
} from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function ReportsView() {
  const { data: statusData } = useQuery({
    queryKey: ['lighting-status-report'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lighting_fixtures')
        .select('status, technology, type');
      
      if (error) throw error;
      
      // Process data for charts
      const statusCounts = data?.reduce((acc: any, fixture) => {
        acc[fixture.status] = (acc[fixture.status] || 0) + 1;
        return acc;
      }, {});
      
      const technologyCounts = data?.reduce((acc: any, fixture) => {
        acc[fixture.technology || 'Unknown'] = (acc[fixture.technology || 'Unknown'] || 0) + 1;
        return acc;
      }, {});
      
      const buildingCounts = { 'Main Building': 15, 'East Wing': 8 }; // Mock data
      
      return {
        statusChart: Object.entries(statusCounts || {}).map(([status, count]) => ({
          name: status.replace('_', ' '),
          value: count,
          percentage: Math.round(((count as number) / (data?.length || 1)) * 100)
        })),
        technologyChart: Object.entries(technologyCounts || {}).map(([tech, count]) => ({
          name: tech,
          value: count,
          percentage: Math.round(((count as number) / (data?.length || 1)) * 100)
        })),
        buildingChart: Object.entries(buildingCounts || {}).map(([building, count]) => ({
          name: building,
          fixtures: count
        }))
      };
    }
  });

  const { data: maintenanceData } = useQuery({
    queryKey: ['lighting-maintenance-report'],
    queryFn: async () => {
      // Simulate maintenance data over time
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      return months.map(month => ({
        month,
        repairs: Math.floor(Math.random() * 20) + 5,
        preventive: Math.floor(Math.random() * 15) + 3,
        replacements: Math.floor(Math.random() * 10) + 1,
        cost: Math.floor(Math.random() * 5000) + 1000
      }));
    }
  });

  const { data: energyData } = useQuery({
    queryKey: ['lighting-energy-report'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lighting_fixtures')
        .select('technology, bulb_count');
      
      if (error) throw error;
      
      // Calculate energy consumption estimates
      const energyRates = { LED: 12, Fluorescent: 32, Bulb: 60 }; // watts per fixture
      
      const consumption = data?.reduce((acc: any, fixture) => {
        const tech = fixture.technology as keyof typeof energyRates;
        const watts = energyRates[tech] || 40;
        const hours = 8; // average hours per day
        const kwh = (watts * hours * (fixture.bulb_count || 1)) / 1000;
        
        acc[tech] = (acc[tech] || 0) + kwh;
        return acc;
      }, {});
      
      return Object.entries(consumption || {}).map(([tech, kwh]) => ({
        technology: tech,
        dailyKwh: Math.round((kwh as number) * 100) / 100,
        monthlyCost: Math.round((kwh as number) * 30 * 0.12 * 100) / 100 // $0.12 per kWh
      }));
    }
  });

  const exportReport = (type: string) => {
    console.log('Exporting report:', type);
    // Implementation would generate and download reports
  };

  return (
    <div className="space-y-6">
      {/* Report Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex gap-2">
              <Select defaultValue="monthly">
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
              
              <Select defaultValue="all">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Buildings</SelectItem>
                  <SelectItem value="building1">Building 1</SelectItem>
                  <SelectItem value="building2">Building 2</SelectItem>
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

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="energy">Energy</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">94%</div>
                    <div className="text-sm text-muted-foreground">Uptime</div>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">$2.4K</div>
                    <div className="text-sm text-muted-foreground">Monthly Cost</div>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">2.1h</div>
                    <div className="text-sm text-muted-foreground">Avg Repair Time</div>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">68%</div>
                    <div className="text-sm text-muted-foreground">LED Adoption</div>
                  </div>
                  <Zap className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Fixture Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData?.statusChart}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData?.statusChart?.map((entry, index) => (
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
                <CardTitle>Technology Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={statusData?.technologyChart}>
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

        <TabsContent value="maintenance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={maintenanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="repairs" stroke="#8884d8" name="Repairs" />
                  <Line type="monotone" dataKey="preventive" stroke="#82ca9d" name="Preventive" />
                  <Line type="monotone" dataKey="replacements" stroke="#ffc658" name="Replacements" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="energy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Energy Consumption by Technology</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {energyData?.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{item.technology}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.dailyKwh} kWh/day
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">${item.monthlyCost}</div>
                      <div className="text-sm text-muted-foreground">monthly</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle>Compliance & Safety</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Compliance reporting feature coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}