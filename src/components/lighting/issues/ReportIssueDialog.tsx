import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, MapPin, Lightbulb, Wrench } from 'lucide-react';
import { LightingFixture } from '@/types/lighting';
import * as locationUtil from '@/components/lighting/utils/location';
import { LightingIssueForm } from './LightingIssueForm';
import { BaseLightingDialog } from '../shared/BaseLightingDialog';
import { StandardFormSection } from '../shared/StandardFormSection';

interface ReportIssueDialogProps {
  fixture: LightingFixture;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ReportIssueDialog({ fixture, open: externalOpen, onOpenChange: externalOnOpenChange }: ReportIssueDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Use external state if provided, otherwise use internal state
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;
  
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
  
  const contextInfo = [
    { label: "Fixture Name", value: fixture.name, icon: <Lightbulb className="h-3 w-3" /> },
    { label: "Location", value: getLocationFromFixture(), icon: <MapPin className="h-3 w-3" /> },
    { label: "Technology", value: fixture.technology || 'Unknown', icon: <Lightbulb className="h-3 w-3" /> },
    { label: "Current Status", value: fixture.status, icon: <Wrench className="h-3 w-3" /> }
  ];

  return (
    <BaseLightingDialog
      open={open}
      onOpenChange={setOpen}
      title={`Report Issue: ${fixture.name}`}
      description="Provide detailed information about the lighting problem to ensure quick and accurate maintenance response."
      status={fixture.status}
      contextInfo={contextInfo}
      trigger={
        externalOpen === undefined ? (
          <Button variant="ghost" className="w-full justify-start px-2 py-1.5 h-auto text-sm font-normal">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Report Issue
          </Button>
        ) : null
      }
    >
      <StandardFormSection
        title="Issue Details"
        description="Describe the specific problem and provide context to help maintenance prioritize and resolve the issue efficiently."
        icon={<AlertTriangle className="h-4 w-4 text-amber-600" />}
        variant="accent"
      >
        <LightingIssueForm 
          prefillData={{
            location: getLocationFromFixture(),
            bulb_type: getBulbTypeFromFixture(),
            form_factor: fixture.type === 'exit_sign' ? 'Exit Sign' : 'Standard',
            issue_type: fixture.ballast_issue ? 'Ballast' : 'Blown Bulb',
          }}
          onSuccess={handleSuccess}
        />
      </StandardFormSection>
    </BaseLightingDialog>
  );
}
