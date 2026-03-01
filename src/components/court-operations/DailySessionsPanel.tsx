import { useState } from 'react';
import { format, subDays, isToday } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Calendar, Copy, Users, CalendarCheck, FileText, Upload,
  MoreHorizontal, Play, Plus, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SessionsTable } from './SessionsTable';
import { CoveragePanel } from './CoveragePanel';
import { GenerateReportDialog } from './GenerateReportDialog';
import { SessionConflictBanner } from './SessionConflictBanner';
import { CreateSessionDialog } from './CreateSessionDialog';
import { UploadDailyReportDialog } from './UploadDailyReportDialog';
import { ExtractedDataReview } from './ExtractedDataReview';
import { DatePicker } from '@/components/ui/date-picker';
import { useCourtSessions, useCopyYesterdaySessions } from '@/hooks/useCourtSessions';
import { useCoverageAssignments } from '@/hooks/useCoverageAssignments';
import { useSessionConflicts } from '@/hooks/useSessionConflicts';
import { useBulkCreateCourtSessions } from '@/hooks/useBulkCreateCourtSessions';
import { useStartTodaysReport } from '@/hooks/useStartTodaysReport';
import { SessionPeriod, BuildingCode } from '@/types/courtSessions';
import { BUILDING_CODES, SESSION_PERIODS } from '@/constants/sessionStatuses';

export function DailySessionsPanel() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedPeriod, setSelectedPeriod] = useState<SessionPeriod>('AM');
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingCode>('100');
  const [showCoveragePanel, setShowCoveragePanel] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [extractedData, setExtractedData] = useState<any[]>([]);

  const { data: sessions, isLoading: sessionsLoading } = useCourtSessions(
    selectedDate,
    selectedPeriod,
    selectedBuilding
  );

  const { data: coverages, isLoading: coveragesLoading } = useCoverageAssignments(
    selectedDate,
    selectedPeriod,
    selectedBuilding
  );

  const { data: conflicts } = useSessionConflicts(
    selectedDate,
    selectedPeriod,
    selectedBuilding
  );

  const copyYesterday = useCopyYesterdaySessions();
  const bulkCreateSessions = useBulkCreateCourtSessions();
  const startReport = useStartTodaysReport();

  const handleStartReport = () => {
    if (!confirm(`Start today's report? This will create session rows for all assigned courtrooms.`)) return;
    startReport.mutate({
      date: selectedDate,
      period: selectedPeriod,
      buildingCode: selectedBuilding,
    });
  };

  const handleCopyYesterday = () => {
    const yesterday = subDays(selectedDate, 1);
    const yesterdayStr = format(yesterday, 'MMMM dd');
    if (!confirm(`Copy all sessions from ${yesterdayStr} to today?`)) return;
    copyYesterday.mutate({
      fromDate: format(yesterday, 'yyyy-MM-dd'),
      toDate: format(selectedDate, 'yyyy-MM-dd'),
      period: selectedPeriod,
      buildingCode: selectedBuilding,
    });
  };

  const prevDay = () => setSelectedDate(subDays(selectedDate, 1));
  const nextDay = () => setSelectedDate(new Date(selectedDate.getTime() + 86400000));
  const goToday = () => setSelectedDate(new Date());

  const buildingLabel = BUILDING_CODES.find(b => b.value === selectedBuilding)?.label || selectedBuilding;
  const hasSessions = sessions && sessions.length > 0;
  const dateStr = format(selectedDate, 'EEEE, MMMM d, yyyy');
  const todayTag = isToday(selectedDate);

  return (
    <div className="space-y-4">
      {/* Conflict Banner */}
      {conflicts && <SessionConflictBanner conflicts={conflicts} />}

      {/* Top Bar: Context + Actions */}
      <Card>
        <CardContent className="py-3 px-4">
          {/* Row 1: Date navigation + Period/Building */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            {/* Left: Date navigation */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevDay}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 min-w-0">
                <DatePicker
                  value={selectedDate}
                  onChange={(date) => date && setSelectedDate(date)}
                />
                {todayTag && (
                  <Badge className="text-[10px] bg-green-600 shrink-0">Today</Badge>
                )}
                {!todayTag && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={goToday}>
                    Today
                  </Button>
                )}
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextDay}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Right: Period + Building toggles */}
            <div className="flex items-center gap-2">
              {/* AM/PM toggle */}
              <div className="flex rounded-md border overflow-hidden">
                {SESSION_PERIODS.map((period) => (
                  <Button
                    key={period.value}
                    variant={selectedPeriod === period.value ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8 px-3 rounded-none text-xs font-semibold"
                    onClick={() => setSelectedPeriod(period.value as SessionPeriod)}
                  >
                    {period.label}
                  </Button>
                ))}
              </div>

              {/* Building toggle */}
              <div className="flex rounded-md border overflow-hidden">
                {BUILDING_CODES.map((building) => (
                  <Button
                    key={building.value}
                    variant={selectedBuilding === building.value ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8 px-2.5 rounded-none text-xs"
                    onClick={() => setSelectedBuilding(building.value as BuildingCode)}
                  >
                    {building.value}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Report header + Action buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t">
            {/* Report context */}
            <div className="flex items-center gap-2 min-w-0">
              <CalendarCheck className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm font-semibold truncate">
                {selectedPeriod} Report — {buildingLabel}
              </span>
              {hasSessions && (
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  {sessions.length} sessions
                </Badge>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Primary: Start Report or Upload */}
              {!hasSessions && (
                <Button
                  size="sm"
                  className="h-8 text-xs"
                  onClick={handleStartReport}
                  disabled={startReport.isPending}
                >
                  <Play className="h-3.5 w-3.5 mr-1" />
                  {startReport.isPending ? 'Creating...' : 'Start Report'}
                </Button>
              )}

              <Button
                size="sm"
                variant={hasSessions ? 'default' : 'outline'}
                className="h-8 text-xs"
                onClick={() => setShowUploadDialog(true)}
              >
                <Upload className="h-3.5 w-3.5 mr-1" />
                Upload PDF
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={handleCopyYesterday}
                disabled={copyYesterday.isPending}
              >
                <Copy className="h-3.5 w-3.5 mr-1" />
                <span className="hidden sm:inline">Copy Yesterday</span>
                <span className="sm:hidden">Copy</span>
              </Button>

              {/* More menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowCoveragePanel(!showCoveragePanel)}>
                    <Users className="h-4 w-4 mr-2" />
                    {showCoveragePanel ? 'Hide Coverage' : 'Show Coverage'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowReportDialog(true)}
                    disabled={!hasSessions}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {!sessionsLoading && !hasSessions && (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <CalendarCheck className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="text-base font-semibold mb-1">No sessions for {dateStr}</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              Get started by clicking <strong>Start Report</strong> to auto-fill from today's assignments,
              or <strong>Upload PDF</strong> to import from the daily report.
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button size="sm" onClick={handleStartReport} disabled={startReport.isPending}>
                <Play className="h-4 w-4 mr-1.5" />
                {startReport.isPending ? 'Creating...' : 'Start Report'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowUploadDialog(true)}>
                <Upload className="h-4 w-4 mr-1.5" />
                Upload PDF
              </Button>
              <Button size="sm" variant="outline" onClick={handleCopyYesterday} disabled={copyYesterday.isPending}>
                <Copy className="h-4 w-4 mr-1.5" />
                Copy Yesterday
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Coverage Panel */}
      {showCoveragePanel && (
        <CoveragePanel
          date={selectedDate}
          period={selectedPeriod}
          buildingCode={selectedBuilding}
          coverages={coverages || []}
          isLoading={coveragesLoading}
        />
      )}

      {/* Sessions Table */}
      {(hasSessions || sessionsLoading) && (
        <SessionsTable
          date={selectedDate}
          period={selectedPeriod}
          buildingCode={selectedBuilding}
          sessions={sessions || []}
          coverages={coverages || []}
          isLoading={sessionsLoading}
        />
      )}

      {/* Dialogs */}
      <CreateSessionDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        date={selectedDate}
        period={selectedPeriod}
        buildingCode={selectedBuilding}
      />

      <GenerateReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        reportOptions={{
          date: selectedDate,
          period: selectedPeriod,
          buildingCode: selectedBuilding,
          sessions: sessions || [],
          coverages: coverages || [],
        }}
      />

      <UploadDailyReportDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onDataExtracted={(data) => {
          setExtractedData(data);
          setShowReviewDialog(true);
        }}
      />

      <ExtractedDataReview
        open={showReviewDialog}
        onOpenChange={setShowReviewDialog}
        data={extractedData}
        date={selectedDate}
        period={selectedPeriod}
        buildingCode={selectedBuilding}
        onApprove={(approvedData) => {
          bulkCreateSessions.mutate({
            sessions: approvedData,
            date: selectedDate,
            period: selectedPeriod,
            buildingCode: selectedBuilding,
          });
        }}
      />
    </div>
  );
}
