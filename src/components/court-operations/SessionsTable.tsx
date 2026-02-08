import { useState } from 'react';
import { logger } from '@/lib/logger';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Save, Trash2, Users, AlertTriangle, UserX, Calendar as CalendarIcon } from 'lucide-react';
import { CourtSession, CoverageAssignment, SessionPeriod, BuildingCode } from '@/types/courtSessions';
import { useUpdateCourtSession, useDeleteCourtSession } from '@/hooks/useCourtSessions';
import { useAbsentStaffNames } from '@/hooks/useStaffAbsences';
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
  
  // Get absent staff for this date
  const { absentStaffMap, isLoading: absencesLoading } = useAbsentStaffNames(date);

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
      logger.error('Error saving session:', error);
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
                <TableHead>Part / Judge</TableHead>
                <TableHead>Parts Ent By</TableHead>
                <TableHead>Defendants</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Date Tran/Start</TableHead>
                <TableHead>Top Charge</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Attorney</TableHead>
                <TableHead>Est. Date Fin</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => {
                const isEditing = editingId === session.id;
                const coverage = getCoverageForRoom(session.court_room_id);

                return (
                  <TableRow key={session.id}>
                    {/* Part / Judge */}
                    <TableCell>
                      <div className="space-y-1">
                        {isEditing ? (
                          <>
                            <Input
                              value={editData.part_number || ''}
                              onChange={(e) => setEditData({ ...editData, part_number: e.target.value })}
                              placeholder="Part"
                              className="w-24"
                            />
                            <Input
                              value={editData.judge_name || ''}
                              onChange={(e) => setEditData({ ...editData, judge_name: e.target.value })}
                              placeholder="Judge"
                              className="w-40"
                            />
                          </>
                        ) : (
                          <>
                            <div className="font-medium">{session.part_number || '—'}</div>
                            <div className="flex items-center gap-2">
                              <div className="text-sm text-muted-foreground">{session.judge_name || '—'}</div>
                              {session.judge_name && absentStaffMap.has(session.judge_name.toLowerCase()) && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge variant="destructive" className="text-xs flex items-center gap-1">
                                        <UserX className="h-3 w-3" />
                                        Absent
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <div className="space-y-1">
                                        <p className="font-semibold">{session.judge_name} is absent</p>
                                        <p className="text-xs">
                                          Reason: {absentStaffMap.get(session.judge_name.toLowerCase())?.absence_reason}
                                        </p>
                                        <p className="text-xs">
                                          {format(new Date(absentStaffMap.get(session.judge_name.toLowerCase())!.starts_on), 'MM/dd/yyyy')} - {format(new Date(absentStaffMap.get(session.judge_name.toLowerCase())!.ends_on), 'MM/dd/yyyy')}
                                        </p>
                                        {absentStaffMap.get(session.judge_name.toLowerCase())?.notes && (
                                          <p className="text-xs italic">
                                            {absentStaffMap.get(session.judge_name.toLowerCase())?.notes}
                                          </p>
                                        )}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </TableCell>
                    
                    {/* Parts Ent By */}
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editData.parts_entered_by || ''}
                          onChange={(e) => setEditData({ ...editData, parts_entered_by: e.target.value })}
                          placeholder="Entered by..."
                        />
                      ) : (
                        session.parts_entered_by || '—'
                      )}
                    </TableCell>
                    
                    {/* Defendants */}
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editData.defendants || ''}
                          onChange={(e) => setEditData({ ...editData, defendants: e.target.value })}
                          placeholder="Defendants..."
                        />
                      ) : (
                        session.defendants || '—'
                      )}
                    </TableCell>
                    
                    {/* Purpose */}
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editData.purpose || ''}
                          onChange={(e) => setEditData({ ...editData, purpose: e.target.value })}
                          placeholder="Purpose..."
                        />
                      ) : (
                        session.purpose || '—'
                      )}
                    </TableCell>
                    
                    {/* Date Tran/Start */}
                    <TableCell>
                      {isEditing ? (
                        <DatePicker
                          value={editData.date_transferred_or_started ? new Date(editData.date_transferred_or_started) : undefined}
                          onChange={(date) => 
                            setEditData({ 
                              ...editData, 
                              date_transferred_or_started: date ? format(date, 'yyyy-MM-dd') : null 
                            })
                          }
                        />
                      ) : (
                        session.date_transferred_or_started ? 
                          format(new Date(session.date_transferred_or_started), 'MM/dd/yyyy') : 
                          '—'
                      )}
                    </TableCell>
                    
                    {/* Top Charge */}
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editData.top_charge || ''}
                          onChange={(e) => setEditData({ ...editData, top_charge: e.target.value })}
                          placeholder="Top charge..."
                        />
                      ) : (
                        session.top_charge || '—'
                      )}
                    </TableCell>
                    
                    {/* Status */}
                    <TableCell>
                      {isEditing ? (
                        <div className="space-y-2">
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
                          <div className="flex gap-1">
                            <Input
                              value={editData.status_detail || ''}
                              onChange={(e) => setEditData({ ...editData, status_detail: e.target.value })}
                              placeholder="Detail (e.g., 10/23)"
                              className="w-32"
                            />
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" type="button" className="px-2">
                                  <CalendarIcon className="h-3 w-3" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="end">
                                <Calendar
                                  mode="single"
                                  selected={undefined}
                                  onSelect={(selectedDate) => {
                                    if (selectedDate) {
                                      const dateStr = format(selectedDate, 'MM/dd');
                                      setEditData({ 
                                        ...editData, 
                                        status_detail: editData.status_detail ? `${editData.status_detail} ${dateStr}` : dateStr 
                                      });
                                    }
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <Badge variant="secondary">{session.status}</Badge>
                          {session.status_detail && (
                            <div className="text-xs text-muted-foreground">{session.status_detail}</div>
                          )}
                        </div>
                      )}
                    </TableCell>
                    
                    {/* Attorney */}
                    <TableCell>
                      {isEditing ? (
                        <Input
                          value={editData.attorney || ''}
                          onChange={(e) => setEditData({ ...editData, attorney: e.target.value })}
                          placeholder="Attorney..."
                        />
                      ) : (
                        session.attorney || '—'
                      )}
                    </TableCell>
                    
                    {/* Est. Date Fin */}
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
