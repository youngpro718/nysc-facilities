import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Plus, Trash2, FileCheck, Users, Upload, Download, AlertTriangle, CheckCircle, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRealtime } from "@/hooks/useRealtime";

interface Assignment {
  id: string;
  part: string;
  justice: string;
  room_number: string;
  clerks: string[];
  sergeant?: string;
  tel?: string;
  fax?: string;
}

interface TermTemplateBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssignmentsCreated: (assignments: Assignment[]) => void;
}

export const TermTemplateBuilder = ({ open, onOpenChange, onAssignmentsCreated }: TermTemplateBuilderProps) => {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedAssignments, setSelectedAssignments] = useState<Set<string>>(new Set());
  const [bulkOperation, setBulkOperation] = useState<string>("");
  const [showQuickTemplates, setShowQuickTemplates] = useState(false);

  // Enable real-time updates for court data
  useRealtime({
    table: 'court_assignments',
    queryKeys: ['recent-terms', 'template-assignments', 'common-assignment-values'],
    showToasts: false
  });

  // Fetch recent terms for templates
  const { data: recentTerms } = useQuery({
    queryKey: ["recent-terms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("court_terms")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch court assignments from selected term
  const { data: templateAssignments } = useQuery({
    queryKey: ["template-assignments", selectedTemplate],
    queryFn: async () => {
      if (!selectedTemplate) return [];
      const { data, error } = await supabase
        .from("court_assignments")
        .select("*")
        .eq("term_id", selectedTemplate);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedTemplate,
  });

  // Fetch common values for dropdowns
  const { data: commonValues } = useQuery({
    queryKey: ["common-assignment-values"],
    queryFn: async () => {
      const [justicesRes, partsRes, roomsRes] = await Promise.all([
        supabase.from("court_assignments").select("justice").limit(100),
        supabase.from("court_assignments").select("part").limit(100),
        supabase.from("court_rooms").select("room_number").limit(100),
      ]);

      return {
        justices: [...new Set(justicesRes.data?.map(j => j.justice) || [])],
        parts: [...new Set(partsRes.data?.map(p => p.part) || [])],
        rooms: [...new Set(roomsRes.data?.map(r => r.room_number) || [])],
      };
    },
    enabled: open,
  });

  useEffect(() => {
    if (templateAssignments) {
      const formattedAssignments = templateAssignments.map(ta => ({
        id: crypto.randomUUID(),
        part: ta.part,
        justice: ta.justice,
        room_number: ta.room_number,
        clerks: ta.clerks || [],
        sergeant: ta.sergeant,
        tel: ta.tel,
        fax: ta.fax,
      }));
      setAssignments(formattedAssignments);
    }
  }, [templateAssignments]);

  const addNewAssignment = () => {
    const newAssignment: Assignment = {
      id: crypto.randomUUID(),
      part: "",
      justice: "",
      room_number: "",
      clerks: [],
      sergeant: "",
      tel: "",
      fax: "",
    };
    setAssignments([...assignments, newAssignment]);
  };

  const duplicateAssignment = (index: number) => {
    const assignment = assignments[index];
    const duplicate = {
      ...assignment,
      id: crypto.randomUUID(),
    };
    setAssignments([...assignments.slice(0, index + 1), duplicate, ...assignments.slice(index + 1)]);
  };

  const removeAssignment = (index: number) => {
    setAssignments(assignments.filter((_, i) => i !== index));
  };

  const updateAssignment = (index: number, field: keyof Assignment, value: any) => {
    const updated = [...assignments];
    updated[index] = { ...updated[index], [field]: value };
    setAssignments(updated);
  };

  // Quick template generation
  const quickTemplates = useMemo(() => [
    {
      name: "Criminal Term",
      assignments: [
        { part: "K", justice: "TBD", room_number: "101" },
        { part: "L", justice: "TBD", room_number: "102" },
        { part: "M", justice: "TBD", room_number: "103" },
      ]
    },
    {
      name: "Civil Term", 
      assignments: [
        { part: "1", justice: "TBD", room_number: "201" },
        { part: "2", justice: "TBD", room_number: "202" },
        { part: "3", justice: "TBD", room_number: "203" },
      ]
    }
  ], []);

  // Validation and conflict detection
  const validationResults = useMemo(() => {
    const conflicts = [];
    const roomUsage = new Map();
    
    assignments.forEach((assignment, index) => {
      if (assignment.room_number) {
        if (roomUsage.has(assignment.room_number)) {
          conflicts.push({
            type: 'room_conflict',
            message: `Room ${assignment.room_number} assigned to multiple parts`,
            assignments: [roomUsage.get(assignment.room_number), index]
          });
        } else {
          roomUsage.set(assignment.room_number, index);
        }
      }
      
      if (!assignment.part || !assignment.justice || !assignment.room_number) {
        conflicts.push({
          type: 'incomplete',
          message: 'Missing required fields (Part, Justice, Room)',
          assignments: [index]
        });
      }
    });

    return { conflicts, valid: conflicts.length === 0 };
  }, [assignments]);

  // Bulk operations
  const handleBulkOperation = (operation: string, value?: string) => {
    const selectedIndexes = Array.from(selectedAssignments).map(id => 
      assignments.findIndex(a => a.id === id)
    ).filter(i => i !== -1);

    if (selectedIndexes.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select assignments to perform bulk operations.",
        variant: "destructive",
      });
      return;
    }

    const updated = [...assignments];
    
    switch (operation) {
      case 'delete':
        setAssignments(assignments.filter(a => !selectedAssignments.has(a.id)));
        setSelectedAssignments(new Set());
        break;
      case 'duplicate':
        selectedIndexes.forEach(index => {
          const duplicate = { ...assignments[index], id: crypto.randomUUID() };
          updated.push(duplicate);
        });
        setAssignments(updated);
        break;
      case 'apply_clerks':
        if (value) {
          selectedIndexes.forEach(index => {
            updated[index].clerks = value.split(', ').filter(Boolean);
          });
          setAssignments(updated);
        }
        break;
    }
    
    toast({
      title: "Bulk Operation Complete",
      description: `Applied ${operation} to ${selectedIndexes.length} assignments.`,
    });
  };

  const applyQuickTemplate = (template: typeof quickTemplates[0]) => {
    const newAssignments = template.assignments.map(ta => ({
      id: crypto.randomUUID(),
      part: ta.part,
      justice: ta.justice,
      room_number: ta.room_number,
      clerks: [],
      sergeant: "",
      tel: "",
      fax: "",
    }));
    setAssignments([...assignments, ...newAssignments]);
    toast({
      title: "Template Applied",
      description: `Added ${newAssignments.length} assignments from ${template.name} template.`,
    });
  };

  const handleSubmit = () => {
    const validAssignments = assignments.filter(a => a.part && a.justice && a.room_number);
    
    if (validAssignments.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one valid assignment with Part, Justice, and Room Number.",
        variant: "destructive",
      });
      return;
    }

    if (!validationResults.valid) {
      toast({
        title: "Validation Errors",
        description: "Please resolve conflicts before proceeding.",
        variant: "destructive",
      });
      return;
    }

    onAssignmentsCreated(validAssignments);
    setAssignments([]);
    setSelectedTemplate("");
    setSelectedAssignments(new Set());
    onOpenChange(false);
    
    toast({
      title: "Assignments Created",
      description: `Successfully created ${validAssignments.length} assignments.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Fast Term Builder
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="builder" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="builder">Builder</TabsTrigger>
            <TabsTrigger value="templates">Quick Templates</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
          </TabsList>

          <TabsContent value="builder" className="space-y-6">
            {/* Template Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Start from Template</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a recent term as template" />
                  </SelectTrigger>
                  <SelectContent>
                    {recentTerms?.map((term) => (
                      <SelectItem key={term.id} value={term.id}>
                        {term.term_name} ({term.term_number}) - {term.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="flex gap-2">
                  <Button onClick={addNewAssignment} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Blank Assignment
                  </Button>
                  {assignments.length > 0 && (
                    <Button onClick={() => setAssignments([])}>
                      Clear All
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Validation Results */}
            {assignments.length > 0 && !validationResults.valid && (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardHeader>
                  <CardTitle className="text-lg text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Validation Issues
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {validationResults.conflicts.map((conflict, index) => (
                      <div key={index} className="text-sm text-destructive">
                        • {conflict.message}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Assignment Grid */}
            {assignments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Assignments ({assignments.length})</span>
                    <div className="flex items-center gap-2">
                      {validationResults.valid ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Valid
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {validationResults.conflicts.length} issues
                        </Badge>
                      )}
                      <Badge variant="secondary">
                        <Users className="h-3 w-3 mr-1" />
                        {assignments.filter(a => a.part && a.justice && a.room_number).length} complete
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {assignments.map((assignment, index) => (
                      <div key={assignment.id} className="grid grid-cols-12 gap-2 items-center p-3 border rounded-lg">
                        {/* Selection checkbox */}
                        <div className="col-span-1 flex justify-center">
                          <Checkbox
                            checked={selectedAssignments.has(assignment.id)}
                            onCheckedChange={(checked) => {
                              const newSelected = new Set(selectedAssignments);
                              if (checked) {
                                newSelected.add(assignment.id);
                              } else {
                                newSelected.delete(assignment.id);
                              }
                              setSelectedAssignments(newSelected);
                            }}
                          />
                        </div>

                        {/* Part */}
                        <div className="col-span-2">
                          <Label className="text-xs">Part</Label>
                          <Select 
                            value={assignment.part} 
                            onValueChange={(value) => updateAssignment(index, "part", value)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Part" />
                            </SelectTrigger>
                            <SelectContent>
                              {commonValues?.parts.map((part) => (
                                <SelectItem key={part} value={part}>{part}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Justice */}
                        <div className="col-span-3">
                          <Label className="text-xs">Justice</Label>
                          <Select 
                            value={assignment.justice} 
                            onValueChange={(value) => updateAssignment(index, "justice", value)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Justice" />
                            </SelectTrigger>
                            <SelectContent>
                              {commonValues?.justices.map((justice) => (
                                <SelectItem key={justice} value={justice}>{justice}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Room */}
                        <div className="col-span-2">
                          <Label className="text-xs">Room</Label>
                          <Select 
                            value={assignment.room_number} 
                            onValueChange={(value) => updateAssignment(index, "room_number", value)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Room" />
                            </SelectTrigger>
                            <SelectContent>
                              {commonValues?.rooms.map((room) => (
                                <SelectItem key={room} value={room}>{room}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Clerks */}
                        <div className="col-span-2">
                          <Label className="text-xs">Clerks</Label>
                          <Input
                            className="h-8"
                            value={assignment.clerks.join(", ")}
                            onChange={(e) => updateAssignment(index, "clerks", e.target.value.split(", ").filter(Boolean))}
                            placeholder="Clerk names"
                          />
                        </div>

                        {/* Phone */}
                        <div className="col-span-1">
                          <Label className="text-xs">Phone</Label>
                          <Input
                            className="h-8"
                            value={assignment.tel || ""}
                            onChange={(e) => updateAssignment(index, "tel", e.target.value)}
                            placeholder="Phone"
                          />
                        </div>

                        {/* Actions */}
                        <div className="col-span-1 flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => duplicateAssignment(index)}
                            className="h-8 w-8 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeAssignment(index)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wand2 className="h-5 w-5" />
                  Quick Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickTemplates.map((template) => (
                    <Card key={template.name} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 mb-4">
                          {template.assignments.map((assignment, index) => (
                            <div key={index} className="text-sm text-muted-foreground">
                              Part {assignment.part} - Room {assignment.room_number}
                            </div>
                          ))}
                        </div>
                        <Button 
                          onClick={() => applyQuickTemplate(template)}
                          className="w-full"
                          size="sm"
                        >
                          Apply Template
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bulk Operations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground mb-4">
                  Select assignments in the Builder tab to perform bulk operations.
                  Currently selected: {selectedAssignments.size} assignments
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    onClick={() => handleBulkOperation('duplicate')}
                    disabled={selectedAssignments.size === 0}
                    variant="outline"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate Selected
                  </Button>
                  
                  <Button
                    onClick={() => handleBulkOperation('delete')}
                    disabled={selectedAssignments.size === 0}
                    variant="outline"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </Button>
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="Clerk names..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleBulkOperation('apply_clerks', e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                    <Button
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        handleBulkOperation('apply_clerks', input.value);
                        input.value = '';
                      }}
                      disabled={selectedAssignments.size === 0}
                      variant="outline"
                    >
                      Apply Clerks
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={assignments.filter(a => a.part && a.justice && a.room_number).length === 0}
            >
              Use These Assignments ({assignments.filter(a => a.part && a.justice && a.room_number).length})
            </Button>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};