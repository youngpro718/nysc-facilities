
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { BackupVersion } from "../backupUtils";
import { Badge } from "@/components/ui/badge";

interface BackupHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  backupVersions: BackupVersion[];
  onRestore?: (backup: BackupVersion) => void;
}

export function BackupHistoryDialog({ 
  open, 
  onOpenChange, 
  backupVersions,
  onRestore 
}: BackupHistoryDialogProps) {
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
                <div className="space-y-2">
                  <h4 className="font-medium">{backup.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    Created: {format(new Date(backup.created_at), 'PPp')}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {backup.compressed && (
                      <Badge variant="secondary">
                        Compressed {backup.compression_ratio ? `(${backup.compression_ratio.toFixed(1)}x)` : ''}
                      </Badge>
                    )}
                    {backup.encrypted && (
                      <Badge variant="secondary">Encrypted</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Size: {(backup.size_bytes / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Tables: {backup.tables.join(', ')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                  {onRestore && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onRestore(backup)}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
