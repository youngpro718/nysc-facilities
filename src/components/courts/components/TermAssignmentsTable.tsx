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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TermAssignment } from '../types/termTypes';
import { Badge } from '@/components/ui/badge';

interface TermAssignmentsTableProps {
  termId: string;
}

export function TermAssignmentsTable({ termId }: TermAssignmentsTableProps) {
  const { term, assignments, personnel, isLoading, isError } = useTermDetails(termId);
  const [showFull, setShowFull] = useState(false);
  
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
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowFull(!showFull)}
        >
          {showFull ? "Compact View" : "Full Details"}
        </Button>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">{assignment.part?.part_code || assignment.part_code || assignment.part_id || 'N/A'}</TableCell>
                    <TableCell>{assignment.justice_name || 'Not assigned'}</TableCell>
                    <TableCell>
                      {assignment.room ? (
                        <>
                          {assignment.room.room_number || 'No number'} 
                          <span className="text-muted-foreground ml-1">
                            ({assignment.room.name || 'Unnamed room'})
                          </span>
                        </>
                      ) : (
                        assignment.room_number || assignment.room_id || 'No room'
                      )}
                    </TableCell>
                    {showFull && (
                      <>
                        <TableCell>{assignment.fax}</TableCell>
                        <TableCell>{assignment.phone}</TableCell>
                      </>
                    )}
                    <TableCell>{assignment.sergeant_name}</TableCell>
                    <TableCell>
                      {assignment.clerk_names && assignment.clerk_names.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {assignment.clerk_names.map((clerk, i) => (
                            <Badge key={i} variant="secondary" className="font-normal">
                              {clerk}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">None assigned</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
