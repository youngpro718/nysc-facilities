import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, MapPin, Scale } from 'lucide-react';
import { useState } from 'react';

interface CourtReportPreviewProps {
  reportData: Record<string, unknown>;
}

export function CourtReportPreview({ reportData }: CourtReportPreviewProps) {
  const [expandedParts, setExpandedParts] = useState<Set<string>>(new Set());

  const togglePart = (part: string) => {
    setExpandedParts(prev => {
      const next = new Set(prev);
      if (next.has(part)) {
        next.delete(part);
      } else {
        next.add(part);
      }
      return next;
    });
  };

  if (!reportData?.extracted_data) {
    return null;
  }

  const data = reportData.extracted_data;

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b pb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold mb-2">Court Daily Report</h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(data.report_date).toLocaleDateString()}</span>
                </div>
                <Badge variant="outline">{data.report_type}</Badge>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{data.location}</span>
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="text-sm">
              {data.entries.length} Parts
            </Badge>
          </div>
        </div>

        {/* Parts List */}
        <div className="space-y-3">
          {data.entries.map((entry: Record<string, unknown>, idx: number) => {
            const isExpanded = expandedParts.has(entry.part);
            const casesCount = entry.cases?.length || 0;
            
            return (
              <Card key={idx} className="p-4">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => togglePart(entry.part)}
                >
                  <div className="flex items-center gap-3">
                    <Scale className="h-5 w-5 text-primary" />
                    <div>
                      <div className="font-semibold">Part {entry.part}</div>
                      <div className="text-sm text-muted-foreground">{entry.judge}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{casesCount} cases</Badge>
                    <Button variant="ghost" size="sm">
                      {isExpanded ? 'Hide' : 'Show'}
                    </Button>
                  </div>
                </div>

                {isExpanded && entry.cases && entry.cases.length > 0 && (
                  <div className="mt-4 space-y-2 pl-8 border-l-2">
                    {entry.cases.map((courtCase: Record<string, unknown>, caseIdx: number) => (
                      <div key={caseIdx} className="py-2 border-b last:border-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{courtCase.defendant}</span>
                              {courtCase.jury_indicator && (
                                <Badge variant="secondary" className="text-xs">Jury</Badge>
                              )}
                            </div>
                            {courtCase.indictment_number && (
                              <div className="text-sm text-muted-foreground">
                                Case: {courtCase.indictment_number}
                              </div>
                            )}
                            {courtCase.top_charge && (
                              <div className="text-sm text-muted-foreground">
                                Charge: {courtCase.top_charge}
                              </div>
                            )}
                            {courtCase.attorneys && courtCase.attorneys.length > 0 && (
                              <div className="text-sm text-muted-foreground">
                                Attorney: {courtCase.attorneys.join(', ')}
                              </div>
                            )}
                          </div>
                          {courtCase.status && (
                            <div className="text-xs text-muted-foreground space-y-1">
                              {courtCase.status.js_date && (
                                <div>JS: {courtCase.status.js_date}</div>
                              )}
                              {courtCase.status.hrg_date && (
                                <div>HRG: {courtCase.status.hrg_date}</div>
                              )}
                              {courtCase.status.conf_date && (
                                <div>CONF: {courtCase.status.conf_date}</div>
                              )}
                              {courtCase.status.calendar_info && (
                                <div>{courtCase.status.calendar_info}</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {entry.special_notes && entry.special_notes.length > 0 && isExpanded && (
                  <div className="mt-3 pl-8 text-sm text-muted-foreground italic">
                    Notes: {entry.special_notes.join('; ')}
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Footer Notes */}
        {data.footer_notes && data.footer_notes.length > 0 && (
          <Card className="p-4 bg-muted/30">
            <div className="text-sm space-y-1">
              <div className="font-medium mb-2">Report Notes:</div>
              {data.footer_notes.map((note: string, idx: number) => (
                <div key={idx} className="text-muted-foreground">{note}</div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </Card>
  );
}
