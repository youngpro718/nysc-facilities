import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Package, Clock, CheckCircle, Truck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { AdminKeyOrderCard } from "./AdminKeyOrderCard";

import { KeyOrder } from "@/components/keys/types/OrderTypes";

export const AdminKeyOrdersSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: keyOrders, isLoading, refetch } = useQuery({
    queryKey: ['keyOrders', 'admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('key_orders')
        .select(`
          *,
          key_requests(
            *,
            profiles(first_name, last_name, email)
          ),
          keys(name, type)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as any[]) || [];
    },
  });

  const filteredOrders = keyOrders?.filter(order => {
    const profile = (order as any)?.key_requests?.profiles;
    const matchesSearch = searchQuery === "" || 
      profile?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.notes?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  }) || [];

  const stats = {
    total: keyOrders?.length || 0,
    pending: keyOrders?.filter(o => o.status === 'pending_fulfillment').length || 0,
    inProgress: keyOrders?.filter(o => o.status === 'in_progress').length || 0,
    ready: keyOrders?.filter(o => o.status === 'ready_for_pickup').length || 0,
    completed: keyOrders?.filter(o => o.status === 'completed').length || 0,
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string, notes?: string) => {
    try {
      const { error } = await supabase
        .from('key_orders')
        .update({ 
          status: newStatus as any,
          ...(notes && { notes: notes })
        })
        .eq('id', orderId);

      if (error) throw error;

      toast.success(`Order status updated to ${newStatus.replace('_', ' ')}`);
      refetch();
    } catch (error) {
      console.error('Error updating order status:', error);
      const message = (error as any)?.message || 'Failed to update order status';
      toast.error(message);
    }
  };

  const handleReceiveKeys = async (orderId: string, quantity: number) => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const userId = userData.user?.id;
      if (!userId) throw new Error('Not authenticated');

      const { error } = await supabase.rpc('process_key_order_receipt', {
        p_order_id: orderId,
        p_quantity_received: quantity,
        p_performed_by: userId,
      });

      if (error) throw error;

      toast.success(`Received ${quantity} key${quantity > 1 ? 's' : ''}`);
      refetch();
    } catch (error) {
      console.error('Error receiving keys:', error);
      const message = (error as any)?.message || 'Failed to receive keys';
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Truck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.ready}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by user name, email, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending_fulfillment">Pending Fulfillment</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="ready_for_pickup">Ready for Pickup</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No key orders found</h3>
              <p className="text-muted-foreground text-center">
                {searchQuery || statusFilter !== "all" 
                  ? "Try adjusting your search criteria or filters."
                  : "Key orders will appear here when requests are approved."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => (
            <AdminKeyOrderCard
              key={order.id}
              order={order}
              onStatusUpdate={handleStatusUpdate}
              onReceiveKeys={handleReceiveKeys}
            />
          ))
        )}
      </div>
    </div>
  );
};