import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';
import { LightingFixture } from '@/types/lighting';
import * as locationUtil from '@/components/lighting/utils/location';
import { LightingIssueForm } from './LightingIssueForm';

interface ReportIssueDialogProps {
  fixture: LightingFixture;
}

export function ReportIssueDialog({ fixture }: ReportIssueDialogProps) {
  const [open, setOpen] = useState(false);
  
  // Generate location string from fixture details via shared util
  const getLocationFromFixture = () => locationUtil.getFixtureFullLocationText(fixture);
  
  // Determine bulb type from fixture technology
  const getBulbTypeFromFixture = () => {
    if (fixture.technology === 'LED') return 'LED';
    if (fixture.technology === 'Fluorescent') return 'Fluorescent';
    return 'Standard';
  };
  
  // Close dialog after successful submission
  const handleSuccess = () => {
    setOpen(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="text-amber-600 border-amber-200 hover:bg-amber-50"
        >
          <AlertTriangle className="h-4 w-4 mr-1" />
          Report Issue
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px] p-4">
        <DialogHeader>
          <DialogTitle>Report Lighting Issue for {fixture.name}</DialogTitle>
        </DialogHeader>
        <LightingIssueForm 
          prefillData={{
            location: getLocationFromFixture(),
            bulb_type: getBulbTypeFromFixture(),
            form_factor: fixture.type === 'exit_sign' ? 'Exit Sign' : 'Standard',
            issue_type: fixture.ballast_issue ? 'Ballast' : 'Blown Bulb',
          }}
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
