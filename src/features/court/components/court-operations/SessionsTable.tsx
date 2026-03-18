import { useState, useRef, useCallback, useEffect } from 'react';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';
import { logger } from '@/lib/logger';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, FileText, Copy, CheckCircle2, X, Columns } from 'lucide-react';
import { CourtSession, CoverageAssignment, SessionPeriod, BuildingCode } from '@/types/courtSessions';
import { useUpdateCourtSession, useDeleteCourtSession, useCopySessionFromYesterday } from '@features/court/hooks/useCourtSessions';
import { useAbsentStaffNames } from '@features/court/hooks/useStaffAbsences';
import { SESSION_STATUSES, BUILDING_CODES } from '@features/court/constants/sessionStatuses';
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
  'calendar_count',
  'out_dates',
] as const;

type EditableField = typeof EDITABLE_FIELDS[number];

// Building label lookup
const buildingLabel = (code: string) =>
  BUILDING_CODES.find(b => b.value === code)?.label?.toUpperCase() || code;

/**
 * Parse a free-text date string like "10/21", "10/21/25", "10-21" into a formatted date.
 * Returns the original string if it can't be parsed.
 */
function parseFreeTextDate(input: string): string {
  if (!input) return input;
  // Already in yyyy-MM-dd format
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;

  // Match M/D, M/DD, MM/DD, M/D/YY, MM/DD/YY, MM/DD/YYYY (also with dashes)
  const match = input.match(/^(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?$/);
  if (match) {
    const month = match[1].padStart(2, '0');
    const day = match[2].padStart(2, '0');
    let year = match[3];
    if (!year) {
      year = String(new Date().getFullYear());
    } else if (year.length === 2) {
      year = '20' + year;
    }
    return `${year}-${month}-${day}`;
  }
  return input;
}

// Inline editable cell component
function InlineCell({
  value,
  field,
  sessionId,
  onSave,
  placeholder,
  isStatus,
  isDateField,
  className = '',
}: {
  value: string;
  field: EditableField;
  sessionId: string;
  onSave: (sessionId: string, field: EditableField, value: string) => void;
  placeholder?: string;
  isStatus?: boolean;
  isDateField?: boolean;
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
    let saveValue = editValue;
    if (isDateField) {
      saveValue = parseFreeTextDate(editValue);
    }
    if (saveValue !== value) {
      onSave(sessionId, field, saveValue);
    }
  }, [editValue, value, sessionId, field, onSave, isDateField]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
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
      e.preventDefault();
      handleSave();
      const currentTd = (e.target as HTMLElement).closest('td');
      if (currentTd) {
        const row = currentTd.closest('tr');
        if (row) {
          const cells = Array.from(row.querySelectorAll('td'));
          const currentIdx = cells.indexOf(currentTd as HTMLTableCellElement);
          const direction = e.shiftKey ? -1 : 1;
          for (let i = currentIdx + direction; i >= 0 && i < cells.length; i += direction) {
            const editable = cells[i].querySelector('[data-editable]') as HTMLElement;
            if (editable) {
              editable.click();
              return;
            }
          }
          const nextRow = e.shiftKey ? row.previousElementSibling : row.nextElementSibling;
          if (nextRow) {
            const nextCells = Array.from(nextRow.querySelectorAll('[data-editable]'));
            const target = e.shiftKey ? nextCells[nextCells.length - 1] : nextCells[0];
            if (target) (target as HTMLElement).click();
          }
        }
      }
    }
  }, [handleSave, value]);

  // Display formatted date for date fields
  const displayValue = isDateField && value ? (() => {
    // Show as M/dd if it's a yyyy-MM-dd date
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      try {
        return format(new Date(value + 'T00:00:00'), 'M/dd');
      } catch { return value; }
    }
    return value;
  })() : value;

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
        placeholder={isDateField ? 'M/dd' : placeholder}
        className={`h-6 text-xs px-1.5 py-0 border-primary/30 bg-primary/5 ${className}`}
      />
    );
  }

  return (
    <div
      data-editable
      onClick={() => setEditing(true)}
      className={`cursor-text min-h-[24px] px-1 py-0.5 rounded hover:bg-muted/60 transition-colors ${displayValue ? 'text-foreground' : 'text-muted-foreground/40 italic'
        } ${className}`}
      title={isDateField ? 'Click to edit — type M/dd' : 'Click to edit'}
    >
      {displayValue || placeholder || '—'}
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
  const copyFromYesterday = useCopySessionFromYesterday();
  const { absentStaffMap } = useAbsentStaffNames(date);
  const [confirmAction, confirmDialog] = useConfirmDialog();

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Column visibility state
  const [compactView, setCompactView] = useState(() => {
    const stored = localStorage.getItem('court_ops_compact_view');
    return stored === null ? true : stored === 'true';
  });

  const toggleCompactView = (checked: boolean) => {
    setCompactView(checked);
    localStorage.setItem('court_ops_compact_view', String(checked));
  };

  // Clear selection if sessions array changes drastically (e.g. date change)
  useEffect(() => {
    setSelectedIds(new Set());
  }, [date, period, buildingCode]);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === sessions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sessions.map(s => s.id)));
    }
  }, [sessions, selectedIds]);

  const toggleSelectRow = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const confirmed = await confirmAction({
      title: 'Delete Multiple Sessions',
      description: `Are you sure you want to delete ${selectedIds.size} sessions? This cannot be undone.`,
      confirmLabel: 'Delete All',
      variant: 'destructive',
    });
    if (confirmed) {
      try {
        await Promise.all(Array.from(selectedIds).map(id => deleteSession.mutateAsync(id)));
        toast.success(`Deleted ${selectedIds.size} sessions`);
        setSelectedIds(new Set());
      } catch (err) {
        toast.error('Failed to delete some sessions');
      }
    }
  };

  const handleBulkStatus = async (status: string) => {
    if (selectedIds.size === 0) return;
    try {
      await Promise.all(Array.from(selectedIds).map(id =>
        updateSession.mutateAsync({ id, status })
      ));
      toast.success(`Updated status for ${selectedIds.size} sessions`);
      setSelectedIds(new Set());
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  // Single cell save handler
  const handleCellSave = useCallback(async (
    sessionId: string,
    field: EditableField,
    value: string
  ) => {
    try {
      // Handle special fields
      if (field === 'calendar_count') {
        await updateSession.mutateAsync({
          id: sessionId,
          calendar_count: value ? parseInt(value, 10) || null : null,
        });
        return;
      }
      if (field === 'out_dates') {
        // Parse comma-separated date ranges into array
        const dates = value ? value.split(',').map(d => d.trim()).filter(Boolean) : null;
        await updateSession.mutateAsync({
          id: sessionId,
          out_dates: dates,
        });
        return;
      }
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
    const confirmed = await confirmAction({
      title: 'Delete Session',
      description: 'Are you sure you want to delete this session?',
      confirmLabel: 'Delete',
      variant: 'destructive',
    });
    if (!confirmed) return;
    await deleteSession.mutateAsync(sessionId);
  };

  const handleCopyFromYesterday = (session: CourtSession) => {
    copyFromYesterday.mutate({
      sessionId: session.id,
      sessionDate: session.session_date,
      courtRoomId: session.court_room_id,
      period: session.period as SessionPeriod,
      buildingCode: session.building_code as BuildingCode,
    });
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

            {/* Column Visibility Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs px-2 gap-1.5 ml-1">
                  <Columns className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Columns</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[180px]">
                <DropdownMenuCheckboxItem
                  checked={!compactView}
                  onCheckedChange={(checked) => toggleCompactView(!checked)}
                  className="text-xs"
                >
                  Full View (All Columns)
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={compactView}
                  onCheckedChange={toggleCompactView}
                  className="text-xs"
                >
                  Compact View
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <span className="text-[10px] text-muted-foreground hidden lg:inline ml-2">
              Click any cell to edit · Type dates as M/dd
            </span>
          </div>
        </div>
      </div>

      <CardContent className="p-0">
        {/* Floating Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg animate-in fade-in slide-in-from-top-4">
            <Badge variant="secondary" className="px-2 bg-primary-foreground/20 text-primary-foreground border-none">
              {selectedIds.size} selected
            </Badge>

            <div className="w-px h-5 bg-primary-foreground/20 mx-1" />

            {/* Quick Status Setter */}
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium mr-1 opacity-80">Set Status:</span>
              <Select onValueChange={handleBulkStatus}>
                <SelectTrigger className="h-7 w-28 text-xs border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground focus:ring-0">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {SESSION_STATUSES.map(s => (
                    <SelectItem key={s.value} value={s.value} className="text-xs">
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-px h-5 bg-primary-foreground/20 mx-1" />

            {/* Delete Button */}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-primary-foreground hover:bg-red-500/20 hover:text-red-100"
              onClick={handleBulkDelete}
              disabled={deleteSession.isPending}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Delete
            </Button>

            <div className="w-px h-5 bg-primary-foreground/20 mx-1" />

            {/* Close Button */}
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 rounded-full hover:bg-primary-foreground/20"
              onClick={() => setSelectedIds(new Set())}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        <div className="overflow-x-auto overflow-y-auto max-h-[70vh]" style={{ boxShadow: 'inset -12px 0 8px -8px rgba(0,0,0,0.06)' }}>
          <Table className="text-xs relative w-full">
            <TableHeader className="sticky top-0 z-20 bg-muted/40 backdrop-blur-sm shadow-sm">
              <TableRow>
                <TableHead className="py-1 px-1 w-[28px] sticky left-0 z-30 bg-muted/90 backdrop-blur-sm">
                  <Checkbox
                    checked={sessions.length > 0 && selectedIds.size === sessions.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                    className="translate-y-[2px]"
                  />
                </TableHead>
                <TableHead className="py-1 px-1.5 font-bold whitespace-nowrap w-[100px] sticky left-[28px] z-30 bg-muted/90 backdrop-blur-sm border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Room/Part</TableHead>
                <TableHead className="py-1 px-1.5 font-bold whitespace-nowrap w-[52px]">Snd Pt</TableHead>
                <TableHead className="py-1 px-1.5 font-bold whitespace-nowrap min-w-[100px]">Defendant(s)</TableHead>
                <TableHead className="py-1 px-1.5 font-bold whitespace-nowrap w-[42px]">Purp</TableHead>
                <TableHead className="py-1 px-1.5 font-bold whitespace-nowrap w-[52px]">Date Tr</TableHead>
                <TableHead className="py-1 px-1.5 font-bold whitespace-nowrap min-w-[75px]">Top Charge</TableHead>
                <TableHead className="py-1 px-1.5 font-bold whitespace-nowrap w-[80px]">Status</TableHead>
                <TableHead className="py-1 px-1.5 font-bold whitespace-nowrap min-w-[80px]">Attorney</TableHead>
                {!compactView && (
                  <>
                    <TableHead className="py-1 px-1.5 font-bold whitespace-nowrap w-[50px]">Est Fin</TableHead>
                    <TableHead className="py-1 px-1.5 font-bold whitespace-nowrap w-[38px]">Cal#</TableHead>
                    <TableHead className="py-1 px-1.5 font-bold whitespace-nowrap w-[70px]">Out Dates</TableHead>
                  </>
                )}
                <TableHead className="py-1 px-1 w-[44px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => {
                const absenceText = getAbsenceText(session.judge_name);
                const coverage = getCoverageForRoom(session.court_room_id);
                const roomNumber = session.court_rooms?.room_number || '—';
                const isSelected = selectedIds.has(session.id);

                return (
                  <TableRow key={session.id} className={`hover:bg-muted/20 border-b ${isSelected ? 'bg-primary/5' : ''}`}>
                    {/* Checkbox */}
                    <TableCell className={`py-0.5 px-1 align-top sticky left-0 z-10 ${isSelected ? 'bg-primary/5' : 'bg-background/95'} backdrop-blur-sm`}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelectRow(session.id)}
                        aria-label="Select row"
                        className="translate-y-[2px]"
                      />
                    </TableCell>

                    {/* Room / Part / Judge — read-only identity column, frozen on the left */}
                    <TableCell className={`py-0.5 px-1.5 align-top sticky left-[28px] z-10 ${isSelected ? 'bg-primary/5' : 'bg-background/95'} backdrop-blur-sm border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]`}>
                      <div className="space-y-0">
                        <div className="flex items-baseline gap-1">
                          <span className="font-bold text-xs leading-tight">{roomNumber}</span>
                          {session.part_number && (
                            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">{session.part_number}</span>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate max-w-[90px] leading-tight">
                          {session.judge_name || '—'}
                        </div>
                        {(absenceText || coverage || session.calendar_day) && (
                          <div className="flex flex-wrap gap-x-1">
                            {session.calendar_day && <span className="text-[9px] text-muted-foreground">Cal {session.calendar_day}</span>}
                            {absenceText && <span className="text-[9px] font-medium text-red-600 dark:text-red-400">{absenceText}</span>}
                            {coverage && <span className="text-[9px] text-amber-600 dark:text-amber-400">↩ {coverage.covering_staff_name}</span>}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Sending Part */}
                    <TableCell className="py-0.5 px-1.5 align-top">
                      <InlineCell value={session.parts_entered_by || ''} field="parts_entered_by" sessionId={session.id} onSave={handleCellSave} placeholder="PT..." className="w-12" />
                    </TableCell>

                    {/* Defendants */}
                    <TableCell className="py-0.5 px-1.5 align-top">
                      <InlineCell value={session.defendants || ''} field="defendants" sessionId={session.id} onSave={handleCellSave} placeholder="Name..." />
                    </TableCell>

                    {/* Purpose */}
                    <TableCell className="py-0.5 px-1.5 align-top">
                      <InlineCell value={session.purpose || ''} field="purpose" sessionId={session.id} onSave={handleCellSave} placeholder="JS" className="w-10" />
                    </TableCell>

                    {/* Date Transferred — free-text date */}
                    <TableCell className="py-0.5 px-1.5 align-top">
                      <InlineCell value={session.date_transferred_or_started || ''} field="date_transferred_or_started" sessionId={session.id} onSave={handleCellSave} isDateField className="w-12" />
                    </TableCell>

                    {/* Top Charge */}
                    <TableCell className="py-0.5 px-1.5 align-top">
                      <InlineCell value={session.top_charge || ''} field="top_charge" sessionId={session.id} onSave={handleCellSave} placeholder="Charge..." />
                    </TableCell>

                    {/* Status — dropdown + detail text stacked tightly */}
                    <TableCell className="py-0.5 px-1.5 align-top">
                      <div className="space-y-0">
                        <InlineCell value={session.status || 'scheduled'} field="status" sessionId={session.id} onSave={handleCellSave} isStatus />
                        <InlineCell value={session.status_detail || ''} field="status_detail" sessionId={session.id} onSave={handleCellSave} placeholder="detail..." className="w-18" />
                      </div>
                    </TableCell>

                    {/* Attorney */}
                    <TableCell className="py-0.5 px-1.5 align-top">
                      <InlineCell value={session.attorney || ''} field="attorney" sessionId={session.id} onSave={handleCellSave} placeholder="ADA..." />
                    </TableCell>

                    {/* Conditionally rendered columns */}
                    {!compactView && (
                      <>
                        {/* Est. Finish — free-text date */}
                        <TableCell className="py-0.5 px-1.5 align-top">
                          <InlineCell value={session.estimated_finish_date || ''} field="estimated_finish_date" sessionId={session.id} onSave={handleCellSave} isDateField className="w-12" />
                        </TableCell>

                        {/* Calendar Count */}
                        <TableCell className="py-0.5 px-1.5 align-top">
                          <InlineCell value={session.calendar_count != null ? String(session.calendar_count) : ''} field="calendar_count" sessionId={session.id} onSave={handleCellSave} placeholder="#" className="w-8" />
                        </TableCell>

                        {/* Out Dates */}
                        <TableCell className="py-0.5 px-1.5 align-top">
                          <InlineCell value={session.out_dates?.join(', ') || ''} field="out_dates" sessionId={session.id} onSave={handleCellSave} placeholder="11/26-28" className="w-16" />
                        </TableCell>
                      </>
                    )}

                    {/* Actions: Copy Yesterday + Delete */}
                    <TableCell className="py-0.5 px-1 align-top">
                      <div className="flex items-center gap-0.5">
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 w-5 p-0 text-muted-foreground hover:text-primary"
                                onClick={() => handleCopyFromYesterday(session)}
                                disabled={copyFromYesterday.isPending}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              Copy from yesterday
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(session.id)}
                          disabled={deleteSession.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      {confirmDialog}
    </Card>
  );
}