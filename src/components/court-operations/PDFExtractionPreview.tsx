import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertTriangle, CheckCircle, Edit2, Eye, EyeOff, MapPin } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  // Enrichment data
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
    new Set(parts.map((_, i) => i).filter(i => parts[i].confidence >= 0.85))
  );
  const [showAllCases, setShowAllCases] = useState<Set<number>>(new Set());

  const highConfidence = editedParts.filter(p => p.confidence >= 0.85);
  const lowConfidence = editedParts.filter(p => p.confidence < 0.85);
  const unmapped = editedParts.filter(p => p.mapping_status === 'not_found');

  const handleToggleSelection = (index: number) => {
    const newSelected = new Set(selectedParts);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedParts(newSelected);
  };

  const handleSelectAll = () => {
    setSelectedParts(new Set(editedParts.map((_, i) => i)));
  };

  const handleSelectHighConfidence = () => {
    setSelectedParts(
      new Set(editedParts.map((_, i) => i).filter(i => editedParts[i].confidence >= 0.85))
    );
  };

  const handleEditPart = (index: number, field: string, value: unknown) => {
    const newParts = [...editedParts];
    newParts[index] = { ...newParts[index], [field]: value };
    setEditedParts(newParts);
  };

  const handleAccept = () => {
    const selected = Array.from(selectedParts).map(i => editedParts[i]);
    onAccept(selected);
  };

  const toggleShowCases = (index: number) => {
    const newShow = new Set(showAllCases);
    if (newShow.has(index)) {
      newShow.delete(index);
    } else {
      newShow.add(index);
    }
    setShowAllCases(newShow);
  };

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Extracted Data Preview</span>
            <Badge variant="outline">{buildingCode} Centre Street</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Total Parts</div>
              <div className="text-2xl font-bold">{editedParts.length}</div>
            </div>
            <div>
              <div className="text-muted-foreground">High Confidence</div>
              <div className="text-2xl font-bold text-green-600">{highConfidence.length}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Needs Review</div>
              <div className="text-2xl font-bold text-yellow-600">{lowConfidence.length}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Not Mapped</div>
              <div className="text-2xl font-bold text-red-600">{unmapped.length}</div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={handleSelectHighConfidence}>
              Select High Confidence Only
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedParts(new Set())}
            >
              Deselect All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Unmapped Parts Warning */}
      {unmapped.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Unmapped Parts Detected</AlertTitle>
          <AlertDescription>
            {unmapped.length} part(s) could not be mapped to courtrooms. Please manually select
            rooms for these parts before importing.
          </AlertDescription>
        </Alert>
      )}

      {/* Parts List */}
      <ScrollArea className="h-[500px]">
        <div className="space-y-3">
          {editedParts.map((part, index) => {
            const isSelected = selectedParts.has(index);
            const isMapped = part.mapping_status === 'found';
            const showCases = showAllCases.has(index);

            return (
              <Card
                key={index}
                className={`
                  ${part.confidence >= 0.85 ? 'border-green-500/50' : 'border-yellow-500/50'}
                  ${isSelected ? 'ring-2 ring-primary' : ''}
                  ${!isMapped ? 'border-red-500/50' : ''}
                `}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelection(index)}
                        className="mt-1"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">
                            Part {part.part}
                          </h3>
                          <Badge
                            variant={part.confidence >= 0.85 ? 'default' : 'secondary'}
                          >
                            {Math.round(part.confidence * 100)}% confident
                          </Badge>
                          {!isMapped && (
                            <Badge variant="destructive">
                              <MapPin className="h-3 w-3 mr-1" />
                              Not Mapped
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Judge: {part.judge || 'Not specified'}
                        </p>
                      </div>
                    </div>
                    {isMapped ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Judge Name</Label>
                      <Input
                        value={part.judge}
                        onChange={(e) => handleEditPart(index, 'judge', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Calendar Day</Label>
                      <Input
                        value={part.calendar_day}
                        onChange={(e) => handleEditPart(index, 'calendar_day', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>

                  {/* Room Mapping */}
                  {!isMapped && availableRooms.length > 0 && (
                    <div>
                      <Label className="text-xs text-red-600">
                        Select Courtroom Manually
                      </Label>
                      <Select
                        onValueChange={(value) => {
                          handleEditPart(index, 'courtroom_id', value);
                          handleEditPart(index, 'mapping_status', 'found');
                        }}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select a courtroom..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableRooms.map((room) => (
                            <SelectItem key={room.id} value={room.id}>
                              {room.room_number} - {room.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {part.mapping_message && (
                    <Alert>
                      <AlertDescription className="text-xs">
                        {part.mapping_message}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Out Dates */}
                  {part.out_dates && part.out_dates.length > 0 && (
                    <div>
                      <Label className="text-xs">Out Dates</Label>
                      <div className="flex gap-1 flex-wrap mt-1">
                        {part.out_dates.map((date, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {date}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cases Summary */}
                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs font-semibold">
                        Cases ({part.cases.length})
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleShowCases(index)}
                        className="h-6 text-xs"
                      >
                        {showCases ? (
                          <>
                            <EyeOff className="h-3 w-3 mr-1" />
                            Hide
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3 mr-1" />
                            Show All
                          </>
                        )}
                      </Button>
                    </div>

                    {showCases ? (
                      <Accordion type="single" collapsible className="space-y-1">
                        {part.cases.map((caseData, caseIndex) => (
                          <AccordionItem key={caseIndex} value={`case-${caseIndex}`}>
                            <AccordionTrigger className="text-xs py-2 hover:no-underline">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {caseData.defendant || 'No defendant'}
                                </span>
                                {caseData.is_juvenile && (
                                  <Badge variant="secondary" className="text-xs">
                                    (J)
                                  </Badge>
                                )}
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                {caseData.sending_part && (
                                  <div>
                                    <span className="text-muted-foreground">Sending Part:</span>{' '}
                                    {caseData.sending_part}
                                  </div>
                                )}
                                {caseData.purpose && (
                                  <div>
                                    <span className="text-muted-foreground">Purpose:</span>{' '}
                                    {caseData.purpose}
                                  </div>
                                )}
                                {caseData.top_charge && (
                                  <div className="col-span-2">
                                    <span className="text-muted-foreground">Charge:</span>{' '}
                                    {caseData.top_charge}
                                  </div>
                                )}
                                {caseData.status && (
                                  <div>
                                    <span className="text-muted-foreground">Status:</span>{' '}
                                    {caseData.status}
                                  </div>
                                )}
                                {caseData.attorney && (
                                  <div>
                                    <span className="text-muted-foreground">Attorney:</span>{' '}
                                    {caseData.attorney}
                                  </div>
                                )}
                                {caseData.transfer_date && (
                                  <div>
                                    <span className="text-muted-foreground">Transfer Date:</span>{' '}
                                    {caseData.transfer_date}
                                  </div>
                                )}
                                {caseData.estimated_final_date && (
                                  <div>
                                    <span className="text-muted-foreground">Est. Finish:</span>{' '}
                                    {caseData.estimated_final_date}
                                  </div>
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        {part.cases.slice(0, 2).map((c, i) => (
                          <div key={i} className="py-1">
                            • {c.defendant || 'No defendant'} - {c.top_charge || 'No charge'}
                          </div>
                        ))}
                        {part.cases.length > 2 && (
                          <div className="text-xs text-muted-foreground italic">
                            ... and {part.cases.length - 2} more cases
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      {/* Action Buttons */}
      <div className="flex justify-between pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={handleSelectHighConfidence}
            disabled={highConfidence.length === 0}
          >
            Import {highConfidence.length} High Confidence
          </Button>
          <Button
            onClick={handleAccept}
            disabled={selectedParts.size === 0}
          >
            Import {selectedParts.size} Selected Parts
          </Button>
        </div>
      </div>
    </div>
  );
}
