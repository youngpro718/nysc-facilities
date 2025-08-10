import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Lightbulb, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Plus, 
  Filter, 
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  createLightingIssue, 
  getLightingIssuesWithDetails, 
  updateLightingIssue, 
  getLightingIssueStats,
  getLightingIssuesByStatus 
} from '@/services/supabase/lightingIssuesIntegration';
import { deleteLightingIssue } from '@/services/supabase/lightingIssuesService';
import { fetchLightingFixtures } from '@/services/supabase/lightingService';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface LightingIssuesManagerProps {
  className?: string;
}

export const LightingIssuesManager: React.FC<LightingIssuesManagerProps> = ({ className }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  
  const [newIssue, setNewIssue] = useState<{ 
    fixture_id: string;
    location: string;
    bulb_type: string;
    form_factor: string;
    issue_type: 'blown_bulb' | 'ballast_issue' | 'other';
    notes: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }>({
    fixture_id: '',
    location: '',
    bulb_type: '',
    form_factor: '',
    issue_type: 'blown_bulb',
    notes: '',
    priority: 'medium',
  });

  // Fetch lighting issues
  const { data: issues = [], isLoading, refetch } = useQuery({
    queryKey: ['lighting-issues', selectedStatus],
    queryFn: () => 
      selectedStatus === 'all' 
        ? getLightingIssuesWithDetails() 
        : getLightingIssuesByStatus(selectedStatus as any),
    enabled: !!user,
  });

  // Fetch lighting fixtures
  const { data: fixtures = [] } = useQuery<any[]>({
    queryKey: ['lighting-fixtures'],
    queryFn: fetchLightingFixtures,
    enabled: !!user,
  });

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: ['lighting-stats'],
    queryFn: getLightingIssueStats,
    enabled: !!user,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createLightingIssue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lighting-issues'] });
      queryClient.invalidateQueries({ queryKey: ['lighting-stats'] });
      setShowCreateDialog(false);
      setNewIssue({
        fixture_id: '',
        location: '',
        bulb_type: '',
        form_factor: '',
        issue_type: 'blown_bulb',
        notes: '',
        priority: 'medium',
      });
      toast({
        title: 'Success',
        description: 'Lighting issue created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create lighting issue',
        variant: 'destructive',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateLightingIssue(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lighting-issues'] });
      queryClient.invalidateQueries({ queryKey: ['lighting-stats'] });
      toast({
        title: 'Success',
        description: 'Issue updated successfully',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteLightingIssue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lighting-issues'] });
      queryClient.invalidateQueries({ queryKey: ['lighting-stats'] });
      toast({
        title: 'Success',
        description: 'Issue deleted successfully',
      });
    },
  });

  const handleCreateIssue = () => {
    if (!user?.id) return;
    
    createMutation.mutate({
      ...newIssue,
      reported_by: user.id,
    });
  };

  const handleUpdateStatus = (issueId: string, newStatus: string) => {
    updateMutation.mutate({
      id: issueId,
      data: { status: newStatus as any },
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'deferred':
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'deferred':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getIssueTypeLabel = (type: string) => {
    const labels = {
      'blown_bulb': 'Blown Bulb',
      'ballast_issue': 'Ballast Issue',
      'other': 'Other',
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Lightbulb className="h-6 w-6" />
            Lighting Issues Management
          </h2>
          <p className="text-muted-foreground">
            Track and manage lighting issues across all facilities
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="deferred">Deferred</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Issue
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Open</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.open}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Deferred</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.deferred}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Issues List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading issues...</p>
          </div>
        ) : issues.length === 0 ? (
          <div className="text-center py-8">
            <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No lighting issues found</p>
          </div>
        ) : (
          issues.map((issue) => (
            <Card key={issue.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {getStatusIcon(issue.status)}
                      {issue.fixture_name} - {issue.room_number}
                    </CardTitle>
                    <CardDescription>
                      {issue.building_name} • {issue.floor_name}
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(issue.status)}>
                      {issue.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedIssue(
                        expandedIssue === issue.id ? null : issue.id
                      )}
                    >
                      {expandedIssue === issue.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Issue Type:</span>
                    <Badge variant="outline">
                      {getIssueTypeLabel(issue.issue_type)}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Location:</span>
                    <span className="text-sm">{issue.location}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Bulb Type:</span>
                    <span className="text-sm">{issue.bulb_type}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Reported by:</span>
                    <span className="text-sm">{issue.reported_by_name}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Reported:</span>
                    <span className="text-sm">
                      {new Date(issue.reported_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                {expandedIssue === issue.id && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-4">
                      {issue.notes || 'No additional notes'}
                    </p>
                    
                    <div className="flex gap-2">
                      {issue.status !== 'resolved' && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(issue.issue_id, 'resolved')}
                          disabled={updateMutation.isPending}
                        >
                          Mark Resolved
                        </Button>
                      )}
                      
                      {issue.status === 'open' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(issue.issue_id, 'deferred')}
                          disabled={updateMutation.isPending}
                        >
                          Defer
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteMutation.mutate(issue.id)}
                        disabled={deleteMutation.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Lighting Issue</DialogTitle>
            <DialogDescription>
              Report a new lighting issue for tracking and resolution.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Fixture</Label>
              <Select
                value={newIssue.fixture_id}
                onValueChange={(value) => setNewIssue({ ...newIssue, fixture_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a fixture" />
                </SelectTrigger>
                <SelectContent>
                  {fixtures.map((fixture) => (
                    <SelectItem key={fixture.id} value={fixture.id}>
                      {fixture.name} - {fixture.room_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Location</Label>
              <Input
                value={newIssue.location}
                onChange={(e) => setNewIssue({ ...newIssue, location: e.target.value })}
                placeholder="e.g., Main lobby ceiling light"
              />
            </div>
            
            <div>
              <Label>Bulb Type</Label>
              <Input
                value={newIssue.bulb_type}
                onChange={(e) => setNewIssue({ ...newIssue, bulb_type: e.target.value })}
                placeholder="e.g., LED, Fluorescent, Incandescent"
              />
            </div>
            
            <div>
              <Label>Issue Type</Label>
              <Select
                value={newIssue.issue_type}
                onValueChange={(value) => setNewIssue({ 
                  ...newIssue, 
                  issue_type: value as 'blown_bulb' | 'ballast_issue' | 'other' 
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blown_bulb">Blown Bulb</SelectItem>
                  <SelectItem value="ballast_issue">Ballast Issue</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Priority</Label>
              <Select
                value={newIssue.priority}
                onValueChange={(value) => setNewIssue({ 
                  ...newIssue, 
                  priority: value as 'low' | 'medium' | 'high' | 'critical' 
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                value={newIssue.notes}
                onChange={(e) => setNewIssue({ ...newIssue, notes: e.target.value })}
                placeholder="Additional details about the issue..."
                rows={3}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleCreateIssue} 
              disabled={createMutation.isPending || !newIssue.fixture_id}
            >
              Create Issue
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
