import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useTermDetails } from '../hooks/useTerms';
import { format } from 'date-fns';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TermAssignment } from '../types/termTypes';
import { Badge } from '@/components/ui/badge';
import { Edit, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TermAssignmentsTableProps {
  termId: string;
}

export function TermAssignmentsTable({ termId }: TermAssignmentsTableProps) {
  const { term, assignments, personnel, isLoading, isError } = useTermDetails(termId);
  const [showFull, setShowFull] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<TermAssignment | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  
  // Function to open edit dialog for an assignment
  const handleEditAssignment = (assignment: TermAssignment) => {
    setEditingAssignment({...assignment});
    setIsEditDialogOpen(true);
  };
  
  // Clerk names handling
  const updateClerkName = (index: number, value: string) => {
    if (!editingAssignment) return;
    
    const clerkNames = [...(editingAssignment.clerk_names || [])];
    clerkNames[index] = value;
    
    setEditingAssignment({
      ...editingAssignment,
      clerk_names: clerkNames
    });
  };
  
  const addClerk = () => {
    if (!editingAssignment) return;
    
    const clerkNames = [...(editingAssignment.clerk_names || [])];
    clerkNames.push('');
    
    setEditingAssignment({
      ...editingAssignment,
      clerk_names: clerkNames
    });
  };
  
  const removeClerk = (index: number) => {
    if (!editingAssignment) return;
    
    const clerkNames = [...(editingAssignment.clerk_names || [])];
    clerkNames.splice(index, 1);
    
    setEditingAssignment({
      ...editingAssignment,
      clerk_names: clerkNames
    });
  };
  
  // Function to save edited assignment
  const saveAssignment = async () => {
    if (!editingAssignment) return;
    
    setIsSaving(true);
    
    try {
      // Update the assignment in the database
      const { error } = await supabase
        .from('term_assignments' as any)
        .update({
          justice_name: editingAssignment.justice_name,
          fax: editingAssignment.fax,
          phone: editingAssignment.phone,
          sergeant_name: editingAssignment.sergeant_name,
          clerk_names: editingAssignment.clerk_names,
          // room_number field removed as it doesn't exist in the database
          // Don't update fields that should not be changed like term_id or part_id
        })
        .eq('id', editingAssignment.id);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Assignment Updated",
        description: "The court assignment has been successfully updated.",
      });
      
      // Close the dialog and refresh data
      setIsEditDialogOpen(false);
      // Refresh the assignments data - this would typically be handled by your data fetching library
      window.location.reload(); // A simple way to refresh the data for now
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update the assignment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }
  
  // Error state
  if (isError) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-500">Error Loading Term Assignments</CardTitle>
          <CardDescription>
            There was a problem loading the term assignment data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Please try refreshing the page or contact support if the problem persists.</p>
          <Button 
            variant="outline" 
            className="mt-4" 
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // No term selected
  if (!term) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Term Selected</CardTitle>
          <CardDescription>
            Please select a term to view assignment details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">This could happen if:</p>
          <ul className="list-disc pl-5 text-muted-foreground text-sm mt-2">
            <li>No term is currently selected</li>
            <li>The database tables for terms have not been created yet</li>
            <li>The term ID is invalid or has been deleted</li>
          </ul>
        </CardContent>
      </Card>
    );
  }
  
  // No assignments
  if (assignments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Assignments Found</CardTitle>
          <CardDescription>
            There are no court assignments for this term.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Import assignments or add them manually.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          Court Assignments
          {term && term.start_date && term.end_date && (
            <span className="ml-2">
              <Badge variant="outline">
                {format(new Date(term.start_date), "MMM d")} - {format(new Date(term.end_date), "MMM d, yyyy")}
              </Badge>
            </span>
          )}
        </h2>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowFull(!showFull)}
          >
            {showFull ? "Compact View" : "Full Details"}
          </Button>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Part</TableHead>
                  <TableHead>Justice</TableHead>
                  <TableHead>Room</TableHead>
                  {showFull && (
                    <>
                      <TableHead>Fax</TableHead>
                      <TableHead>Phone</TableHead>
                    </>
                  )}
                  <TableHead>Sergeant</TableHead>
                  <TableHead>Clerks</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">
                      {getPartCodeDisplay(assignment)}
                    </TableCell>
                    <TableCell>
                      {assignment.justice_name || 'Unassigned'}
                    </TableCell>
                    <TableCell>
                      {getRoomDisplay(assignment)}
                    </TableCell>
                    {showFull && (
                      <>
                        <TableCell>{assignment.fax || 'N/A'}</TableCell>
                        <TableCell>{assignment.phone || 'N/A'}</TableCell>
                      </>
                    )}
                    <TableCell>{assignment.sergeant_name || 'N/A'}</TableCell>
                    <TableCell>
                      {assignment.clerk_names && assignment.clerk_names.length > 0
                        ? assignment.clerk_names.join(', ')
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEditAssignment(assignment)}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Edit Assignment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Court Assignment</DialogTitle>
            <DialogDescription>
              Update the details for this court assignment.
            </DialogDescription>
          </DialogHeader>
          
          {editingAssignment && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="part-code">Part Code</Label>
                  <Input 
                    id="part-code" 
                    value={getPartCodeDisplay(editingAssignment)}
                    disabled
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="justice-name">Justice Name</Label>
                  <Input 
                    id="justice-name" 
                    value={editingAssignment.justice_name || ''}
                    onChange={(e) => setEditingAssignment({
                      ...editingAssignment,
                      justice_name: e.target.value
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="room">Room</Label>
                  <Input 
                    id="room" 
                    value={editingAssignment.room_number || getRoomDisplay(editingAssignment)}
                    onChange={(e) => setEditingAssignment({
                      ...editingAssignment,
                      room_number: e.target.value
                    })}
                    disabled={!!editingAssignment.room?.room_number}
                  />
                  {getRoomDisplay(editingAssignment).includes("Unknown") && (
                    <p className="text-xs text-amber-600">You can edit this unknown room number.</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fax">Fax</Label>
                  <Input 
                    id="fax" 
                    value={editingAssignment.fax || ''}
                    onChange={(e) => setEditingAssignment({
                      ...editingAssignment,
                      fax: e.target.value
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone" 
                    value={editingAssignment.phone || ''}
                    onChange={(e) => setEditingAssignment({
                      ...editingAssignment,
                      phone: e.target.value
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sergeant">Sergeant</Label>
                  <Input 
                    id="sergeant" 
                    value={editingAssignment.sergeant_name || ''}
                    onChange={(e) => setEditingAssignment({
                      ...editingAssignment,
                      sergeant_name: e.target.value
                    })}
                  />
                </div>
                
                <div className="space-y-2 col-span-2">
                  <Label>Clerks</Label>
                  {(editingAssignment.clerk_names || []).map((clerk, index) => (
                    <div key={index} className="flex gap-2 mt-2">
                      <Input
                        value={clerk}
                        onChange={(e) => updateClerkName(index, e.target.value)}
                        placeholder={`Clerk ${index + 1}`}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeClerk(index)}
                        disabled={(editingAssignment.clerk_names || []).length <= 1}
                        type="button"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addClerk}
                    className="mt-2"
                    type="button"
                  >
                    <Plus className="mr-2 h-3 w-3" />
                    Add Clerk
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={saveAssignment} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const getPartCodeDisplay = (assignment: TermAssignment): string => {
  // Try to get part code from different possible sources
  if (assignment.part?.part_code) {
    return assignment.part.part_code;
  }
  
  if (assignment.part_code) {
    return assignment.part_code;
  }
  
  if (assignment.part_id && typeof assignment.part_id === 'string' && assignment.part_id.length > 3) {
    // Extract a substring if it's a UUID
    return assignment.part_id.substring(0, 4);
  }
  
  return 'Unknown Part';
};

const getRoomDisplay = (assignment: TermAssignment): string => {
  if (assignment.room) {
    const roomNumber = assignment.room.room_number || 'No number';
    const roomName = assignment.room.name || 'Unnamed room';
    return `${roomNumber} (${roomName})`;
  }
  
  if (assignment.room_number) {
    return assignment.room_number;
  }
  
  if (assignment.room_id && typeof assignment.room_id === 'string' && assignment.room_id.length > 3) {
    // Extract a substring if it's a UUID
    return `Room ${assignment.room_id.substring(0, 4)}`;
  }
  
  return 'Unknown Room';
};

const renderAssignmentDates = (assignment: TermAssignment): string => {
  const startDate = assignment.start_date ? new Date(assignment.start_date).toLocaleDateString() : 'No start date';
  const endDate = assignment.end_date ? new Date(assignment.end_date).toLocaleDateString() : 'No end date';
  return `${startDate} - ${endDate}`;
};
