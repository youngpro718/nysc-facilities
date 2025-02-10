
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { format } from "date-fns";
import { BackupVersion } from "../backupUtils";

interface BackupHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  backupVersions: BackupVersion[];
}

export function BackupHistoryDialog({ open, onOpenChange, backupVersions }: BackupHistoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Backup History</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px] rounded-md border p-4">
          <div className="space-y-4">
            {backupVersions.map((backup) => (
              <div
                key={backup.id}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div>
                  <h4 className="font-medium">{backup.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    Created: {format(new Date(backup.created_at), 'PPp')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Tables: {backup.tables.join(', ')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
