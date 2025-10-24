import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, Eye, Loader2 } from 'lucide-react';
import { DailyReportGenerator, DailyReportOptions } from '@/services/reports/dailyReportGenerator';
import { toast } from 'sonner';

interface GenerateReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportOptions: Omit<DailyReportOptions, 'availableHrgs' | 'coverageSummary' | 'generalNotes' | 'includeHeader' | 'includeFooter'>;
}

export function GenerateReportDialog({ open, onOpenChange, reportOptions }: GenerateReportDialogProps) {
  const [availableHrgs, setAvailableHrgs] = useState('');
  const [coverageSummary, setCoverageSummary] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');
  const [includeHeader, setIncludeHeader] = useState(true);
  const [includeFooter, setIncludeFooter] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      
      const fullOptions: DailyReportOptions = {
        ...reportOptions,
        availableHrgs: availableHrgs || undefined,
        coverageSummary: coverageSummary || undefined,
        generalNotes: generalNotes || undefined,
        includeHeader,
        includeFooter,
      };

      await DailyReportGenerator.generateReport(fullOptions);
      
      toast.success('Report downloaded successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreview = async () => {
    try {
      setIsGenerating(true);
      
      const fullOptions: DailyReportOptions = {
        ...reportOptions,
        availableHrgs: availableHrgs || undefined,
        coverageSummary: coverageSummary || undefined,
        generalNotes: generalNotes || undefined,
        includeHeader,
        includeFooter,
      };

      await DailyReportGenerator.openReport(fullOptions);
      
      toast.success('Report opened in new tab');
    } catch (error) {
      console.error('Error previewing report:', error);
      toast.error('Failed to preview report');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Generate Daily Report</DialogTitle>
          <DialogDescription>
            Add optional notes to your PDF report
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 overflow-y-auto max-h-[calc(85vh-180px)]">
          {/* Available HRGs */}
          <div className="space-y-1.5">
            <Label htmlFor="available-hrgs" className="text-sm">Available HRGs</Label>
            <Textarea
              id="available-hrgs"
              placeholder="e.g., 1234, 1567, 2890"
              value={availableHrgs}
              onChange={(e) => setAvailableHrgs(e.target.value)}
              rows={1}
              className="text-sm"
            />
          </div>

          {/* Coverage Summary */}
          <div className="space-y-1.5">
            <Label htmlFor="coverage-summary" className="text-sm">Coverage Summary</Label>
            <Textarea
              id="coverage-summary"
              placeholder="Coverage notes..."
              value={coverageSummary}
              onChange={(e) => setCoverageSummary(e.target.value)}
              rows={1}
              className="text-sm"
            />
          </div>

          {/* General Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="general-notes" className="text-sm">General Notes</Label>
            <Textarea
              id="general-notes"
              placeholder="Additional remarks..."
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              rows={2}
              className="text-sm"
            />
          </div>

          {/* Options */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-header"
                checked={includeHeader}
                onCheckedChange={(checked) => setIncludeHeader(checked as boolean)}
              />
              <label
                htmlFor="include-header"
                className="text-sm leading-none cursor-pointer"
              >
                Include header
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-footer"
                checked={includeFooter}
                onCheckedChange={(checked) => setIncludeFooter(checked as boolean)}
              />
              <label
                htmlFor="include-footer"
                className="text-sm leading-none cursor-pointer"
              >
                Include footer notes
              </label>
            </div>
          </div>

          {/* Report Summary */}
          <div className="rounded-lg border p-2.5 bg-muted/50">
            <div className="text-xs space-y-0.5">
              <p>
                <span className="font-medium">Sessions:</span> {reportOptions.sessions.length}
              </p>
              <p>
                <span className="font-medium">Coverage:</span> {reportOptions.coverages.length}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Eye className="h-4 w-4 mr-2" />
            )}
            Preview
          </Button>
          <Button
            onClick={handleDownload}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
