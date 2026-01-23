/**
 * AlertsBar Component
 * 
 * Displays important alerts for Court Aides:
 * - Low stock items
 * - Urgent tasks
 * - Overdue items
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Package, Clock, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AlertCounts {
  lowStock: number;
  urgentTasks: number;
  pendingSupplies: number;
}

export function AlertsBar() {
  const { data: alerts, isLoading } = useQuery({
    queryKey: ['court-aide-alerts'],
    queryFn: async (): Promise<AlertCounts> => {
      // Get low stock count
      const { count: lowStockCount } = await supabase
        .from('inventory_items')
        .select('*', { count: 'exact', head: true })
        .lt('quantity', supabase.rpc ? 'minimum_quantity' : 10) // Fallback comparison
        .gt('minimum_quantity', 0);

      // Get urgent tasks count
      const { count: urgentTasksCount } = await supabase
        .from('staff_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('priority', 'urgent')
        .not('status', 'in', '("completed","cancelled","rejected")');

      // Get pending supply requests count
      const { count: pendingSuppliesCount } = await supabase
        .from('supply_requests')
        .select('*', { count: 'exact', head: true })
        .in('status', ['approved', 'in_progress']);

      return {
        lowStock: lowStockCount || 0,
        urgentTasks: urgentTasksCount || 0,
        pendingSupplies: pendingSuppliesCount || 0,
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const hasAlerts = alerts && (alerts.lowStock > 0 || alerts.urgentTasks > 0 || alerts.pendingSupplies > 0);

  if (isLoading || !hasAlerts) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border-amber-500/20">
      <CardContent className="py-3 px-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-amber-600">
            <Bell className="h-4 w-4" />
            <span className="text-sm font-medium">Alerts</span>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            {alerts.lowStock > 0 && (
              <Link to="/inventory?tab=alerts" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {alerts.lowStock} Low Stock
                </Badge>
              </Link>
            )}
            
            {alerts.urgentTasks > 0 && (
              <Link to="/tasks?priority=urgent" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                <Badge className="bg-red-500 text-white flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {alerts.urgentTasks} Urgent Tasks
                </Badge>
              </Link>
            )}
            
            {alerts.pendingSupplies > 0 && (
              <Link to="/supply-room" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                <Badge className="bg-blue-500 text-white flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  {alerts.pendingSupplies} Pending Supplies
                </Badge>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
