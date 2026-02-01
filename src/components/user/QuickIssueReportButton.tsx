import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { AlertTriangle } from 'lucide-react';
import { SimpleReportWizard } from '@/components/issues/wizard/SimpleReportWizard';
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

      <ResponsiveDialog open={showWizard} onOpenChange={setShowWizard} title="">
        <SimpleReportWizard
          onSuccess={() => setShowWizard(false)}
          onCancel={() => setShowWizard(false)}
          assignedRooms={occupantData?.roomAssignments || []}
        />
      </ResponsiveDialog>
    </>
  );
}
