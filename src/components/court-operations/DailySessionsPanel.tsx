import { useState } from 'react';
import { format, subDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Copy, RefreshCw, Users, CalendarCheck, FileText, Upload, MoreHorizontal, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  return (
    <div className="space-y-6">
      {/* Conflict Banner */}
      {conflicts && (
        <SessionConflictBanner conflicts={conflicts} />
      )}

      {/* Filter Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" />
            Daily Sessions
            {sessions && sessions.length > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {sessions.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4">
            {/* Date Picker */}
            <div className="space-y-2">
              <Label>Date</Label>
              <DatePicker
                value={selectedDate}
                onChange={(date) => date && setSelectedDate(date)}
              />
            </div>

            {/* Period Selector */}
            <div className="space-y-2">
              <Label>Period</Label>
              <RadioGroup
                value={selectedPeriod}
                onValueChange={(value) => setSelectedPeriod(value as SessionPeriod)}
                className="flex gap-2"
              >
                {SESSION_PERIODS.map((period) => (
                  <div key={period.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={period.value} id={`period-${period.value}`} />
                    <Label htmlFor={`period-${period.value}`} className="cursor-pointer">
                      {period.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Building Filter */}
            <div className="space-y-2">
              <Label>Building</Label>
              <Select
                value={selectedBuilding}
                onValueChange={(value) => setSelectedBuilding(value as BuildingCode)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUILDING_CODES.map((building) => (
                    <SelectItem key={building.value} value={building.value}>
                      {building.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <Label>Quick Actions</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToday}
                  className="flex-1"
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Today
                </Button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {/* Primary CTA — Start Report (only show when no sessions yet) */}
            {(!sessions || sessions.length === 0) && (
              <Button
                size="sm"
                variant="default"
                className="text-xs sm:text-sm"
                onClick={handleStartReport}
                disabled={startReport.isPending}
              >
                <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                {startReport.isPending ? 'Creating...' : 'Start Report'}
              </Button>
            )}
            <Button
              size="sm"
              variant={sessions && sessions.length > 0 ? 'default' : 'outline'}
              className="text-xs sm:text-sm"
              onClick={() => setShowUploadDialog(true)}
            >
              <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Upload
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-xs sm:text-sm"
              onClick={() => setShowCreateDialog(true)}
            >
              <CalendarCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Add Session
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs sm:text-sm hidden sm:inline-flex"
              onClick={handleCopyYesterday}
              disabled={copyYesterday.isPending}
            >
              <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Copy Yesterday
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs sm:text-sm hidden sm:inline-flex"
              onClick={() => setShowCoveragePanel(!showCoveragePanel)}
            >
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Coverage
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs sm:text-sm hidden sm:inline-flex"
              onClick={() => setShowReportDialog(true)}
              disabled={!sessions || sessions.length === 0}
            >
              <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Generate Report
            </Button>
            {/* Mobile overflow menu for secondary actions */}
            <div className="sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs">
                    <MoreHorizontal className="h-3.5 w-3.5 mr-1" />
                    More
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={handleCopyYesterday}
                    disabled={copyYesterday.isPending}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Yesterday
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowCoveragePanel(!showCoveragePanel)}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Coverage
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowReportDialog(true)}
                    disabled={!sessions || sessions.length === 0}
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
      <SessionsTable
        date={selectedDate}
        period={selectedPeriod}
        buildingCode={selectedBuilding}
        sessions={sessions || []}
        coverages={coverages || []}
        isLoading={sessionsLoading}
      />

      {/* Create Session Dialog */}
      <CreateSessionDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        date={selectedDate}
        period={selectedPeriod}
        buildingCode={selectedBuilding}
      />

      {/* Generate Report Dialog */}
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

      {/* Upload Daily Report Dialog */}
      <UploadDailyReportDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onDataExtracted={(data) => {
          setExtractedData(data);
          setShowReviewDialog(true);
        }}
      />

      {/* Extracted Data Review Dialog */}
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
