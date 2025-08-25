import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLightingFixtures } from "@/hooks/useLightingFixtures";
import { Building, Users, Clock, AlertTriangle, CheckCircle, Send, FileText } from "lucide-react";
import { toast } from "sonner";

interface DCASCoordinationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DCASCoordinationDialog({ open, onOpenChange }: DCASCoordinationDialogProps) {
  const { fixtures } = useLightingFixtures();
  const [activeTab, setActiveTab] = useState("assignments");
  const [newAssignment, setNewAssignment] = useState({
    fixtures: [] as string[],
    priority: "medium",
    description: "",
    estimatedCompletion: ""
  });

  // Mock DCAS assignments data
  const dcasAssignments = [
    {
      id: "DCAS-2024-001",
      title: "Electrical Panel Upgrade - 3rd Floor",
      status: "in_progress",
      priority: "high",
      assignedDate: "2024-01-15",
      estimatedCompletion: "2024-02-15",
      fixtures: ["fix-001", "fix-002", "fix-003"],
      dcasContact: "John Smith",
      description: "Major electrical work requiring DCAS coordination"
    },
    {
      id: "DCAS-2024-002", 
      title: "Emergency Lighting System Review",
      status: "pending",
      priority: "medium",
      assignedDate: "2024-01-20",
      estimatedCompletion: "2024-02-10",
      fixtures: ["fix-004", "fix-005"],
      dcasContact: "Maria Garcia",
      description: "Code compliance review for emergency lighting"
    }
  ];

  const electricianFixtures = fixtures?.filter(f => f.requires_electrician) || [];

  const handleCreateAssignment = () => {
    if (!newAssignment.description.trim()) {
      toast.error("Please provide a description");
      return;
    }

    // In real implementation, this would create the DCAS assignment
    toast.success("DCAS assignment created successfully");
    
    setNewAssignment({
      fixtures: [],
      priority: "medium",
      description: "",
      estimatedCompletion: ""
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'escalated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            DCAS Coordination
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="assignments">Active Assignments</TabsTrigger>
            <TabsTrigger value="new">New Assignment</TabsTrigger>
            <TabsTrigger value="escalation">Escalation</TabsTrigger>
            <TabsTrigger value="tracking">Tracking</TabsTrigger>
          </TabsList>

          <TabsContent value="assignments" className="space-y-4">
            <div className="space-y-4">
              {dcasAssignments.map((assignment) => (
                <Card key={assignment.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{assignment.title}</CardTitle>
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(assignment.status)}>
                          {assignment.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={getPriorityColor(assignment.priority)}>
                          {assignment.priority}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Assignment ID:</span> {assignment.id}
                      </div>
                      <div>
                        <span className="font-medium">DCAS Contact:</span> {assignment.dcasContact}
                      </div>
                      <div>
                        <span className="font-medium">Assigned Date:</span> {assignment.assignedDate}
                      </div>
                      <div>
                        <span className="font-medium">Est. Completion:</span> {assignment.estimatedCompletion}
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium">Description:</span> {assignment.description}
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium">Fixtures:</span> {assignment.fixtures.length} fixtures assigned
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button size="sm" variant="outline">
                        <Send className="h-4 w-4 mr-2" />
                        Contact DCAS
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="new" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create New DCAS Assignment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Priority Level</label>
                    <Select value={newAssignment.priority} onValueChange={(value) => 
                      setNewAssignment(prev => ({ ...prev, priority: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">🔴 Critical</SelectItem>
                        <SelectItem value="high">🟠 High</SelectItem>
                        <SelectItem value="medium">🟡 Medium</SelectItem>
                        <SelectItem value="low">🔵 Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Estimated Completion</label>
                    <Input 
                      type="date"
                      value={newAssignment.estimatedCompletion}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, estimatedCompletion: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description & Requirements</label>
                  <Textarea
                    value={newAssignment.description}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the electrical work needed, safety requirements, and any special considerations..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Affected Fixtures ({electricianFixtures.length} require electrician)
                  </label>
                  <div className="max-h-32 overflow-y-auto border rounded p-2">
                    {electricianFixtures.map((fixture) => (
                      <div key={fixture.id} className="flex items-center space-x-2 py-1">
                        <input
                          type="checkbox"
                          id={fixture.id}
                          checked={newAssignment.fixtures.includes(fixture.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewAssignment(prev => ({ 
                                ...prev, 
                                fixtures: [...prev.fixtures, fixture.id] 
                              }));
                            } else {
                              setNewAssignment(prev => ({ 
                                ...prev, 
                                fixtures: prev.fixtures.filter(id => id !== fixture.id) 
                              }));
                            }
                          }}
                        />
                        <label htmlFor={fixture.id} className="text-sm">
                          {fixture.name} - {fixture.space_name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={handleCreateAssignment} className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Submit to DCAS
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="escalation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Escalation Workflow
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 rounded-md border border-red-200">
                    <h4 className="font-medium text-red-800">Critical Issues Requiring Immediate DCAS Attention</h4>
                    <p className="text-sm text-red-600 mt-1">
                      Issues that affect safety, building codes, or emergency systems must be escalated immediately.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Escalation Triggers:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Emergency lighting failures</li>
                      <li>• Electrical safety hazards</li>
                      <li>• Code compliance violations</li>
                      <li>• Major system failures affecting multiple areas</li>
                    </ul>
                  </div>
                  
                  <Button variant="destructive">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Escalate Critical Issue
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tracking" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  DCAS Communication Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border rounded-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">Initial Assignment Sent</div>
                        <div className="text-sm text-muted-foreground">DCAS-2024-001 submitted for review</div>
                      </div>
                      <div className="text-sm text-muted-foreground">Jan 15, 2024</div>
                    </div>
                  </div>
                  
                  <div className="p-3 border rounded-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">DCAS Acknowledgment</div>
                        <div className="text-sm text-muted-foreground">Assignment received and reviewed by John Smith</div>
                      </div>
                      <div className="text-sm text-muted-foreground">Jan 16, 2024</div>
                    </div>
                  </div>
                  
                  <div className="p-3 border rounded-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">Work In Progress</div>
                        <div className="text-sm text-muted-foreground">Electrical contractor scheduled for Jan 25</div>
                      </div>
                      <div className="text-sm text-muted-foreground">Jan 20, 2024</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}