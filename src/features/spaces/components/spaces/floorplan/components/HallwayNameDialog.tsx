import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface DrawnLine {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface HallwayNameDialogProps {
  open: boolean;
  line: DrawnLine | null;
  defaultName: string;
  onConfirm: (name: string, section: string, type: string) => void;
  onCancel: () => void;
}

const SECTION_OPTIONS = [
  { value: 'main', label: 'Main' },
  { value: 'north_east', label: 'North East' },
  { value: 'north_west', label: 'North West' },
  { value: 'center_east', label: 'Center East' },
  { value: 'center_west', label: 'Center West' },
  { value: 'south_east', label: 'South East' },
  { value: 'south_west', label: 'South West' },
  { value: 'connector', label: 'Connector' },
];

const TYPE_OPTIONS = [
  { value: 'public_main', label: 'Public Main' },
  { value: 'private', label: 'Private' },
  { value: 'private_main', label: 'Private Main' },
];

export function HallwayNameDialog({
  open,
  line,
  defaultName,
  onConfirm,
  onCancel,
}: HallwayNameDialogProps) {
  const [name, setName] = useState(defaultName);
  const [section, setSection] = useState('main');
  const [type, setType] = useState('public_main');

  // Reset when dialog opens with new default
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) onCancel();
  };

  // Compute length for display
  const length = line
    ? Math.round(
        Math.sqrt(
          Math.pow(line.endX - line.startX, 2) +
            Math.pow(line.endY - line.startY, 2)
        )
      )
    : 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Name this hallway</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="hallway-name">Hallway Name</Label>
            <Input
              id="hallway-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Main Hallway, Southeast Corridor"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Section</Label>
              <Select value={section} onValueChange={setSection}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SECTION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Drawn length: ~{length}px
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(name.trim() || defaultName, section, type)}
            disabled={!name.trim()}
          >
            Create Hallway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
