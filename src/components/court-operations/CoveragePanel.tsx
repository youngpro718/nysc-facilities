import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import { CoverageAssignment, SessionPeriod, BuildingCode } from '@/types/courtSessions';
import { useDeleteCoverageAssignment } from '@/hooks/useCoverageAssignments';
import { CoverageAssignmentDialog } from './CoverageAssignmentDialog';

interface CoveragePanelProps {
  date: Date;
  period: SessionPeriod;
  buildingCode: BuildingCode;
  coverages: CoverageAssignment[];
  isLoading: boolean;
}

export function CoveragePanel({ 
  date, 
  period, 
  buildingCode, 
  coverages, 
  isLoading 
}: CoveragePanelProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoverage, setEditingCoverage] = useState<CoverageAssignment | null>(null);

  const deleteCoverage = useDeleteCoverageAssignment();

  const handleAdd = () => {
    setEditingCoverage(null);
    setDialogOpen(true);
  };

  const handleEdit = (coverage: CoverageAssignment) => {
    setEditingCoverage(coverage);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this coverage assignment?')) return;
    await deleteCoverage.mutateAsync(id);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingCoverage(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Coverage Assignments
            </CardTitle>
            <Button size="sm" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Coverage
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center text-muted-foreground py-4">Loading coverage...</div>
          ) : !coverages || coverages.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              No coverage assignments for {format(date, 'MMMM dd, yyyy')} - {period}
            </div>
          ) : (
            <div className="space-y-3">
              {coverages.map((coverage) => (
                <div
                  key={coverage.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        Room {coverage.court_rooms?.room_number || 'N/A'}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {coverage.absent_staff_role}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Absent:</span>{' '}
                      {coverage.absent_staff_name}
                      {coverage.absence_reason && ` (${coverage.absence_reason})`}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Covering:</span>{' '}
                      {coverage.covering_staff_name}
                      {(coverage.start_time || coverage.end_time) && (
                        <span className="ml-2">
                          {coverage.start_time && format(new Date(`2000-01-01T${coverage.start_time}`), 'h:mm a')}
                          {coverage.start_time && coverage.end_time && ' - '}
                          {coverage.end_time && format(new Date(`2000-01-01T${coverage.end_time}`), 'h:mm a')}
                        </span>
                      )}
                    </div>
                    {coverage.notes && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Notes:</span> {coverage.notes}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(coverage)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(coverage.id)}
                      disabled={deleteCoverage.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CoverageAssignmentDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        date={date}
        period={period}
        buildingCode={buildingCode}
        coverage={editingCoverage}
      />
    </>
  );
}
