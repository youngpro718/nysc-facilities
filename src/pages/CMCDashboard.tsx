import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gavel, AlertCircle, FileText, TrendingUp, Calendar, Users, Package, Plus, Wrench } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { TermSheetBoard } from '@/components/court-operations/personnel/TermSheetBoard';
import { supabase } from '@/lib/supabase';

/**
 * CMC Dashboard - Court Management Coordinator Dashboard
 * 
 * Features:
 * - Court operations overview
 * - Courtroom status
 * - Pending issues
 * - Supply request status
 * - Quick actions
 */
export default function CMCDashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  // Fetch real data for the dashboard
  const { data: supplyRequests = [] } = useQuery({
    queryKey: ['cmc-supply-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('supply_requests')
        .select('id, status')
        .eq('requester_id', user.id)
        .not('status', 'in', '(completed,cancelled)');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: myIssues = [] } = useQuery({
    queryKey: ['cmc-issues', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('issues')
        .select('id, status')
        .eq('reported_by', user.id)
        .not('status', 'in', '(resolved,closed)');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const stats = {
    activeCourtrooms: 28,
    totalCourtrooms: 32,
    pendingIssues: myIssues.length,
    mySupplyRequests: supplyRequests.length,
    upcomingTerms: 2,
  };

  const quickActions = [
    {
      title: 'Court Operations',
      description: 'Manage courtroom assignments and terms',
      icon: Gavel,
      path: '/court-operations',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Report Issue',
      description: 'Report a facility or maintenance issue',
      icon: Wrench,
      path: '/my-issues',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Request Supplies',
      description: 'Order office supplies and materials',
      icon: Package,
      path: '/forms/supply-request',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'My Supply Requests',
      description: 'Track your supply request status',
      icon: FileText,
      path: '/my-supply-requests',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Court Management Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {profile?.first_name || 'Court Manager'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/forms/supply-request')}>
            <Package className="mr-2 h-4 w-4" />
            Request Supplies
          </Button>
          <Button onClick={() => navigate('/court-operations')}>
            <Gavel className="mr-2 h-4 w-4" />
            Court Operations
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courtrooms</CardTitle>
            <Gavel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCourtrooms}/{stats.totalCourtrooms}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((stats.activeCourtrooms / stats.totalCourtrooms) * 100)}% operational
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/my-issues')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Issues</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{stats.pendingIssues}</span>
              {stats.pendingIssues > 0 && (
                <Badge variant="destructive">Active</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Open issues you've reported
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/my-supply-requests')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Supply Requests</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{stats.mySupplyRequests}</span>
              {stats.mySupplyRequests > 0 && (
                <Badge variant="secondary">In Progress</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Active supply requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Terms</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingTerms}</div>
            <p className="text-xs text-muted-foreground">
              Next 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Card
              key={action.path}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(action.path)}
            >
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${action.bgColor} flex items-center justify-center mb-2`}>
                  <action.icon className={`h-6 w-6 ${action.color}`} />
                </div>
                <CardTitle>{action.title}</CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your recent court management activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Courtroom 301 assignment updated</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Supply request approved</p>
                <p className="text-xs text-muted-foreground">5 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-yellow-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Issue reported in Courtroom 205</p>
                <p className="text-xs text-muted-foreground">1 day ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Court Operations Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Courtroom Status</CardTitle>
            <CardDescription>Current operational status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Operational</span>
                <span className="text-sm font-medium">{stats.activeCourtrooms}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Under Maintenance</span>
                <span className="text-sm font-medium">{stats.totalCourtrooms - stats.activeCourtrooms}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total</span>
                <span className="text-sm font-medium">{stats.totalCourtrooms}</span>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => navigate('/court-operations')}
            >
              View All Courtrooms
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>This month's overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Terms Scheduled</span>
                <span className="text-sm font-medium">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Issues Resolved</span>
                <span className="text-sm font-medium">8</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Avg. Response Time</span>
                <span className="text-sm font-medium">2.5 hrs</span>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => navigate('/operations')}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              View Analytics
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Term Sheet - Court Assignments Reference */}
      <div className="mt-6">
        <TermSheetBoard />
      </div>
    </div>
  );
}
