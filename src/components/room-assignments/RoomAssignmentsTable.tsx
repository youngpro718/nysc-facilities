import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  RefreshCw, 
  UserCheck,
  History,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { format, addMonths, isAfter, isBefore } from 'date-fns';
import { LoadingState } from '@/components/occupants/LoadingState';
import { ErrorState } from '@/components/occupants/ErrorState';
import { RoomAssignmentWithDetails } from './hooks/useRoomAssignmentsList';
import { EditAssignmentInlineForm } from './EditAssignmentInlineForm';
import { ConfirmationDialog } from './ConfirmationDialog';
import { AssignmentHistoryDialog } from './AssignmentHistoryDialog';
import { ExpirationRenewalDialog } from './ExpirationRenewalDialog';
import { ScheduleDisplayCard } from './ScheduleDisplayCard';

interface RoomAssignmentsTableProps {
  assignments: RoomAssignmentWithDetails[] | undefined;
  isLoading: boolean;
  error: Error | null;
  selectedAssignments: string[];
  onToggleSelect: (assignmentId: string) => void;
  onSelectAll: () => void;
  onUpdateAssignment: (assignmentId: string, updates: Partial<RoomAssignmentWithDetails>) => Promise<void>;
  onDeleteAssignment: (assignmentId: string) => Promise<void>;
  onReassign: (assignment: RoomAssignmentWithDetails) => void;
  onBulkDelete: () => Promise<void>;
  onRefresh: () => void;
}

export function RoomAssignmentsTable({
  assignments,
  isLoading,
  error,
  selectedAssignments,
  onToggleSelect,
  onSelectAll,
  onUpdateAssignment,
  onDeleteAssignment,
  onReassign,
  onBulkDelete,
  onRefresh,
}: RoomAssignmentsTableProps) {
  const [editingAssignment, setEditingAssignment] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    assignmentId: string;
    occupantName: string;
    roomNumber: string;
  }>({
    isOpen: false,
    assignmentId: '',
    occupantName: '',
    roomNumber: ''
  });
  const [historyDialog, setHistoryDialog] = useState<{
    isOpen: boolean;
    assignmentId: string;
    occupantName: string;
    roomNumber: string;
  }>({
    isOpen: false,
    assignmentId: '',
    occupantName: '',
    roomNumber: ''
  });
  const [renewalDialog, setRenewalDialog] = useState<{
    isOpen: boolean;
    assignment: any;
  }>({
    isOpen: false,
    assignment: null
  });
  const [isDeleting, setIsDeleting] = useState(false);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={onRefresh} />;
  }

  if (!assignments || assignments.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No room assignments found</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={onRefresh}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </Card>
    );
  }

  const handleDelete = (assignmentId: string, occupantName: string, roomNumber: string) => {
    setDeleteConfirmation({
      isOpen: true,
      assignmentId,
      occupantName,
      roomNumber
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.assignmentId) return;
    
    setIsDeleting(true);
    try {
      await onDeleteAssignment(deleteConfirmation.assignmentId);
      setDeleteConfirmation({
        isOpen: false,
        assignmentId: '',
        occupantName: '',
        roomNumber: ''
      });
    } catch (error) {
      console.error('Failed to delete assignment:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShowHistory = (assignmentId: string, occupantName: string, roomNumber: string) => {
    setHistoryDialog({
      isOpen: true,
      assignmentId,
      occupantName,
      roomNumber
    });
  };

  const handleRenewal = (assignment: any) => {
    setRenewalDialog({
      isOpen: true,
      assignment
    });
  };

  const handleRenewAssignment = async (data: {
    newExpirationDate: Date;
    renewalPeriod: string;
    notes: string;
  }) => {
    // This would typically call an API to renew the assignment
    console.log('Renewing assignment:', renewalDialog.assignment.id, data);
    // Implement renewal logic here
    setRenewalDialog({ isOpen: false, assignment: null });
  };

  const getExpirationStatus = (expirationDate?: string) => {
    if (!expirationDate) return null;
    
    const expDate = new Date(expirationDate);
    const now = new Date();
    const oneMonthFromNow = addMonths(now, 1);
    
    if (isBefore(expDate, now)) {
      return { status: 'expired', color: 'destructive' as const, text: 'Expired' };
    } else if (isBefore(expDate, oneMonthFromNow)) {
      return { status: 'expiring', color: 'secondary' as const, text: 'Expiring Soon' };
    }
    return null;
  };

  const getAssignmentTypeBadge = (type: string, isPrimary: boolean) => {
    const variant = isPrimary ? "default" : "secondary";
    const label = isPrimary ? "Primary" : "Secondary";
    
    return (
      <div className="flex items-center gap-2">
        <Badge variant={variant} className="text-xs">
          {label}
        </Badge>
        <span className="text-sm">{type.replace(/_/g, " ")}</span>
      </div>
    );
  };

  return (
    <Card>
      {/* Bulk Actions Header */}
      {selectedAssignments.length > 0 && (
        <div className="border-b p-4 bg-muted/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedAssignments.length} assignment(s) selected
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={onBulkDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table className="min-w-max">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    assignments.length > 0 && 
                    selectedAssignments.length === assignments.length
                  }
                  onCheckedChange={onSelectAll}
                />
              </TableHead>
              <TableHead className="xl:w-48">Occupant</TableHead>
              <TableHead className="xl:w-40">Department</TableHead>
              <TableHead className="xl:w-32">Room</TableHead>
              <TableHead className="xl:w-48">Location</TableHead>
              <TableHead className="xl:w-36">Assignment Type</TableHead>
            <TableHead>Assigned Date</TableHead>
            <TableHead>Schedule</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="w-28">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments.map((assignment) => (
            <TableRow
              key={assignment.id}
              className={selectedAssignments.includes(assignment.id) ? "bg-muted/50" : ""}
            >
              <TableCell>
                <Checkbox
                  checked={selectedAssignments.includes(assignment.id)}
                  onCheckedChange={() => onToggleSelect(assignment.id)}
                />
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{assignment.occupant_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {assignment.occupant_email}
                  </div>
                  {getExpirationStatus((assignment as any).expiration_date) && (
                    <div className="mt-1">
                      <Badge 
                        variant={getExpirationStatus((assignment as any).expiration_date)!.color}
                        className="text-xs"
                      >
                        {getExpirationStatus((assignment as any).expiration_date)!.status === 'expired' && (
                          <AlertTriangle className="h-3 w-3 mr-1" />
                        )}
                        {getExpirationStatus((assignment as any).expiration_date)!.text}
                      </Badge>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{assignment.department || "N/A"}</Badge>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{assignment.room_number}</div>
                  <div className="text-sm text-muted-foreground">
                    {assignment.room_name}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div>{assignment.building_name}</div>
                  <div className="text-muted-foreground">{assignment.floor_name}</div>
                </div>
              </TableCell>
              <TableCell>
                {getAssignmentTypeBadge(assignment.assignment_type, assignment.is_primary)}
              </TableCell>
              <TableCell>
                {new Date(assignment.assigned_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {editingAssignment === assignment.id ? (
                  <EditAssignmentInlineForm
                    assignment={assignment}
                    onSave={async (updates) => {
                      await onUpdateAssignment(assignment.id, updates);
                      setEditingAssignment(null);
                    }}
                    onCancel={() => setEditingAssignment(null)}
                  />
                ) : (
                  <div className="max-w-xs">
                    {assignment.schedule && (
                      <ScheduleDisplayCard
                        schedule={typeof assignment.schedule === 'object' 
                          ? `${(assignment.schedule as any)?.days?.length || 0} day(s) scheduled`
                          : assignment.schedule || "Not specified"
                        }
                        assignmentType={assignment.assignment_type || 'general'}
                        roomNumber={assignment.room_number}
                        className="border-none shadow-none p-2"
                      />
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      {assignment.notes || "No notes"}
                    </div>
                  </div>
                )}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-11 w-11 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditingAssignment(
                      editingAssignment === assignment.id ? null : assignment.id
                    )}>
                      <Edit2 className="mr-2 h-4 w-4" />
                      Edit Assignment
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onReassign(assignment)}>
                      <UserCheck className="mr-2 h-4 w-4" />
                      Reassign
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleShowHistory(
                        assignment.id, 
                        assignment.occupant_name,
                        assignment.room_number
                      )}
                    >
                      <History className="mr-2 h-4 w-4" />
                      View History
                    </DropdownMenuItem>
                    {(assignment as any).expiration_date && (
                      <DropdownMenuItem onClick={() => handleRenewal(assignment)}>
                        <Clock className="mr-2 h-4 w-4" />
                        Renew Assignment
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => handleDelete(
                        assignment.id, 
                        assignment.occupant_name,
                        assignment.room_number
                      )}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Assignment
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        </Table>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({
          isOpen: false,
          assignmentId: '',
          occupantName: '',
          roomNumber: ''
        })}
        onConfirm={confirmDelete}
        title="Delete Assignment"
        description={`Are you sure you want to delete the assignment for ${deleteConfirmation.occupantName} in Room ${deleteConfirmation.roomNumber}? This action cannot be undone.`}
        confirmLabel="Delete Assignment"
        isDestructive={true}
        isLoading={isDeleting}
      />

      {/* History Dialog */}
      <AssignmentHistoryDialog
        isOpen={historyDialog.isOpen}
        onClose={() => setHistoryDialog({
          isOpen: false,
          assignmentId: '',
          occupantName: '',
          roomNumber: ''
        })}
        assignmentId={historyDialog.assignmentId}
        occupantName={historyDialog.occupantName}
        roomNumber={historyDialog.roomNumber}
        history={[]} // This would be fetched from an API
      />

      {/* Renewal Dialog */}
      {renewalDialog.assignment && (
        <ExpirationRenewalDialog
          isOpen={renewalDialog.isOpen}
          onClose={() => setRenewalDialog({ isOpen: false, assignment: null })}
          assignment={renewalDialog.assignment}
          onRenew={handleRenewAssignment}
        />
      )}
    </Card>
  );
}