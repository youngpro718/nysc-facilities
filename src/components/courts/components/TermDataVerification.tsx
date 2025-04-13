import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TermImportData } from '../types/termTypes';
import { format } from 'date-fns';

interface TermDataVerificationProps {
  data: TermImportData;
  onConfirm: (data: TermImportData) => void;
  onCancel: () => void;
}

export function TermDataVerification({ data, onConfirm, onCancel }: TermDataVerificationProps) {
  const [editedData, setEditedData] = useState(data);
  const [activeTab, setActiveTab] = useState('term');
  
  const formatDateForInput = (isoDate: string) => {
    if (!isoDate) return '';
    return isoDate.split('T')[0];
  };
  
  const handleConfirm = () => {
    onConfirm(editedData);
  };
  
  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="term">Term Details</TabsTrigger>
          <TabsTrigger value="assignments">Court Assignments</TabsTrigger>
          <TabsTrigger value="personnel">Personnel</TabsTrigger>
        </TabsList>
        
        {/* Term Details Tab */}
        <TabsContent value="term" className="space-y-4">
          <h3 className="text-lg font-medium">Term Details</h3>
          <p className="text-sm text-muted-foreground">
            Verify the basic term information.
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="term-number">Term Number</Label>
              <Input 
                id="term-number" 
                value={editedData.term.term_number || ''} 
                onChange={e => setEditedData({
                  ...editedData, 
                  term: { ...editedData.term, term_number: e.target.value }
                })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="term-name">Term Name</Label>
              <Input 
                id="term-name" 
                value={editedData.term.term_name || ''} 
                onChange={e => setEditedData({
                  ...editedData, 
                  term: { ...editedData.term, term_name: e.target.value }
                })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input 
                id="start-date" 
                type="date" 
                value={formatDateForInput(editedData.term.start_date as string)} 
                onChange={e => setEditedData({
                  ...editedData, 
                  term: { ...editedData.term, start_date: e.target.value }
                })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input 
                id="end-date" 
                type="date" 
                value={formatDateForInput(editedData.term.end_date as string)} 
                onChange={e => setEditedData({
                  ...editedData, 
                  term: { ...editedData.term, end_date: e.target.value }
                })}
              />
            </div>
            
            <div className="space-y-2 col-span-2">
              <Label htmlFor="location">Location</Label>
              <Input 
                id="location" 
                value={editedData.term.location || ''} 
                onChange={e => setEditedData({
                  ...editedData, 
                  term: { ...editedData.term, location: e.target.value }
                })}
              />
            </div>
            
            <div className="space-y-2 col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input 
                id="description" 
                value={editedData.term.description || ''} 
                onChange={e => setEditedData({
                  ...editedData, 
                  term: { ...editedData.term, description: e.target.value }
                })}
              />
            </div>
          </div>
        </TabsContent>
        
        {/* Court Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          <h3 className="text-lg font-medium">Court Assignments</h3>
          <p className="text-sm text-muted-foreground">
            Verify the extracted court assignment information.
          </p>
          
          <div className="rounded-md border">
            <div className="relative max-h-[400px] overflow-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 bg-background">
                  <tr className="border-b">
                    <th className="h-10 px-4 text-left font-medium">Part</th>
                    <th className="h-10 px-4 text-left font-medium">Justice</th>
                    <th className="h-10 px-4 text-left font-medium">Room</th>
                    <th className="h-10 px-4 text-left font-medium">Fax</th>
                    <th className="h-10 px-4 text-left font-medium">Phone</th>
                    <th className="h-10 px-4 text-left font-medium">Sergeant</th>
                    <th className="h-10 px-4 text-left font-medium">Clerks</th>
                  </tr>
                </thead>
                <tbody>
                  {editedData.assignments.map((assignment, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2 align-middle">
                        <Input 
                          value={assignment.part_code || ''} 
                          onChange={e => {
                            const newAssignments = [...editedData.assignments];
                            newAssignments[index] = {
                              ...newAssignments[index],
                              part_code: e.target.value
                            };
                            setEditedData({
                              ...editedData,
                              assignments: newAssignments
                            });
                          }}
                          className="h-8"
                        />
                      </td>
                      <td className="p-2 align-middle">
                        <Input 
                          value={assignment.justice_name || ''} 
                          onChange={e => {
                            const newAssignments = [...editedData.assignments];
                            newAssignments[index] = {
                              ...newAssignments[index],
                              justice_name: e.target.value
                            };
                            setEditedData({
                              ...editedData,
                              assignments: newAssignments
                            });
                          }}
                          className="h-8"
                        />
                      </td>
                      <td className="p-2 align-middle">
                        <Input 
                          value={assignment.room_number || ''} 
                          onChange={e => {
                            const newAssignments = [...editedData.assignments];
                            newAssignments[index] = {
                              ...newAssignments[index],
                              room_number: e.target.value
                            };
                            setEditedData({
                              ...editedData,
                              assignments: newAssignments
                            });
                          }}
                          className="h-8"
                        />
                      </td>
                      <td className="p-2 align-middle">
                        <Input 
                          value={assignment.fax || ''} 
                          onChange={e => {
                            const newAssignments = [...editedData.assignments];
                            newAssignments[index] = {
                              ...newAssignments[index],
                              fax: e.target.value
                            };
                            setEditedData({
                              ...editedData,
                              assignments: newAssignments
                            });
                          }}
                          className="h-8"
                        />
                      </td>
                      <td className="p-2 align-middle">
                        <Input 
                          value={assignment.phone || ''} 
                          onChange={e => {
                            const newAssignments = [...editedData.assignments];
                            newAssignments[index] = {
                              ...newAssignments[index],
                              phone: e.target.value
                            };
                            setEditedData({
                              ...editedData,
                              assignments: newAssignments
                            });
                          }}
                          className="h-8"
                        />
                      </td>
                      <td className="p-2 align-middle">
                        <Input 
                          value={assignment.sergeant_name || ''} 
                          onChange={e => {
                            const newAssignments = [...editedData.assignments];
                            newAssignments[index] = {
                              ...newAssignments[index],
                              sergeant_name: e.target.value
                            };
                            setEditedData({
                              ...editedData,
                              assignments: newAssignments
                            });
                          }}
                          className="h-8"
                        />
                      </td>
                      <td className="p-2 align-middle">
                        <Input 
                          value={assignment.clerk_names ? assignment.clerk_names.join(', ') : ''} 
                          onChange={e => {
                            const newAssignments = [...editedData.assignments];
                            newAssignments[index] = {
                              ...newAssignments[index],
                              clerk_names: e.target.value.split(',').map(name => name.trim())
                            };
                            setEditedData({
                              ...editedData,
                              assignments: newAssignments
                            });
                          }}
                          className="h-8"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setEditedData({
                ...editedData,
                assignments: [
                  ...editedData.assignments,
                  { part_code: '', justice_name: '', room_number: '', room_id: '' }
                ]
              });
            }}
          >
            Add Assignment
          </Button>
        </TabsContent>
        
        {/* Personnel Tab */}
        <TabsContent value="personnel" className="space-y-4">
          <h3 className="text-lg font-medium">Court Personnel</h3>
          <p className="text-sm text-muted-foreground">
            Verify the extracted personnel information.
          </p>
          
          <div className="rounded-md border">
            <div className="relative max-h-[400px] overflow-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 bg-background">
                  <tr className="border-b">
                    <th className="h-10 px-4 text-left font-medium">Role</th>
                    <th className="h-10 px-4 text-left font-medium">Name</th>
                    <th className="h-10 px-4 text-left font-medium">Phone</th>
                    <th className="h-10 px-4 text-left font-medium">Extension</th>
                  </tr>
                </thead>
                <tbody>
                  {editedData.personnel.map((person, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2 align-middle">
                        <Input 
                          value={person.role || ''} 
                          onChange={e => {
                            const newPersonnel = [...editedData.personnel];
                            newPersonnel[index] = {
                              ...newPersonnel[index],
                              role: e.target.value as any
                            };
                            setEditedData({
                              ...editedData,
                              personnel: newPersonnel
                            });
                          }}
                          className="h-8"
                        />
                      </td>
                      <td className="p-2 align-middle">
                        <Input 
                          value={person.name || ''} 
                          onChange={e => {
                            const newPersonnel = [...editedData.personnel];
                            newPersonnel[index] = {
                              ...newPersonnel[index],
                              name: e.target.value
                            };
                            setEditedData({
                              ...editedData,
                              personnel: newPersonnel
                            });
                          }}
                          className="h-8"
                        />
                      </td>
                      <td className="p-2 align-middle">
                        <Input 
                          value={person.phone || ''} 
                          onChange={e => {
                            const newPersonnel = [...editedData.personnel];
                            newPersonnel[index] = {
                              ...newPersonnel[index],
                              phone: e.target.value
                            };
                            setEditedData({
                              ...editedData,
                              personnel: newPersonnel
                            });
                          }}
                          className="h-8"
                        />
                      </td>
                      <td className="p-2 align-middle">
                        <Input 
                          value={person.extension || ''} 
                          onChange={e => {
                            const newPersonnel = [...editedData.personnel];
                            newPersonnel[index] = {
                              ...newPersonnel[index],
                              extension: e.target.value
                            };
                            setEditedData({
                              ...editedData,
                              personnel: newPersonnel
                            });
                          }}
                          className="h-8"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setEditedData({
                ...editedData,
                personnel: [
                  ...editedData.personnel,
                  { role: 'administrative_judge', name: '' }
                ]
              });
            }}
          >
            Add Personnel
          </Button>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Back
        </Button>
        <Button onClick={handleConfirm}>
          Confirm & Import
        </Button>
      </div>
    </div>
  );
}
