import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { CornerDownRight, GitBranch, DoorOpen } from 'lucide-react';

export type ConnectionTypeValue = 'bend' | 'connected' | 'transition_door';

interface ConnectionTypeDialogProps {
  open: boolean;
  parentHallwayName: string;
  onConfirm: (type: ConnectionTypeValue) => void;
  onCancel: () => void;
}

const OPTIONS: { value: ConnectionTypeValue; label: string; description: string; icon: typeof CornerDownRight }[] = [
  {
    value: 'bend',
    label: 'Bend / Continuation',
    description: 'Same hallway changing direction — no door, just a turn',
    icon: CornerDownRight,
  },
  {
    value: 'connected',
    label: 'Connected Hallway',
    description: 'A separate hallway branching off from this one',
    icon: GitBranch,
  },
  {
    value: 'transition_door',
    label: 'Transition Door',
    description: 'Connected through a door or security checkpoint',
    icon: DoorOpen,
  },
];

export function ConnectionTypeDialog({
  open,
  parentHallwayName,
  onConfirm,
  onCancel,
}: ConnectionTypeDialogProps) {
  const [selected, setSelected] = useState<ConnectionTypeValue>('connected');

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onCancel(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>How is this connected?</DialogTitle>
          <DialogDescription>
            This line starts near <strong className="text-foreground">{parentHallwayName}</strong>. Choose the relationship.
          </DialogDescription>
        </DialogHeader>

        <RadioGroup
          value={selected}
          onValueChange={(v) => setSelected(v as ConnectionTypeValue)}
          className="gap-3 py-2"
        >
          {OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <label
                key={opt.value}
                className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                  selected === opt.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground/40'
                }`}
              >
                <RadioGroupItem value={opt.value} className="mt-0.5" />
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{opt.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{opt.description}</p>
                </div>
              </label>
            );
          })}
        </RadioGroup>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={() => onConfirm(selected)}>Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
