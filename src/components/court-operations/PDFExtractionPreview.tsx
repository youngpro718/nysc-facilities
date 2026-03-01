import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
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

      {/* Table */}
      <ScrollArea className="h-[450px] rounded-md border">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-muted/90 backdrop-blur z-10">
            <tr className="border-b">
              <th className="w-8 px-2 py-2"></th>
              <th className="px-2 py-2 text-left font-semibold">Part</th>
              <th className="px-2 py-2 text-left font-semibold">Justice</th>
              <th className="px-2 py-2 text-left font-semibold">Cal Day</th>
              <th className="px-2 py-2 text-left font-semibold">Room</th>
              <th className="px-2 py-2 text-left font-semibold">Cases</th>
              <th className="px-2 py-2 text-left font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {editedParts.map((part, index) => {
              const isSelected = selectedParts.has(index);
              const isMapped = part.mapping_status === 'found';
              const topDefendants = part.cases.slice(0, 2).map(c => c.defendant).filter(Boolean);

              return (
                <tr
                  key={index}
                  className={`hover:bg-muted/30 transition-colors ${isSelected ? 'bg-primary/5' : ''
                    } ${!isMapped ? 'bg-amber-500/5' : ''}`}
                >
                  <td className="px-2 py-1.5 text-center">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggle(index)}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <span className="font-bold text-primary">{part.part}</span>
                  </td>
                  <td className="px-2 py-1.5">
                    <Input
                      value={part.judge}
                      onChange={(e) => handleEditPart(index, 'judge', e.target.value)}
                      className="h-7 text-xs px-1.5 w-36"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <Input
                      value={part.calendar_day}
                      onChange={(e) => handleEditPart(index, 'calendar_day', e.target.value)}
                      className="h-7 text-xs px-1.5 w-20"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    {isMapped ? (
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        {part.room_number || '✓ Mapped'}
                      </span>
                    ) : availableRooms.length > 0 ? (
                      <Select
                        onValueChange={(value) => {
                          handleEditPart(index, 'courtroom_id', value);
                          handleEditPart(index, 'mapping_status', 'found');
                          const room = availableRooms.find(r => r.id === value);
                          if (room) handleEditPart(index, 'room_number', room.room_number);
                        }}
                      >
                        <SelectTrigger className="h-7 text-xs w-28">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableRooms.map((room) => (
                            <SelectItem key={room.id} value={room.id} className="text-xs">
                              {room.room_number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> ?
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="text-muted-foreground">
                      <span className="font-medium text-foreground">{part.cases.length}</span>
                      {topDefendants.length > 0 && (
                        <span className="ml-1 text-[10px]">
                          ({topDefendants.join(', ')}{part.cases.length > 2 ? '…' : ''})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-1.5">
                    {isMapped ? (
                      <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    )}
                  </td>
                </tr>
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
