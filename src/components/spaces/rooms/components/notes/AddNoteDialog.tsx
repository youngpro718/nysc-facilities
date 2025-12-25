import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateRoomNote } from '@/hooks/useRoomNotes';
import { NoteType, NoteSeverity, QUICK_NOTE_PRESETS } from '@/types/roomNotes';

interface AddNoteDialogProps {
  roomId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddNoteDialog({ roomId, open, onOpenChange }: AddNoteDialogProps) {
  const createNote = useCreateRoomNote();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [noteType, setNoteType] = useState<NoteType>('known_issue');
  const [severity, setSeverity] = useState<NoteSeverity>('medium');
  const [isRecurring, setIsRecurring] = useState(false);

  const handleQuickAdd = (preset: typeof QUICK_NOTE_PRESETS[number]) => {
    createNote.mutate({
      room_id: roomId,
      title: preset.title,
      note_type: preset.note_type,
      severity: preset.severity,
      is_recurring: true,
    }, {
      onSuccess: () => {
        onOpenChange(false);
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createNote.mutate({
      room_id: roomId,
      title: title.trim(),
      content: content.trim() || undefined,
      note_type: noteType,
      severity,
      is_recurring: isRecurring,
    }, {
      onSuccess: () => {
        setTitle('');
        setContent('');
        setNoteType('known_issue');
        setSeverity('medium');
        setIsRecurring(false);
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Add Room Note</DialogTitle>
        </DialogHeader>

        {/* Quick Add Buttons */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Quick Add Common Issues</Label>
          <div className="grid grid-cols-3 gap-2">
            {QUICK_NOTE_PRESETS.map((preset) => (
              <Button
                key={preset.title}
                variant="outline"
                size="sm"
                className="h-auto py-2 px-2 flex flex-col items-center gap-1"
                onClick={() => handleQuickAdd(preset)}
                disabled={createNote.isPending}
              >
                <span className="text-lg">{preset.icon}</span>
                <span className="text-[10px]">{preset.title}</span>
              </Button>
            ))}
          </div>
        </div>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or custom note</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., AC unit noisy"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Details (optional)</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Additional details about this issue..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={noteType} onValueChange={(v) => setNoteType(v as NoteType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="known_issue">Known Issue</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Severity</Label>
              <Select value={severity} onValueChange={(v) => setSeverity(v as NoteSeverity)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="recurring">Recurring Issue</Label>
              <p className="text-[10px] text-muted-foreground">
                Track multiple occurrences of this issue
              </p>
            </div>
            <Switch
              id="recurring"
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createNote.isPending || !title.trim()}>
              {createNote.isPending ? 'Adding...' : 'Add Note'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
