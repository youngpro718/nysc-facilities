import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { QuickSpaceTemplates } from './QuickSpaceTemplates';
import { Settings, Zap, ExternalLink } from 'lucide-react';

interface QuickSpaceBottomSheetProps {
  open: boolean;
  onClose: () => void;
  preselectedBuilding?: string;
  preselectedFloor?: string;
}

export function QuickSpaceBottomSheet({ 
  open, 
  onClose, 
  preselectedBuilding, 
  preselectedFloor 
}: QuickSpaceBottomSheetProps) {
  const [showQuickTemplates, setShowQuickTemplates] = useState(false);
  const [showAdvancedDialog, setShowAdvancedDialog] = useState(false);

  const handleQuickCreate = () => {
    setShowQuickTemplates(true);
  };

  const handleAdvancedCreate = () => {
    onClose(); // Close bottom sheet first
    
    // Small delay then trigger the desktop Add Space button
    setTimeout(() => {
      const addSpaceButton = document.querySelector('[data-testid="add-space-button"]') as HTMLButtonElement;
      if (addSpaceButton) {
        addSpaceButton.click();
      } else {
        // Fallback: look for any button with "Add Space" text
        const buttons = Array.from(document.querySelectorAll('button'));
        const addButton = buttons.find(btn => btn.textContent?.includes('Add Space'));
        if (addButton) {
          (addButton as HTMLButtonElement).click();
        }
      }
    }, 200);
  };

  const handleTemplatesClose = () => {
    setShowQuickTemplates(false);
    onClose();
  };

  if (showQuickTemplates) {
    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Quick Add Space</SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <QuickSpaceTemplates
              onClose={handleTemplatesClose}
              preselectedBuilding={preselectedBuilding}
              preselectedFloor={preselectedFloor}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader>
            <SheetTitle>Add New Space</SheetTitle>
          </SheetHeader>
          <div className="py-6 space-y-4">
            <Button
              onClick={handleQuickCreate}
              className="w-full h-16 text-left justify-start gap-4"
              variant="outline"
            >
              <div className="p-2 bg-primary text-primary-foreground rounded-full">
                <Zap className="h-5 w-5" />
              </div>
              <div className="flex flex-col items-start">
                <span className="font-semibold">Quick Create</span>
                <span className="text-sm text-muted-foreground">
                  Use templates for common spaces
                </span>
              </div>
            </Button>

            <Button
              onClick={handleAdvancedCreate}
              className="w-full h-16 text-left justify-start gap-4"
              variant="outline"
            >
              <div className="p-2 bg-secondary text-secondary-foreground rounded-full">
                <ExternalLink className="h-5 w-5" />
              </div>
              <div className="flex flex-col items-start">
                <span className="font-semibold">Advanced Options</span>
                <span className="text-sm text-muted-foreground">
                  Full customization and settings
                </span>
              </div>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
