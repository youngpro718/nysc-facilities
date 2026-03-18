import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Box, MapPin } from "lucide-react";
import { LockboxWithSlotCount } from "../types/LockboxTypes";
import { Badge } from "@/components/ui/badge";

interface LockboxSelectorProps {
  lockboxes: LockboxWithSlotCount[];
  selectedLockboxId: string | null;
  onSelectLockbox: (lockboxId: string) => void;
  onCreateNew: () => void;
  isLoading?: boolean;
}

export function LockboxSelector({ 
  lockboxes, 
  selectedLockboxId, 
  onSelectLockbox, 
  onCreateNew,
  isLoading 
}: LockboxSelectorProps) {
  
  const selectedLockbox = lockboxes.find(lb => lb.id === selectedLockboxId);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={selectedLockboxId || undefined} onValueChange={onSelectLockbox}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select a lockbox..." />
          </SelectTrigger>
          <SelectContent>
            {lockboxes.map((lockbox) => (
              <SelectItem key={lockbox.id} value={lockbox.id}>
                <div className="flex items-center gap-2 py-1">
                  <Box className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="font-medium">{lockbox.name}</span>
                    {lockbox.location_description && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {lockbox.location_description}
                      </span>
                    )}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button onClick={onCreateNew} variant="outline" size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {selectedLockbox && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 bg-card rounded-lg border shadow-sm">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium truncate">{selectedLockbox.location_description || 'No location specified'}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
              {selectedLockbox.available_slots} In
            </Badge>
            <Badge variant="outline" className="bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20">
              {selectedLockbox.checked_out_slots} Out
            </Badge>
            <Badge variant="outline" className="text-muted-foreground">
              {selectedLockbox.total_slots} Total
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}
