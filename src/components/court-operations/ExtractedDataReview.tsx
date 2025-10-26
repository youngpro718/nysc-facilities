import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, Edit2, Trash2, Save, X, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { mapPartToRoom } from '@/utils/courtRoomMapping';

interface CaseDetail {
  defendant: string;
  indictment_no?: string;
  top_charge?: string;
  attorneys?: string[];
  status?: {
    js_date?: string;
    hrg_date?: string;
    conf_date?: string;
    calendar_info?: string;
    adjournment?: string;
  };
}

interface ExtractedSession {
  part_number: string;
  judge_name: string;
  part_sent_by: string;
  defendants: string;
  clerk_name: string;
  room_number: string;
  purpose: string;
  top_charge: string;
  status: string;
  attorney: string;
  extension: string;
  papers: string;
  confidence: number;
  case_count?: number;
  cases?: CaseDetail[];
}

interface ExtractedDataReviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ExtractedSession[];
  onApprove: (data: ExtractedSession[]) => void;
  date: Date;
  period: 'AM' | 'PM' | 'ALL_DAY';
  buildingCode: '100' | '111';
}

export function ExtractedDataReview({
  open,
  onOpenChange,
  data,
  onApprove,
  date,
  period,
  buildingCode
}: ExtractedDataReviewProps) {
  const [sessions, setSessions] = useState<ExtractedSession[]>(data);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<ExtractedSession>>({});
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Update sessions when data prop changes and auto-populate room numbers
  useEffect(() => {
    const sessionsWithRooms = data.map(session => ({
      ...session,
      room_number: session.room_number || mapPartToRoom(session.part_number, buildingCode)
    }));
    setSessions(sessionsWithRooms);
  }, [data, buildingCode]);

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const lowConfidenceCount = sessions.filter(s => s.confidence < 0.8).length;

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditData(sessions[index]);
  };

  const handleSave = () => {
    if (editingIndex !== null) {
      const updated = [...sessions];
      updated[editingIndex] = { ...updated[editingIndex], ...editData };
      setSessions(updated);
      setEditingIndex(null);
      setEditData({});
      toast.success('Session updated');
    }
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setEditData({});
  };

  const handleDelete = (index: number) => {
    const updated = sessions.filter((_, i) => i !== index);
    setSessions(updated);
    toast.success('Session removed');
  };

  const handleApprove = () => {
    onApprove(sessions);
    onOpenChange(false);
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) {
      return <Badge variant="default" className="bg-green-500">High</Badge>;
    } else if (confidence >= 0.7) {
      return <Badge variant="secondary">Medium</Badge>;
    } else {
      return <Badge variant="destructive">Low</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Review Extracted Data</DialogTitle>
          <DialogDescription>
            Review and edit the extracted session data before adding to the system.
            {lowConfidenceCount > 0 && (
              <span className="text-amber-600 font-medium">
                {' '}{lowConfidenceCount} {lowConfidenceCount === 1 ? 'session has' : 'sessions have'} low confidence - please review carefully.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Summary */}
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {sessions.length} sessions extracted for {date.toLocaleDateString()} ({period})
                </p>
                <p className="text-xs text-muted-foreground">
                  Building: {buildingCode} Centre Street
                </p>
              </div>
              {lowConfidenceCount > 0 && (
                <Badge variant="destructive">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {lowConfidenceCount} need review
                </Badge>
              )}
            </div>
          </AlertDescription>
        </Alert>

        {/* Data Table */}
        <div className="overflow-auto max-h-[50vh] border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead className="w-16">Conf.</TableHead>
                <TableHead>Part</TableHead>
                <TableHead>Judge</TableHead>
                <TableHead>Room</TableHead>
                <TableHead className="w-20">Cases</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session, index) => (
                <>
                  {/* Main Row */}
                  <TableRow key={index} className={session.confidence < 0.8 ? 'bg-amber-50' : ''}>
                    <TableCell>
                      {session.cases && session.cases.length > 0 && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => toggleExpanded(index)}
                          className="h-6 w-6 p-0"
                        >
                          {expandedRows.has(index) ? 
                            <ChevronDown className="h-4 w-4" /> : 
                            <ChevronRight className="h-4 w-4" />
                          }
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      {getConfidenceBadge(session.confidence)}
                    </TableCell>
                    <TableCell>
                      {editingIndex === index ? (
                        <Input
                          value={editData.part_number || ''}
                          onChange={(e) => setEditData({ ...editData, part_number: e.target.value })}
                          className="w-20"
                        />
                      ) : (
                        <span className="font-medium">{session.part_number}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingIndex === index ? (
                        <Input
                          value={editData.judge_name || ''}
                          onChange={(e) => setEditData({ ...editData, judge_name: e.target.value })}
                          className="w-full min-w-[150px]"
                        />
                      ) : (
                        session.judge_name
                      )}
                    </TableCell>
                    <TableCell>
                      {editingIndex === index ? (
                        <Input
                          value={editData.room_number || ''}
                          onChange={(e) => setEditData({ ...editData, room_number: e.target.value })}
                          className="w-24"
                        />
                      ) : (
                        <Badge variant="outline">{session.room_number || 'N/A'}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {session.case_count || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate">
                      {editingIndex === index ? (
                        <Input
                          value={editData.purpose || ''}
                          onChange={(e) => setEditData({ ...editData, purpose: e.target.value })}
                          className="w-full"
                        />
                      ) : (
                        session.purpose || session.status || 'Active'
                      )}
                    </TableCell>
                    <TableCell>
                      {editingIndex === index ? (
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={handleSave}>
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={handleCancel}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(index)}>
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(index)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>

                  {/* Expanded Case Details */}
                  {expandedRows.has(index) && session.cases && session.cases.length > 0 && (
                    <TableRow key={`${index}-details`}>
                      <TableCell colSpan={8} className="bg-muted/30 p-4">
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase">Case Details</p>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-xs">Defendant</TableHead>
                                <TableHead className="text-xs">Indictment</TableHead>
                                <TableHead className="text-xs">Top Charge</TableHead>
                                <TableHead className="text-xs">Attorney</TableHead>
                                <TableHead className="text-xs">Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {session.cases.map((courtCase, caseIdx) => (
                                <TableRow key={caseIdx}>
                                  <TableCell className="text-xs font-medium">
                                    {courtCase.defendant}
                                  </TableCell>
                                  <TableCell className="text-xs">
                                    {courtCase.indictment_no || 'N/A'}
                                  </TableCell>
                                  <TableCell className="text-xs">
                                    {courtCase.top_charge || 'N/A'}
                                  </TableCell>
                                  <TableCell className="text-xs">
                                    {courtCase.attorneys?.join(', ') || 'N/A'}
                                  </TableCell>
                                  <TableCell className="text-xs">
                                    {[
                                      courtCase.status?.js_date && `JS: ${courtCase.status.js_date}`,
                                      courtCase.status?.hrg_date && `HRG: ${courtCase.status.hrg_date}`,
                                      courtCase.status?.conf_date && `CONF: ${courtCase.status.conf_date}`,
                                      courtCase.status?.calendar_info,
                                      courtCase.status?.adjournment
                                    ].filter(Boolean).join(', ') || 'N/A'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Instructions */}
        <div className="rounded-lg border p-3 bg-muted/50">
          <p className="text-xs text-muted-foreground">
            <strong>Tip:</strong> Click the edit icon to modify any field. Low confidence items are highlighted in amber.
            Delete any incorrect entries before approving.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApprove} disabled={sessions.length === 0}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve & Add {sessions.length} Sessions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
