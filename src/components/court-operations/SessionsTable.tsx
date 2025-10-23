import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Save, Trash2, Users, AlertTriangle } from 'lucide-react';
import { CourtSession, CoverageAssignment, SessionPeriod, BuildingCode } from '@/types/courtSessions';
import { useUpdateCourtSession, useDeleteCourtSession } from '@/hooks/useCourtSessions';
import { SESSION_STATUSES } from '@/constants/sessionStatuses';
import { toast } from 'sonner';

interface SessionsTableProps {
  date: Date;
  period: SessionPeriod;
  buildingCode: BuildingCode;
  sessions: CourtSession[];
  coverages: CoverageAssignment[];
  isLoading: boolean;
}

export function SessionsTable({ 
  date, 
  period, 
  buildingCode, 
  sessions, 
  coverages,
  isLoading 
}: SessionsTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<CourtSession>>({});

  const updateSession = useUpdateCourtSession();
  const deleteSession = useDeleteCourtSession();

  const handleEdit = (session: CourtSession) => {
    setEditingId(session.id);
    setEditData(session);
  };

  const handleSave = async (sessionId: string) => {
    if (!editData) return;

    try {
      await updateSession.mutateAsync({
        id: sessionId,
        ...editData,
      });
      setEditingId(null);
      setEditData({});
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;
    await deleteSession.mutateAsync(sessionId);
  };

  const getCoverageForRoom = (courtRoomId: string) => {
    return coverages.find(c => c.court_room_id === courtRoomId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading sessions...</div>
        </CardContent>
      </Card>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            No sessions found for {format(date, 'MMMM dd, yyyy')} - {period}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Court Sessions - {format(date, 'MMMM dd, yyyy')} ({period})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room</TableHead>
                <TableHead>Part</TableHead>
                <TableHead>Judge</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Status Detail</TableHead>
                <TableHead>Est. Finish</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => {
                const isEditing = editingId === session.id;
                const coverage = getCoverageForRoom(session.court_room_id);

                return (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {session.court_rooms?.room_number || 'N/A'}
                        </span>
                        {coverage && (
                          <Badge variant="outline" className="text-xs">
                            <Users className="h-3 w-3 mr-1" />
                            Coverage
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editData.part_number || ''}
                          onChange={(e) => setEditData({ ...editData, part_number: e.target.value })}
                          className="w-24"
                        />
                      ) : (
                        session.part_number || '—'
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editData.judge_name || ''}
                          onChange={(e) => setEditData({ ...editData, judge_name: e.target.value })}
                          className="w-40"
                        />
                      ) : (
                        session.judge_name || '—'
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Select
                          value={editData.status || session.status}
                          onValueChange={(value) => setEditData({ ...editData, status: value })}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SESSION_STATUSES.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="secondary">{session.status}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editData.status_detail || ''}
                          onChange={(e) => setEditData({ ...editData, status_detail: e.target.value })}
                          placeholder="Additional details..."
                        />
                      ) : (
                        session.status_detail || '—'
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <DatePicker
                          value={editData.estimated_finish_date ? new Date(editData.estimated_finish_date) : undefined}
                          onChange={(date) => 
                            setEditData({ 
                              ...editData, 
                              estimated_finish_date: date ? format(date, 'yyyy-MM-dd') : null 
                            })
                          }
                        />
                      ) : (
                        session.estimated_finish_date ? 
                          format(new Date(session.estimated_finish_date), 'MM/dd/yyyy') : 
                          '—'
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Textarea
                          value={editData.notes || ''}
                          onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                          className="min-w-[200px]"
                          rows={2}
                        />
                      ) : (
                        <div className="max-w-[200px] truncate">{session.notes || '—'}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {isEditing ? (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleSave(session.id)}
                              disabled={updateSession.isPending}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancel}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(session)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(session.id)}
                              disabled={deleteSession.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
