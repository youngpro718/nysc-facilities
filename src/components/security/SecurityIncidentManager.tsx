import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle, Eye, Clock, CheckCircle, XCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface SecurityIncident {
  id: string;
  incident_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  affected_resources: string[];
  detection_time: string;
  resolution_time?: string;
  assigned_to?: string;
  metadata: any;
  created_at: string;
  updated_at: string;
}

interface CreateIncidentForm {
  incident_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affected_resources: string;
}

export const SecurityIncidentManager = () => {
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<SecurityIncident | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateIncidentForm>({
    incident_type: '',
    severity: 'medium',
    title: '',
    description: '',
    affected_resources: ''
  });

  const loadIncidents = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('security_incident_tracking')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading incidents:', error);
        toast.error('Failed to load security incidents');
      } else {
        setIncidents(data || []);
      }
    } catch (error) {
      console.error('Error loading incidents:', error);
      toast.error('Failed to load security incidents');
    } finally {
      setIsLoading(false);
    }
  };

  const createIncident = async () => {
    try {
      const { data, error } = await supabase
        .from('security_incident_tracking')
        .insert({
          incident_type: createForm.incident_type,
          severity: createForm.severity,
          title: createForm.title,
          description: createForm.description,
          status: 'open',
          affected_resources: createForm.affected_resources.split(',').map(r => r.trim()).filter(Boolean),
          detection_time: new Date().toISOString(),
          metadata: {}
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating incident:', error);
        toast.error('Failed to create security incident');
      } else {
        toast.success('Security incident created successfully');
        setIncidents(prev => [data, ...prev]);
        setIsCreateDialogOpen(false);
        setCreateForm({
          incident_type: '',
          severity: 'medium',
          title: '',
          description: '',
          affected_resources: ''
        });
      }
    } catch (error) {
      console.error('Error creating incident:', error);
      toast.error('Failed to create security incident');
    }
  };

  const updateIncidentStatus = async (incidentId: string, newStatus: string) => {
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'resolved' || newStatus === 'closed') {
        updateData.resolution_time = new Date().toISOString();
      }

      const { error } = await supabase
        .from('security_incident_tracking')
        .update(updateData)
        .eq('id', incidentId);

      if (error) {
        console.error('Error updating incident:', error);
        toast.error('Failed to update incident status');
      } else {
        toast.success('Incident status updated');
        setIncidents(prev => prev.map(incident => 
          incident.id === incidentId 
            ? { ...incident, ...updateData }
            : incident
        ));
      }
    } catch (error) {
      console.error('Error updating incident:', error);
      toast.error('Failed to update incident status');
    }
  };

  useEffect(() => {
    loadIncidents();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-500';
      case 'investigating': return 'bg-yellow-500';
      case 'resolved': return 'bg-green-500';
      case 'closed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertTriangle className="h-4 w-4" />;
      case 'investigating': return <Eye className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'closed': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse">Loading security incidents...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Security Incident Management</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Incident
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Security Incident</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Incident Type</label>
                <Input
                  value={createForm.incident_type}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, incident_type: e.target.value }))}
                  placeholder="e.g., Data Breach, Unauthorized Access"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Severity</label>
                <Select 
                  value={createForm.severity} 
                  onValueChange={(value) => setCreateForm(prev => ({ ...prev, severity: value as any }))}
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
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={createForm.title}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief incident title"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed incident description"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Affected Resources (comma-separated)</label>
                <Input
                  value={createForm.affected_resources}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, affected_resources: e.target.value }))}
                  placeholder="server1, database_users, etc."
                />
              </div>
              <Button onClick={createIncident} className="w-full">
                Create Incident
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {incidents.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No security incidents recorded</p>
            </CardContent>
          </Card>
        ) : (
          incidents.map((incident) => (
            <Card key={incident.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary" 
                        className={`${getSeverityColor(incident.severity)} text-white`}
                      >
                        {incident.severity}
                      </Badge>
                      <Badge 
                        variant="secondary" 
                        className={`${getStatusColor(incident.status)} text-white flex items-center gap-1`}
                      >
                        {getStatusIcon(incident.status)}
                        {incident.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {incident.incident_type}
                      </span>
                    </div>
                    <CardTitle className="text-lg">{incident.title}</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    {incident.status !== 'resolved' && incident.status !== 'closed' && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => updateIncidentStatus(incident.id, 'investigating')}
                          disabled={incident.status === 'investigating'}
                        >
                          Investigate
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => updateIncidentStatus(incident.id, 'resolved')}
                        >
                          Resolve
                        </Button>
                      </>
                    )}
                    {incident.status === 'resolved' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => updateIncidentStatus(incident.id, 'closed')}
                      >
                        Close
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{incident.description}</p>
                
                {incident.affected_resources && incident.affected_resources.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium mb-1">Affected Resources:</p>
                    <div className="flex flex-wrap gap-1">
                      {incident.affected_resources.map((resource, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {resource}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Detected: {new Date(incident.detection_time).toLocaleString()}</span>
                  {incident.resolution_time && (
                    <span>Resolved: {new Date(incident.resolution_time).toLocaleString()}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};