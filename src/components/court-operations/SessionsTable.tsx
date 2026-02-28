import { useState, useRef, useCallback, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, FileText } from 'lucide-react';
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

// Editable fields in each session row
const EDITABLE_FIELDS = [
  'parts_entered_by',
  'defendants',
  'purpose',
  'date_transferred_or_started',
  'top_charge',
  'status',
  'status_detail',
  'attorney',
  'estimated_finish_date',
] as const;

type EditableField = typeof EDITABLE_FIELDS[number];

// Building label lookup
const buildingLabel = (code: string) =>
  BUILDING_CODES.find(b => b.value === code)?.label?.toUpperCase() || code;

// Inline editable cell component
function InlineCell({
  value,
  field,
  sessionId,
  onSave,
  placeholder,
  isStatus,
  className = '',
}: {
  value: string;
  field: EditableField;
  sessionId: string;
  onSave: (sessionId: string, field: EditableField, value: string) => void;
  placeholder?: string;
  isStatus?: boolean;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleSave = useCallback(() => {
    setEditing(false);
    if (editValue !== value) {
      onSave(sessionId, field, editValue);
    }
  }, [editValue, value, sessionId, field, onSave]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
      // Move to next editable cell
      const nextCell = (e.target as HTMLElement)
        .closest('td')
        ?.nextElementSibling
        ?.querySelector('[data-editable]') as HTMLElement;
      if (nextCell) {
        e.preventDefault();
        nextCell.click();
      }
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setEditing(false);
    } else if (e.key === 'Tab') {
      handleSave();
    }
  }, [handleSave, value]);

  if (isStatus) {
    return (
      <Select
        value={value || 'scheduled'}
        onValueChange={(v) => onSave(sessionId, field, v)}
      >
        <SelectTrigger className="h-6 text-[10px] px-1.5 w-24 border-0 bg-transparent hover:bg-muted/50">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SESSION_STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value} className="text-xs">
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (editing) {
    return (
      <Input
        ref={inputRef}
        data-editable
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`h-6 text-xs px-1.5 py-0 border-primary/30 bg-primary/5 ${className}`}
      />
    );
  }

  return (
    <div
      data-editable
      onClick={() => setEditing(true)}
      className={`cursor-text min-h-[24px] px-1 py-0.5 rounded hover:bg-muted/60 transition-colors ${value ? 'text-foreground' : 'text-muted-foreground/40 italic'
        } ${className}`}
      title="Click to edit"
    >
      {value || placeholder || '—'}
    </div>
  );
}

export function SessionsTable({
  date,
  period,
  buildingCode,
  sessions,
  coverages,
  isLoading
}: SessionsTableProps) {
  const updateSession = useUpdateCourtSession();
  const deleteSession = useDeleteCourtSession();
  const { absentStaffMap } = useAbsentStaffNames(date);

  // Single cell save handler
  const handleCellSave = useCallback(async (
    sessionId: string,
    field: EditableField,
    value: string
  ) => {
    try {
      await updateSession.mutateAsync({
        id: sessionId,
        [field]: value || null,
      });
    } catch (error) {
      logger.error('Error saving cell:', error);
      toast.error('Failed to save');
    }
  }, [updateSession]);

  const handleDelete = async (sessionId: string) => {
    if (!confirm('Delete this session?')) return;
    await deleteSession.mutateAsync(sessionId);
  };

  // Get judge absence text inline
  const getAbsenceText = (judgeName: string | null) => {
    if (!judgeName) return null;
    const info = absentStaffMap.get(judgeName.toLowerCase());
    if (!info) return null;
    const s = format(new Date(info.starts_on), 'M/dd');
    const e = format(new Date(info.ends_on), 'M/dd');
    return `OUT ${s}-${e}`;
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

  const reportDateStr = format(date, 'M-dd-yy');

  return (
    <Card className="overflow-hidden">
      {/* Report-style header */}
      <div className="bg-primary/5 border-b px-4 py-2.5 sm:px-6 sm:py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary shrink-0" />
            <h2 className="text-sm sm:text-base font-bold tracking-tight uppercase">
              {reportDateStr} {period} Report — {buildingLabel(buildingCode)}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">
              {sessions.length} session{sessions.length !== 1 ? 's' : ''}
            </Badge>
            <span className="text-[10px] text-muted-foreground hidden sm:inline">
              Click any cell to edit
            </span>
          </div>
        </div>
      </div>

      <CardContent className="p-0">
        <div className="overflow-x-auto" style={{ boxShadow: 'inset -12px 0 8px -8px rgba(0,0,0,0.06)' }}>
          <Table className="text-xs">
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="py-1.5 px-2 font-bold whitespace-nowrap w-[120px]">Room / Part</TableHead>
                <TableHead className="py-1.5 px-2 font-bold whitespace-nowrap w-[70px]">Send Pt</TableHead>
                <TableHead className="py-1.5 px-2 font-bold whitespace-nowrap min-w-[120px]">Defendant(s)</TableHead>
                <TableHead className="py-1.5 px-2 font-bold whitespace-nowrap w-[55px]">PURP</TableHead>
                <TableHead className="py-1.5 px-2 font-bold whitespace-nowrap w-[65px]">Date Tr</TableHead>
                <TableHead className="py-1.5 px-2 font-bold whitespace-nowrap min-w-[80px]">Top Charge</TableHead>
                <TableHead className="py-1.5 px-2 font-bold whitespace-nowrap w-[90px]">Status</TableHead>
                <TableHead className="py-1.5 px-2 font-bold whitespace-nowrap min-w-[90px]">Attorneys</TableHead>
                <TableHead className="py-1.5 px-2 font-bold whitespace-nowrap w-[60px]">Est Fin</TableHead>
                <TableHead className="py-1.5 px-1 w-[36px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => {
                const absenceText = getAbsenceText(session.judge_name);
                const coverage = getCoverageForRoom(session.court_room_id);
                const roomNumber = session.court_rooms?.room_number || '—';

                return (
                  <TableRow key={session.id} className="hover:bg-muted/20 border-b">
                    {/* Room / Part / Judge — read-only identity column */}
                    <TableCell className="py-1 px-2 align-top">
                      <div className="space-y-0 min-w-[100px]">
                        <div className="font-bold text-xs">{roomNumber}</div>
                        {session.part_number && (
                          <div className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                            {session.part_number}
                          </div>
                        )}
                        <div className="text-[10px] text-muted-foreground truncate max-w-[110px]">
                          {session.judge_name || '—'}
                        </div>
                        {session.calendar_day && (
                          <div className="text-[9px] text-muted-foreground">Cal {session.calendar_day}</div>
                        )}
                        {absenceText && (
                          <div className="text-[9px] font-medium text-red-600 dark:text-red-400">{absenceText}</div>
                        )}
                        {coverage && (
                          <div className="text-[9px] text-amber-600 dark:text-amber-400">
                            Cover: {coverage.covering_staff_name}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Sending Part — editable */}
                    <TableCell className="py-1 px-2 align-top">
                      <InlineCell
                        value={session.parts_entered_by || ''}
                        field="parts_entered_by"
                        sessionId={session.id}
                        onSave={handleCellSave}
                        placeholder="PT..."
                        className="w-16"
                      />
                    </TableCell>

                    {/* Defendants — editable */}
                    <TableCell className="py-1 px-2 align-top">
                      <InlineCell
                        value={session.defendants || ''}
                        field="defendants"
                        sessionId={session.id}
                        onSave={handleCellSave}
                        placeholder="Defendant..."
                      />
                    </TableCell>

                    {/* Purpose — editable */}
                    <TableCell className="py-1 px-2 align-top">
                      <InlineCell
                        value={session.purpose || ''}
                        field="purpose"
                        sessionId={session.id}
                        onSave={handleCellSave}
                        placeholder="JS"
                        className="w-12"
                      />
                    </TableCell>

                    {/* Date Transferred — editable */}
                    <TableCell className="py-1 px-2 align-top">
                      <InlineCell
                        value={session.date_transferred_or_started || ''}
                        field="date_transferred_or_started"
                        sessionId={session.id}
                        onSave={handleCellSave}
                        placeholder="M/dd"
                        className="w-14"
                      />
                    </TableCell>

                    {/* Top Charge — editable */}
                    <TableCell className="py-1 px-2 align-top">
                      <InlineCell
                        value={session.top_charge || ''}
                        field="top_charge"
                        sessionId={session.id}
                        onSave={handleCellSave}
                        placeholder="Charge..."
                      />
                    </TableCell>

                    {/* Status — dropdown + detail text */}
                    <TableCell className="py-1 px-2 align-top">
                      <div className="space-y-0.5">
                        <InlineCell
                          value={session.status || 'scheduled'}
                          field="status"
                          sessionId={session.id}
                          onSave={handleCellSave}
                          isStatus
                        />
                        <InlineCell
                          value={session.status_detail || ''}
                          field="status_detail"
                          sessionId={session.id}
                          onSave={handleCellSave}
                          placeholder="detail..."
                          className="w-20"
                        />
                      </div>
                    </TableCell>

                    {/* Attorney — editable */}
                    <TableCell className="py-1 px-2 align-top">
                      <InlineCell
                        value={session.attorney || ''}
                        field="attorney"
                        sessionId={session.id}
                        onSave={handleCellSave}
                        placeholder="ADA..."
                      />
                    </TableCell>

                    {/* Est. Finish — editable */}
                    <TableCell className="py-1 px-2 align-top">
                      <InlineCell
                        value={session.estimated_finish_date || ''}
                        field="estimated_finish_date"
                        sessionId={session.id}
                        onSave={handleCellSave}
                        placeholder="M/dd"
                        className="w-14"
                      />
                    </TableCell>

                    {/* Delete */}
                    <TableCell className="py-1 px-1 align-top">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(session.id)}
                        disabled={deleteSession.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
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
