import { useState } from 'react';
import { logger } from '@/lib/logger';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Save, Trash2, UserX, Calendar as CalendarIcon, FileText } from 'lucide-react';
import { CourtSession, CoverageAssignment, SessionPeriod, BuildingCode } from '@/types/courtSessions';
import { useUpdateCourtSession, useDeleteCourtSession } from '@/hooks/useCourtSessions';
import { useAbsentStaffNames } from '@/hooks/useStaffAbsences';
import { SESSION_STATUSES, BUILDING_CODES } from '@/constants/sessionStatuses';
import { toast } from 'sonner';

interface SessionsTableProps {
  date: Date;
  period: SessionPeriod;
  buildingCode: BuildingCode;
  sessions: CourtSession[];
  coverages: CoverageAssignment[];
  isLoading: boolean;
}

// Building label lookup
const buildingLabel = (code: string) =>
  BUILDING_CODES.find(b => b.value === code)?.label?.toUpperCase() || code;

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

  // Get judge absence info as inline text (like the PDF shows)
  const getJudgeAbsenceText = (judgeName: string | null) => {
    if (!judgeName) return null;
    const absenceInfo = absentStaffMap.get(judgeName.toLowerCase());
    if (!absenceInfo) return null;

    const startStr = format(new Date(absenceInfo.starts_on), 'M/dd');
    const endStr = format(new Date(absenceInfo.ends_on), 'M/dd');
    const reason = absenceInfo.absence_reason || 'OUT';

    return `OUT ${startStr}-${endStr}${reason !== 'OUT' ? ` ${reason.toUpperCase()}` : ''}`;
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

  // Format the report date like the PDF: "11-21-25"
  const reportDateStr = format(date, 'M-dd-yy');

  return (
    <Card className="overflow-hidden">
      {/* Report-style header — matches the PDF */}
      <div className="bg-primary/5 border-b px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
            <h2 className="text-sm sm:text-base md:text-lg font-bold tracking-tight uppercase">
              {reportDateStr} {period} Report — {buildingLabel(buildingCode)}
            </h2>
          </div>
          <Badge variant="secondary" className="w-fit text-xs">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      <CardContent className="p-0">
        <div className="overflow-x-auto" style={{ boxShadow: 'inset -12px 0 8px -8px rgba(0,0,0,0.06)' }}>
          <Table className="text-xs sm:text-sm">
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="py-2 px-2 sm:px-3 font-bold whitespace-nowrap w-[140px]">Room / Part</TableHead>
                <TableHead className="py-2 px-2 sm:px-3 font-bold whitespace-nowrap">Sending Part</TableHead>
                <TableHead className="py-2 px-2 sm:px-3 font-bold whitespace-nowrap">Defendant(s)</TableHead>
                <TableHead className="py-2 px-2 sm:px-3 font-bold whitespace-nowrap">P.U.R.P.</TableHead>
                <TableHead className="py-2 px-2 sm:px-3 font-bold whitespace-nowrap">Date Trans</TableHead>
                <TableHead className="py-2 px-2 sm:px-3 font-bold whitespace-nowrap">Top Charge</TableHead>
                <TableHead className="py-2 px-2 sm:px-3 font-bold whitespace-nowrap">Status</TableHead>
                <TableHead className="py-2 px-2 sm:px-3 font-bold whitespace-nowrap">Attorneys</TableHead>
                <TableHead className="py-2 px-2 sm:px-3 font-bold whitespace-nowrap">Est. Fin.</TableHead>
                <TableHead className="py-2 px-2 sm:px-3 font-bold whitespace-nowrap w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => {
                const isEditing = editingId === session.id;
                const coverage = getCoverageForRoom(session.court_room_id);
                const absenceText = getJudgeAbsenceText(session.judge_name);
                const roomNumber = session.court_rooms?.room_number || '—';

                return (
                  <TableRow
                    key={session.id}
                    className={`hover:bg-muted/30 ${isEditing ? 'bg-primary/5' : ''}`}
                  >
                    {/* Room / Part / Judge — matches the PDF's first column */}
                    <TableCell className="py-1.5 px-2 sm:px-3 align-top">
                      {isEditing ? (
                        <div className="space-y-1">
                          <Input
                            value={editData.part_number || ''}
                            onChange={(e) => setEditData({ ...editData, part_number: e.target.value })}
                            placeholder="Part"
                            className="h-7 text-xs w-20"
                          />
                          <Input
                            value={editData.judge_name || ''}
                            onChange={(e) => setEditData({ ...editData, judge_name: e.target.value })}
                            placeholder="Judge"
                            className="h-7 text-xs w-32"
                          />
                        </div>
                      ) : (
                        <div className="space-y-0.5 min-w-[110px]">
                          <div className="font-bold text-xs sm:text-sm">{roomNumber}</div>
                          {session.part_number && (
                            <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
                              {session.part_number}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground font-medium truncate max-w-[130px]">
                            {session.judge_name || '—'}
                          </div>
                          {/* Calendar day — like "Cal Wed" in the PDF */}
                          {session.calendar_day && (
                            <div className="text-[10px] text-muted-foreground">
                              Cal {session.calendar_day}
                            </div>
                          )}
                          {/* Absence info — inline like the PDF shows it */}
                          {absenceText && (
                            <div className="text-[10px] font-medium text-red-600 dark:text-red-400">
                              {absenceText}
                            </div>
                          )}
                          {/* Coverage note */}
                          {coverage && (
                            <div className="text-[10px] text-amber-600 dark:text-amber-400">
                              Cover: {coverage.covering_staff_name}
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>

                    {/* Sending Part / Parts Entered By */}
                    <TableCell className="py-1.5 px-2 sm:px-3 align-top">
                      {isEditing ? (
                        <Input
                          value={editData.parts_entered_by || ''}
                          onChange={(e) => setEditData({ ...editData, parts_entered_by: e.target.value })}
                          placeholder="PT..."
                          className="h-7 text-xs w-20"
                        />
                      ) : (
                        <span className={!session.parts_entered_by ? 'text-muted-foreground/40' : ''}>
                          {session.parts_entered_by || '—'}
                        </span>
                      )}
                    </TableCell>

                    {/* Defendants */}
                    <TableCell className="py-1.5 px-2 sm:px-3 align-top max-w-[160px]">
                      {isEditing ? (
                        <Input
                          value={editData.defendants || ''}
                          onChange={(e) => setEditData({ ...editData, defendants: e.target.value })}
                          placeholder="Defendant(s)..."
                          className="h-7 text-xs"
                        />
                      ) : (
                        <span className={`break-words ${!session.defendants ? 'text-muted-foreground/40' : 'font-medium'}`}>
                          {session.defendants || '—'}
                        </span>
                      )}
                    </TableCell>

                    {/* Purpose */}
                    <TableCell className="py-1.5 px-2 sm:px-3 align-top">
                      {isEditing ? (
                        <Input
                          value={editData.purpose || ''}
                          onChange={(e) => setEditData({ ...editData, purpose: e.target.value })}
                          placeholder="JS, HRG..."
                          className="h-7 text-xs w-16"
                        />
                      ) : (
                        <span className={`font-medium ${!session.purpose ? 'text-muted-foreground/40 font-normal' : ''}`}>
                          {session.purpose || '—'}
                        </span>
                      )}
                    </TableCell>

                    {/* Date Trans/Start */}
                    <TableCell className="py-1.5 px-2 sm:px-3 align-top">
                      {isEditing ? (
                        <DatePicker
                          value={editData.date_transferred_or_started ? new Date(editData.date_transferred_or_started) : undefined}
                          onChange={(d) =>
                            setEditData({
                              ...editData,
                              date_transferred_or_started: d ? format(d, 'yyyy-MM-dd') : null
                            })
                          }
                        />
                      ) : (
                        <span className={!session.date_transferred_or_started ? 'text-muted-foreground/40' : ''}>
                          {session.date_transferred_or_started ?
                            format(new Date(session.date_transferred_or_started), 'M/dd') :
                            '—'}
                        </span>
                      )}
                    </TableCell>

                    {/* Top Charge */}
                    <TableCell className="py-1.5 px-2 sm:px-3 align-top max-w-[120px]">
                      {isEditing ? (
                        <Input
                          value={editData.top_charge || ''}
                          onChange={(e) => setEditData({ ...editData, top_charge: e.target.value })}
                          placeholder="Top charge..."
                          className="h-7 text-xs"
                        />
                      ) : (
                        <span className={`break-words ${!session.top_charge ? 'text-muted-foreground/40' : ''}`}>
                          {session.top_charge || '—'}
                        </span>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell className="py-1.5 px-2 sm:px-3 align-top">
                      {isEditing ? (
                        <div className="space-y-1">
                          <Select
                            value={editData.status || session.status}
                            onValueChange={(value) => setEditData({ ...editData, status: value })}
                          >
                            <SelectTrigger className="h-7 text-xs w-28">
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
                              placeholder="e.g., 10/23"
                              className="h-7 text-xs w-24"
                            />
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" type="button" className="h-7 w-7 p-0">
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
                        <div className="space-y-0.5">
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {session.status}
                          </Badge>
                          {session.status_detail && (
                            <div className="text-[10px] text-muted-foreground">{session.status_detail}</div>
                          )}
                        </div>
                      )}
                    </TableCell>

                    {/* Attorney */}
                    <TableCell className="py-1.5 px-2 sm:px-3 align-top max-w-[120px]">
                      {isEditing ? (
                        <Input
                          value={editData.attorney || ''}
                          onChange={(e) => setEditData({ ...editData, attorney: e.target.value })}
                          placeholder="Attorney..."
                          className="h-7 text-xs"
                        />
                      ) : (
                        <span className={`break-words ${!session.attorney ? 'text-muted-foreground/40' : ''}`}>
                          {session.attorney || '—'}
                        </span>
                      )}
                    </TableCell>

                    {/* Est. Date Fin */}
                    <TableCell className="py-1.5 px-2 sm:px-3 align-top">
                      {isEditing ? (
                        <DatePicker
                          value={editData.estimated_finish_date ? new Date(editData.estimated_finish_date) : undefined}
                          onChange={(d) =>
                            setEditData({
                              ...editData,
                              estimated_finish_date: d ? format(d, 'yyyy-MM-dd') : null
                            })
                          }
                        />
                      ) : (
                        <span className={!session.estimated_finish_date ? 'text-muted-foreground/40' : ''}>
                          {session.estimated_finish_date ?
                            format(new Date(session.estimated_finish_date), 'M/dd') :
                            '—'}
                        </span>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="py-1.5 px-2 sm:px-3 align-top">
                      <div className="flex gap-1">
                        {isEditing ? (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              className="h-6 w-6 p-0"
                              onClick={() => handleSave(session.id)}
                              disabled={updateSession.isPending}
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-1.5 text-[10px]"
                              onClick={handleCancel}
                            >
                              ✕
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-1.5 text-[10px]"
                              onClick={() => handleEdit(session)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDelete(session.id)}
                              disabled={deleteSession.isPending}
                            >
                              <Trash2 className="h-3 w-3" />
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
