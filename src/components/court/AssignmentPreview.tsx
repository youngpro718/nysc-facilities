import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ParsedAssignment } from '@/utils/pdfParser';
import { Edit2, Check, X, MapPin, Phone, Users } from 'lucide-react';

interface AssignmentPreviewProps {
  assignments: ParsedAssignment[];
  onAssignmentsUpdate: (assignments: ParsedAssignment[]) => void;
}

export const AssignmentPreview = ({ assignments, onAssignmentsUpdate }: AssignmentPreviewProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editData, setEditData] = useState<ParsedAssignment>({} as ParsedAssignment);

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditData({ ...assignments[index] });
  };

  const saveEdit = () => {
    if (editingIndex === null) return;
    
    const updatedAssignments = [...assignments];
    updatedAssignments[editingIndex] = editData;
    onAssignmentsUpdate(updatedAssignments);
    setEditingIndex(null);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditData({} as ParsedAssignment);
  };

  const removeAssignment = (index: number) => {
    const updatedAssignments = assignments.filter((_, i) => i !== index);
    onAssignmentsUpdate(updatedAssignments);
  };

  if (assignments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No assignments parsed yet. Upload a PDF to see court assignments.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Parsed Court Assignments ({assignments.length})</h3>
        <Badge variant="secondary">{assignments.length} assignments found</Badge>
      </div>

      <div className="grid gap-4 max-h-96 overflow-y-auto">
        {assignments.map((assignment, index) => (
          <Card key={index} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Badge variant="outline">Part {assignment.partCode}</Badge>
                  {editingIndex === index ? (
                    <Input
                      value={editData.justiceName}
                      onChange={(e) => setEditData(prev => ({ ...prev, justiceName: e.target.value }))}
                      className="h-8 font-semibold"
                    />
                  ) : (
                    <span>{assignment.justiceName}</span>
                  )}
                </CardTitle>
                
                <div className="flex gap-1">
                  {editingIndex === index ? (
                    <>
                      <Button size="sm" variant="outline" onClick={saveEdit}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => startEdit(index)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => removeAssignment(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {editingIndex === index ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Room Number</Label>
                    <Input
                      value={editData.roomNumber || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, roomNumber: e.target.value }))}
                      placeholder="Room number"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Extension</Label>
                    <Input
                      value={editData.extension || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, extension: e.target.value }))}
                      placeholder="Phone extension"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Clerk Names (comma separated)</Label>
                    <Input
                      value={editData.clerkNames?.join(', ') || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, clerkNames: e.target.value.split(',').map(n => n.trim()).filter(n => n) }))}
                      placeholder="Clerk names"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Sergeant Name</Label>
                    <Input
                      value={editData.sergeantName || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, sergeantName: e.target.value }))}
                      placeholder="Sergeant name"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {assignment.roomNumber && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>Room {assignment.roomNumber}</span>
                    </div>
                  )}
                  
                  {assignment.extension && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>Ext. {assignment.extension}</span>
                    </div>
                  )}
                  
                  {assignment.clerkNames && assignment.clerkNames.length > 0 && (
                    <div className="col-span-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Clerks:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {assignment.clerkNames.map((clerk, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {clerk}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {assignment.sergeantName && (
                    <div className="col-span-2">
                      <span className="font-medium">Sergeant: </span>
                      <span>{assignment.sergeantName}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};