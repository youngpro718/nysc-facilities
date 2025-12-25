import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Info, Wrench, AlertCircle, Plus, Check, RefreshCw, Trash2 } from 'lucide-react';
import { useActiveRoomNotes, useUpdateRoomNote, useDeleteRoomNote, useRecordOccurrence } from '@/hooks/useRoomNotes';
import { RoomNote, NoteSeverity, NoteType } from '@/types/roomNotes';
import { AddNoteDialog } from './AddNoteDialog';
import { format, differenceInDays } from 'date-fns';

interface RoomNotesPanelProps {
  roomId: string;
  compact?: boolean;
}

export function RoomNotesPanel({ roomId, compact = false }: RoomNotesPanelProps) {
  const { data: notes = [], isLoading } = useActiveRoomNotes(roomId);
  const updateNote = useUpdateRoomNote();
  const deleteNote = useDeleteRoomNote();
  const recordOccurrence = useRecordOccurrence();
  const [showAddDialog, setShowAddDialog] = useState(false);

  const getNoteIcon = (type: NoteType) => {
    switch (type) {
      case 'known_issue': return <AlertTriangle className="h-3.5 w-3.5" />;
      case 'warning': return <AlertCircle className="h-3.5 w-3.5" />;
      case 'maintenance': return <Wrench className="h-3.5 w-3.5" />;
      default: return <Info className="h-3.5 w-3.5" />;
    }
  };

  const getSeverityColor = (severity: NoteSeverity | null) => {
    switch (severity) {
      case 'high': return 'border-l-red-500 bg-red-50 dark:bg-red-950/20';
      case 'medium': return 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/20';
      default: return 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20';
    }
  };

  const getSeverityBadge = (severity: NoteSeverity | null) => {
    switch (severity) {
      case 'high': return <Badge variant="destructive" className="text-[10px] px-1 py-0">High</Badge>;
      case 'medium': return <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-amber-100 text-amber-800">Medium</Badge>;
      default: return <Badge variant="outline" className="text-[10px] px-1 py-0">Low</Badge>;
    }
  };

  const handleResolve = (note: RoomNote) => {
    updateNote.mutate({ id: note.id, roomId, updates: { is_resolved: true } });
  };

  const handleRecordOccurrence = (note: RoomNote) => {
    recordOccurrence.mutate({ id: note.id, roomId });
  };

  const handleDelete = (note: RoomNote) => {
    deleteNote.mutate({ id: note.id, roomId });
  };

  if (isLoading) {
    return <div className="text-xs text-muted-foreground p-2">Loading notes...</div>;
  }

  if (compact) {
    // Compact view for CardFront
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Known Issues</span>
          {notes.length > 0 && (
            <Badge variant="secondary" className="text-[10px]">{notes.length}</Badge>
          )}
        </div>
        {notes.length === 0 ? (
          <p className="text-xs text-muted-foreground/60 italic">No active issues</p>
        ) : (
          <div className="space-y-1">
            {notes.slice(0, 3).map((note) => (
              <div key={note.id} className={`text-xs p-1.5 rounded border-l-2 ${getSeverityColor(note.severity)}`}>
                <div className="flex items-center gap-1.5">
                  {getNoteIcon(note.note_type)}
                  <span className="font-medium truncate">{note.title}</span>
                  {note.is_recurring && <RefreshCw className="h-2.5 w-2.5 text-muted-foreground" />}
                </div>
              </div>
            ))}
            {notes.length > 3 && (
              <p className="text-[10px] text-muted-foreground">+{notes.length - 3} more</p>
            )}
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full h-7 text-xs"
          onClick={(e) => { e.stopPropagation(); setShowAddDialog(true); }}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Note
        </Button>
        <AddNoteDialog
          roomId={roomId}
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
        />
      </div>
    );
  }

  // Full view for CardBack Notes tab
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Room Notes & Known Issues</h4>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={() => setShowAddDialog(true)}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Note
        </Button>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-6 bg-muted/10 rounded-lg border border-dashed">
          <Info className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
          <p className="text-sm text-muted-foreground">No active notes</p>
          <p className="text-xs text-muted-foreground/60">Add notes to track recurring issues</p>
        </div>
      ) : (
        <ScrollArea className="h-[300px]">
          <div className="space-y-3 pr-2">
            {notes.map((note) => (
              <div key={note.id} className={`p-3 rounded-r-md border-l-4 ${getSeverityColor(note.severity)}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <div className="mt-0.5 text-muted-foreground">
                      {getNoteIcon(note.note_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium text-sm">{note.title}</span>
                        {getSeverityBadge(note.severity)}
                        {note.is_recurring && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0">
                            <RefreshCw className="h-2.5 w-2.5 mr-0.5" />
                            Recurring
                          </Badge>
                        )}
                      </div>
                      {note.content && (
                        <p className="text-xs text-muted-foreground mb-2">{note.content}</p>
                      )}
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>
                          First reported: {note.first_reported ? format(new Date(note.first_reported), 'MMM d, yyyy') : 'Unknown'}
                        </span>
                        {note.occurrence_count > 1 && (
                          <span className="font-medium text-amber-600">
                            • {note.occurrence_count}x occurrences
                          </span>
                        )}
                        {note.last_occurrence && (
                          <span>
                            • Last: {differenceInDays(new Date(), new Date(note.last_occurrence))}d ago
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/50">
                  {note.is_recurring && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] px-2"
                      onClick={() => handleRecordOccurrence(note)}
                      disabled={recordOccurrence.isPending}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Record Occurrence
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] px-2 text-green-600 hover:text-green-700"
                    onClick={() => handleResolve(note)}
                    disabled={updateNote.isPending}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Resolve
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] px-2 text-destructive hover:text-destructive/80 ml-auto"
                    onClick={() => handleDelete(note)}
                    disabled={deleteNote.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      <AddNoteDialog
        roomId={roomId}
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />
    </div>
  );
}
