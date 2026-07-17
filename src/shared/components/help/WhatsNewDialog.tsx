import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { APP_INFO } from '@/lib/appInfo';
import { CHANGELOG } from '@/lib/changelog';

interface WhatsNewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Version history, opened by clicking the version number in the footer. */
export function WhatsNewDialog({ open, onOpenChange }: WhatsNewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>What's New</DialogTitle>
          <DialogDescription>
            {APP_INFO.name} — you're on version {APP_INFO.version}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {CHANGELOG.map((entry, index) => (
              <div key={entry.version}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">v{entry.version}</span>
                  {index === 0 && (
                    <Badge variant="secondary" className="text-[10px]">Current</Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {new Date(`${entry.date}T00:00:00`).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                {entry.title && (
                  <p className="mt-0.5 text-sm font-medium text-muted-foreground">{entry.title}</p>
                )}
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
                  {entry.highlights.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
