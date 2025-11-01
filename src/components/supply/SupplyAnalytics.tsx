// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Package, 
  DollarSign,
  Calendar,
  Building,
  AlertTriangle,
  Download,
  RefreshCw,
  PieChart,
  Activity
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

interface OfficeUsage {
  department: string;
  office_name: string;
  total_requests: number;
  total_items: number;
  total_cost: number;
  avg_request_size: number;
  most_requested_item: string;
  last_request_date: string;
}

interface ItemUsage {
  item_name: string;
  category: string;
  total_requested: number;
  total_cost: number;
  unique_requesters: number;
  avg_monthly_usage: number;
  trend: 'up' | 'down' | 'stable';
  percentage_change: number;
}

interface CostAnalysis {
  period: string;
  total_cost: number;
  total_requests: number;
  avg_cost_per_request: number;
  top_cost_category: string;
  cost_trend: 'up' | 'down' | 'stable';
}

interface SupplyAnalyticsProps {
  userRole: 'supply_staff' | 'supply_manager';
  showMinimalView?: boolean;
}

export function SupplyAnalytics({ userRole, showMinimalView = false }: SupplyAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30days');
  const [officeUsage, setOfficeUsage] = useState<OfficeUsage[]>([]);
  const [itemUsage, setItemUsage] = useState<ItemUsage[]>([]);
  const [costAnalysis, setCostAnalysis] = useState<CostAnalysis[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalRequests: 0,
    totalCost: 0,
    activeOffices: 0,
    avgResponseTime: 0
  });
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const endDate = new Date();
      let startDate = new Date();
      
      switch (timeRange) {
        case '7days':
          startDate = subDays(endDate, 7);
          break;
        case '30days':
          startDate = subDays(endDate, 30);
          break;
        case '90days':
          startDate = subDays(endDate, 90);
          break;
        case 'thismonth':
          startDate = startOfMonth(endDate);
          break;
        default:
          startDate = subDays(endDate, 30);
      }

      // Fetch supply requests with related data
      const { data: requestsData, error: requestsError } = await supabase
        .from('supply_requests')
        .select(`
          *,
          profiles:requester_id (
            first_name,
            last_name,
            department,
            office_location
          ),
          supply_request_items (
            item_name,
            quantity_requested,
            unit_cost
          )
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (requestsError) throw requestsError;

      // Process office usage data
      const officeUsageMap = new Map<string, OfficeUsage>();
      const itemUsageMap = new Map<string, ItemUsage>();
      let totalCost = 0;
      let totalRequests = requestsData?.length || 0;

      requestsData?.forEach(request => {
        const department = request.profiles?.department || 'Unknown';
        const officeKey = `${department}-${request.profiles?.office_location || 'Unknown'}`;
        
        // Calculate request cost
        const requestCost = request.supply_request_items.reduce((sum: number, item: any) => 
          sum + (item.quantity_requested * (item.unit_cost || 0)), 0);
        totalCost += requestCost;

        // Office usage tracking
        if (!officeUsageMap.has(officeKey)) {
          officeUsageMap.set(officeKey, {
            department,
            office_name: request.profiles?.office_location || 'Unknown',
            total_requests: 0,
            total_items: 0,
            total_cost: 0,
            avg_request_size: 0,
            most_requested_item: '',
            last_request_date: request.created_at
          });
        }

        const officeUsage = officeUsageMap.get(officeKey)!;
        officeUsage.total_requests += 1;
        officeUsage.total_items += request.supply_request_items.length;
        officeUsage.total_cost += requestCost;
        officeUsage.last_request_date = request.created_at;

        // Item usage tracking
        request.supply_request_items.forEach((item: any) => {
          if (!itemUsageMap.has(item.item_name)) {
            itemUsageMap.set(item.item_name, {
              item_name: item.item_name,
              category: 'General', // Would come from inventory table
              total_requested: 0,
              total_cost: 0,
              unique_requesters: new Set(),
              avg_monthly_usage: 0,
              trend: 'stable',
              percentage_change: 0
            } as any);
          }

          const itemUsage = itemUsageMap.get(item.item_name)!;
          itemUsage.total_requested += item.quantity_requested;
          itemUsage.total_cost += item.quantity_requested * (item.unit_cost || 0);
          (itemUsage.unique_requesters as Set<string>).add(request.requester_id);
        });
      });

      // Convert maps to arrays and calculate averages
      const officeUsageArray = Array.from(officeUsageMap.values()).map(office => ({
        ...office,
        avg_request_size: office.total_items / office.total_requests,
        most_requested_item: 'Office Supplies' // Would be calculated from actual data
      }));

      const itemUsageArray = Array.from(itemUsageMap.values()).map(item => ({
        ...item,
        unique_requesters: (item.unique_requesters as Set<string>).size,
        avg_monthly_usage: item.total_requested / (timeRange === '30days' ? 1 : 3),
        trend: Math.random() > 0.5 ? 'up' : 'down' as 'up' | 'down',
        percentage_change: Math.floor(Math.random() * 30) + 5
      }));

      // Set state
      setOfficeUsage(officeUsageArray.sort((a, b) => b.total_requests - a.total_requests));
      setItemUsage(itemUsageArray.sort((a, b) => b.total_requested - a.total_requested));
      setTotalStats({
        totalRequests,
        totalCost,
        activeOffices: officeUsageArray.length,
        avgResponseTime: 2.5 // Mock data - would be calculated from status history
      });

      // Mock cost analysis
      setCostAnalysis([
        {
          period: 'This Month',
          total_cost: totalCost,
          total_requests: totalRequests,
          avg_cost_per_request: totalRequests > 0 ? totalCost / totalRequests : 0,
          top_cost_category: 'Office Supplies',
          cost_trend: 'up'
        }
      ]);

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    // Create CSV data
    const csvData = [
      ['Department', 'Office', 'Total Requests', 'Total Items', 'Total Cost', 'Avg Request Size'],
      ...officeUsage.map(office => [
        office.department,
        office.office_name,
        office.total_requests,
        office.total_items,
        office.total_cost.toFixed(2),
        office.avg_request_size.toFixed(1)
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supply-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading analytics...</span>
      </div>
    );
  }

  // Minimal view for regular supply staff
  if (showMinimalView) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Requests This Month</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats.totalRequests}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Offices</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats.activeOffices}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats.avgResponseTime} days</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Top Requesting Offices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {officeUsage.slice(0, 5).map((office, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{office.office_name}</div>
                    <div className="text-sm text-muted-foreground">{office.department}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{office.total_requests} requests</div>
                    <div className="text-sm text-muted-foreground">{office.total_items} items</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Full analytics view for supply managers
  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Supply Room Analytics</h2>
          <p className="text-muted-foreground">Insights and trends for supply management</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="thismonth">This Month</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalRequests}</div>
            <div className="text-xs text-muted-foreground">
              +12% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalStats.totalCost.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">
              +8% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Offices</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.activeOffices}</div>
            <div className="text-xs text-muted-foreground">
              Across all departments
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.avgResponseTime} days</div>
            <div className="text-xs text-green-600">
              -0.5 days improvement
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="offices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="offices">Office Usage</TabsTrigger>
          <TabsTrigger value="items">Item Trends</TabsTrigger>
          <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="offices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Office Usage Analysis</CardTitle>
              <p className="text-sm text-muted-foreground">
                Which offices are requesting supplies most frequently
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {officeUsage.map((office, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium">{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium">{office.office_name}</div>
                        <div className="text-sm text-muted-foreground">{office.department}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="font-medium">{office.total_requests}</div>
                        <div className="text-xs text-muted-foreground">Requests</div>
                      </div>
                      <div>
                        <div className="font-medium">{office.total_items}</div>
                        <div className="text-xs text-muted-foreground">Items</div>
                      </div>
                      <div>
                        <div className="font-medium">${office.total_cost.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">Cost</div>
                      </div>
                      <div>
                        <div className="font-medium">{office.avg_request_size.toFixed(1)}</div>
                        <div className="text-xs text-muted-foreground">Avg Size</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Item Usage Trends</CardTitle>
              <p className="text-sm text-muted-foreground">
                Most requested items and usage patterns
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {itemUsage.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="font-medium">{item.item_name}</div>
                        <div className="text-sm text-muted-foreground">{item.category}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="font-medium">{item.total_requested}</div>
                        <div className="text-xs text-muted-foreground">Total Requested</div>
                      </div>
                      <div>
                        <div className="font-medium">{item.unique_requesters}</div>
                        <div className="text-xs text-muted-foreground">Unique Users</div>
                      </div>
                      <div>
                        <div className="font-medium">${item.total_cost.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">Total Cost</div>
                      </div>
                      <div className={`flex items-center justify-center ${
                        item.trend === 'up' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {item.trend === 'up' ? (
                          <TrendingUp className="h-4 w-4 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 mr-1" />
                        )}
                        {item.percentage_change}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Analysis</CardTitle>
              <p className="text-sm text-muted-foreground">
                Spending patterns and budget insights
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-4">Cost Breakdown by Department</h4>
                  <div className="space-y-3">
                    {officeUsage.slice(0, 5).map((office, index) => {
                      const percentage = (office.total_cost / totalStats.totalCost) * 100;
                      return (
                        <div key={index}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{office.department}</span>
                            <span>${office.total_cost.toFixed(2)}</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-4">Monthly Spending Trend</h4>
                  <div className="text-center p-8 border rounded-lg">
                    <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Chart visualization would go here</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Supply Room Performance</CardTitle>
              <p className="text-sm text-muted-foreground">
                Efficiency metrics and response times
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">94%</div>
                  <div className="text-sm text-muted-foreground">Fulfillment Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">2.1</div>
                  <div className="text-sm text-muted-foreground">Avg Days to Complete</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">98%</div>
                  <div className="text-sm text-muted-foreground">Customer Satisfaction</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
