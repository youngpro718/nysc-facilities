import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, Plus } from 'lucide-react';
import { ReportIssueWizard } from '@/components/issues/wizard/ReportIssueWizard';
import { useOccupantAssignments } from '@/hooks/occupants/useOccupantAssignments';
import { useAuth } from '@/hooks/useAuth';

interface QuickIssueReportButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showIcon?: boolean;
  label?: string;
}

export function QuickIssueReportButton({ 
  variant = 'default',
  size = 'default',
  className = '',
  showIcon = true,
  label = 'Report Issue'
}: QuickIssueReportButtonProps) {
  const [showWizard, setShowWizard] = useState(false);
  const { user } = useAuth();
  const { data: occupantData } = useOccupantAssignments(user?.id || '');

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setShowWizard(true)}
      >
        {showIcon && <AlertTriangle className="h-4 w-4 mr-2" />}
        {label}
      </Button>

      <Dialog open={showWizard} onOpenChange={setShowWizard}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">Report an Issue</DialogTitle>
          <ReportIssueWizard
            onSuccess={() => setShowWizard(false)}
            onCancel={() => setShowWizard(false)}
            assignedRooms={occupantData?.roomAssignments || []}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
