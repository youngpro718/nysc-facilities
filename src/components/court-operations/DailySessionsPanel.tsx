import { useState } from 'react';
import { format, subDays } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Copy, RefreshCw, Users, CalendarCheck, FileText, Upload } from 'lucide-react';
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
import { useCourtSessions, useCopyYesterdaySessions, useBulkCreateCourtSessions } from '@/hooks/useCourtSessions';
import { useCoverageAssignments } from '@/hooks/useCoverageAssignments';
import { useSessionConflicts } from '@/hooks/useSessionConflicts';
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

  const handleCopyYesterday = () => {
    const yesterday = subDays(selectedDate, 1);
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
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="default"
              onClick={() => setShowUploadDialog(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Report
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCreateDialog(true)}
            >
              <CalendarCheck className="h-4 w-4 mr-2" />
              Add Session
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyYesterday}
              disabled={copyYesterday.isPending}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Yesterday
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCoveragePanel(!showCoveragePanel)}
            >
              <Users className="h-4 w-4 mr-2" />
              {showCoveragePanel ? 'Hide' : 'Show'} Coverage
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReportDialog(true)}
              disabled={!sessions || sessions.length === 0}
            >
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
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
          // Bulk insert approved sessions to court_sessions table
          bulkCreateSessions.mutate({
            sessions: approvedData.map(session => ({
              part_number: session.part_number,
              judge_name: session.judge_name,
              room_number: session.room_number,
              clerk_name: session.clerk_name,
              calendar_day: session.calendar_day,
              defendants: session.defendants,
              purpose: session.purpose,
              transfer_date: session.transfer_date,
              top_charge: session.top_charge,
              status: session.status,
              attorney: session.attorney,
              estimated_final_date: session.estimated_final_date,
              part_sent_by: session.part_sent_by,
            })),
            date: selectedDate,
            period: selectedPeriod,
            buildingCode: selectedBuilding,
          }, {
            onSuccess: () => {
              setShowReviewDialog(false);
              setExtractedData([]);
            }
          });
        }}
      />
    </div>
  );
}
