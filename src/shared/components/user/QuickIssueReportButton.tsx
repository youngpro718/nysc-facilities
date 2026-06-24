import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { ReportIssueDialog } from '@features/operations/components/maintenance/ReportIssueDialog';

interface QuickIssueReportButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showIcon?: boolean;
  label?: string;
  children?: React.ReactNode;
}

export function QuickIssueReportButton({
  variant = 'default',
  size = 'default',
  className = '',
  showIcon = true,
  label = 'Report Issue',
  children,
}: QuickIssueReportButtonProps) {
  const [showWizard, setShowWizard] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setShowWizard(true)}
      >
        {children ? children : (
          <>
            {showIcon && <AlertTriangle className="h-4 w-4 mr-2" />}
            {label}
          </>
        )}
      </Button>

      <ReportIssueDialog
        open={showWizard}
        onOpenChange={setShowWizard}
        mode="requester"
      />
    </>
  );
}
