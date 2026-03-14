import { useState, Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, CheckCircle, MapPin } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface ExtractedPart {
  part: string;
  judge: string;
  calendar_day: string;
  out_dates?: string[];
  room_number?: string;
  cases: Array<{
    sending_part?: string;
    defendant?: string;
    purpose?: string;
    transfer_date?: string;
    top_charge?: string;
    status?: string;
    calendar_date?: string;
    case_count?: number;
    attorney?: string;
    estimated_final_date?: string;
    is_juvenile?: boolean;
  }>;
  confidence: number;
  courtroom_id?: string;
  mapping_status?: 'found' | 'not_found' | 'low_confidence';
  mapping_message?: string;
  needs_review?: boolean;
}

interface PDFExtractionPreviewProps {
  parts: ExtractedPart[];
  buildingCode: '100' | '111';
  onAccept: (selectedParts: ExtractedPart[]) => void;
  onCancel: () => void;
  availableRooms?: Array<{ id: string; room_number: string; name: string }>;
}

export function PDFExtractionPreview({
  parts,
  buildingCode,
  onAccept,
  onCancel,
  availableRooms = [],
}: PDFExtractionPreviewProps) {
  const [editedParts, setEditedParts] = useState<ExtractedPart[]>(parts);
  const [selectedParts, setSelectedParts] = useState<Set<number>>(
    new Set(parts.map((_, i) => i))
  );

  const mapped = editedParts.filter(p => p.mapping_status === 'found').length;
  const unmapped = editedParts.filter(p => p.mapping_status === 'not_found').length;

  const handleToggle = (index: number) => {
    const next = new Set(selectedParts);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setSelectedParts(next);
  };

  const handleSelectAll = () => setSelectedParts(new Set(editedParts.map((_, i) => i)));
  const handleDeselectAll = () => setSelectedParts(new Set());

  const handleEditPart = (index: number, field: string, value: unknown) => {
    const newParts = [...editedParts];
    newParts[index] = { ...newParts[index], [field]: value };
    setEditedParts(newParts);
  };

  const handleAccept = () => {
    const selected = Array.from(selectedParts).map(i => editedParts[i]);
    onAccept(selected);
  };

  return (
    <div className="space-y-3">
      {/* Summary Bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3 text-sm">
          <span className="font-semibold">{editedParts.length} parts found</span>
          <Badge variant="secondary" className="text-xs">{buildingCode} Centre St</Badge>
          {mapped > 0 && (
            <span className="text-green-600 dark:text-green-400 flex items-center gap-1 text-xs">
              <CheckCircle className="h-3 w-3" /> {mapped} mapped
            </span>
          )}
          {unmapped > 0 && (
            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 text-xs">
              <AlertTriangle className="h-3 w-3" /> {unmapped} need room
            </span>
          )}
        </div>
        <div className="flex gap-1.5">
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleSelectAll}>
            All
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleDeselectAll}>
            None
          </Button>
        </div>
      </div>

      {/* Table — matches SessionsTable columns */}
      <ScrollArea className="h-[450px] rounded-md border">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-muted/90 backdrop-blur z-10">
            <tr className="border-b">
              <th className="w-8 px-1 py-1.5"></th>
              <th className="px-1.5 py-1.5 text-left font-bold whitespace-nowrap w-[110px]">Room/Part</th>
              <th className="px-1.5 py-1.5 text-left font-bold whitespace-nowrap w-[52px]">Snd Pt</th>
              <th className="px-1.5 py-1.5 text-left font-bold whitespace-nowrap min-w-[100px]">Defendant(s)</th>
              <th className="px-1.5 py-1.5 text-left font-bold whitespace-nowrap w-[42px]">Purp</th>
              <th className="px-1.5 py-1.5 text-left font-bold whitespace-nowrap w-[52px]">Date Tr</th>
              <th className="px-1.5 py-1.5 text-left font-bold whitespace-nowrap min-w-[75px]">Top Charge</th>
              <th className="px-1.5 py-1.5 text-left font-bold whitespace-nowrap min-w-[80px]">Status</th>
              <th className="px-1.5 py-1.5 text-left font-bold whitespace-nowrap min-w-[80px]">Attorney</th>
              <th className="px-1.5 py-1.5 text-left font-bold whitespace-nowrap w-[50px]">Est Fin</th>
            </tr>
          </thead>
          <tbody>
            {editedParts.map((part, index) => {
              const isSelected = selectedParts.has(index);
              const isMapped = part.mapping_status === 'found';
              const hasCases = part.cases.length > 0;
              const statusTexts = part.cases.map(c => c.status).filter(Boolean);

              return (
                <Fragment key={index}>
                  {/* Part header row */}
                  <tr className={`border-t-2 border-border/60 ${isSelected ? 'bg-primary/5' : ''} ${!isMapped ? 'bg-amber-500/5' : ''}`}>
                    <td className="px-1 py-1 text-center" rowSpan={hasCases ? part.cases.length + 1 : 1}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggle(index)}
                      />
                    </td>
                    <td className="px-1.5 py-1" colSpan={9}>
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Room number */}
                        {isMapped ? (
                          <span className="font-bold text-xs">{part.room_number}</span>
                        ) : availableRooms.length > 0 ? (
                          <Select
                            onValueChange={(value) => {
                              handleEditPart(index, 'courtroom_id', value);
                              handleEditPart(index, 'mapping_status', 'found');
                              const room = availableRooms.find(r => r.id === value);
                              if (room) handleEditPart(index, 'room_number', room.room_number);
                            }}
                          >
                            <SelectTrigger className="h-6 text-xs w-24 border-amber-400">
                              <SelectValue placeholder="Room..." />
                            </SelectTrigger>
                            <SelectContent>
                              {availableRooms.map((room) => (
                                <SelectItem key={room.id} value={room.id} className="text-xs">
                                  {room.room_number} — {room.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 text-xs">
                            <MapPin className="h-3 w-3" /> No room
                          </span>
                        )}

                        {/* Part identifier */}
                        <span className="font-semibold text-blue-600 dark:text-blue-400 text-xs">{part.part}</span>

                        {/* Unknown part asterisk */}
                        {!isMapped && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-amber-400 text-amber-600">
                            *
                          </Badge>
                        )}

                        {/* Mapped checkmark */}
                        {isMapped && <CheckCircle className="h-3 w-3 text-green-500" />}

                        {/* Judge */}
                        <span className="text-[10px] text-muted-foreground">{part.judge}</span>

                        {/* Calendar day */}
                        {part.calendar_day && (
                          <span className="text-[9px] text-muted-foreground">Cal {part.calendar_day}</span>
                        )}

                        {/* Out dates */}
                        {part.out_dates && part.out_dates.length > 0 && (
                          <span className="text-[9px] font-medium text-red-600 dark:text-red-400">
                            OUT {part.out_dates.join(', ')}
                          </span>
                        )}

                        {/* Status summary from cases */}
                        {statusTexts.length > 0 && !hasCases && (
                          <span className="text-[10px] text-muted-foreground">{statusTexts[0]}</span>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Case rows — one per case, matching SessionsTable columns */}
                  {part.cases.map((c, ci) => (
                    <tr
                      key={`${index}-${ci}`}
                      className={`hover:bg-muted/20 ${isSelected ? 'bg-primary/[0.02]' : ''} ${!isMapped ? 'bg-amber-500/[0.02]' : ''}`}
                    >
                      {/* Snd Pt */}
                      <td className="px-1.5 py-0.5 text-muted-foreground">{c.sending_part || '—'}</td>
                      {/* Defendant(s) */}
                      <td className="px-1.5 py-0.5">
                        {c.defendant || '—'}
                        {c.is_juvenile && <Badge variant="secondary" className="ml-1 text-[8px] px-1 py-0 h-3">J</Badge>}
                      </td>
                      {/* Purpose */}
                      <td className="px-1.5 py-0.5 text-muted-foreground">{c.purpose || '—'}</td>
                      {/* Date Transferred */}
                      <td className="px-1.5 py-0.5 text-muted-foreground">{c.transfer_date || '—'}</td>
                      {/* Top Charge */}
                      <td className="px-1.5 py-0.5">{c.top_charge || '—'}</td>
                      {/* Status */}
                      <td className="px-1.5 py-0.5 text-muted-foreground">{c.status || '—'}</td>
                      {/* Attorney */}
                      <td className="px-1.5 py-0.5">{c.attorney || '—'}</td>
                      {/* Est Finish */}
                      <td className="px-1.5 py-0.5 text-muted-foreground">{c.estimated_final_date || '—'}</td>
                    </tr>
                  ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </ScrollArea>

      {/* Action Bar */}
      <div className="flex items-center justify-between pt-2 border-t">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          ← Back to Upload
        </Button>
        <div className="flex gap-2">
          <span className="text-xs text-muted-foreground self-center mr-2">
            {selectedParts.size} of {editedParts.length} selected
          </span>
          <Button
            onClick={handleAccept}
            disabled={selectedParts.size === 0}
            size="sm"
          >
            Import {selectedParts.size} Part{selectedParts.size !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    </div>
  );
}
