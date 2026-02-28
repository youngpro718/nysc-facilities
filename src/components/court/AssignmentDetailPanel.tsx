import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { PersonnelSelector } from "./PersonnelSelector";
import { JudgeStatusBadge, JudgeStatusDropdown } from "./JudgeStatusManager";
import { useCourtPersonnel } from "@/hooks/useCourtPersonnel";
import { Save, X, Check, Calendar as CalendarIcon, MapPin, Phone, Printer, Users, Gavel, Shield, Trash2 } from "lucide-react";
import { useState } from "react";

interface CourtAssignmentRow {
  room_id: string;
  room_number: string;
  courtroom_number: string | null;
  court_room_id?: string | null;
  assignment_id: string | null;
  part: string | null;
  justice: string | null;
  clerks: string[] | null;
  sergeant: string | null;
  tel: string | null;
  fax: string | null;
  calendar_day: string | null;
  is_active: boolean;
  sort_order: number;
  judge_present?: boolean;
  clerks_present_count?: number;
  justice_departed?: boolean;
  justice_inactive?: boolean;
}

interface AssignmentDetailPanelProps {
  row: CourtAssignmentRow;
  onSave: (field: string, value: string | string[]) => void;
  onDelete?: (assignmentId: string) => void;
  hasIssues: boolean;
  urgentIssues: boolean;
  hasMaintenance: boolean;
}

export const AssignmentDetailPanel = ({ row, onSave, onDelete, hasIssues, urgentIssues, hasMaintenance }: AssignmentDetailPanelProps) => {
  const { personnel } = useCourtPersonnel();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string | string[]>("");

  const startEdit = (field: string, currentValue: string | string[]) => {
    setEditingField(field);
    setEditValue(currentValue);
  };

  const saveEdit = () => {
    if (editingField) {
      onSave(editingField, editValue);
      setEditingField(null);
      setEditValue("");
    }
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const renderField = (
    field: string,
    label: string,
    icon: React.ReactNode,
    currentValue: string | string[] | null
  ) => {
    const isEditing = editingField === field;
    const displayValue = currentValue || "";

    return (
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
          {icon}
          {label}
        </Label>
        {isEditing ? (
          <div className="space-y-2">
            {field === 'justice' ? (
              <PersonnelSelector
                value={editValue as string}
                onValueChange={(v) => setEditValue(v as string)}
                personnel={personnel.judges}
                placeholder="Select judge..."
                role="judge"
                allowCustom
                allowClear
              />
            ) : field === 'clerks' ? (
              <PersonnelSelector
                value={editValue as string[]}
                onValueChange={(v) => setEditValue(v as string[])}
                personnel={personnel.clerks}
                placeholder="Select clerks..."
                role="clerk"
                multiple
                allowCustom
                allowClear
              />
            ) : field === 'sergeant' ? (
              <PersonnelSelector
                value={editValue as string}
                onValueChange={(v) => setEditValue(v as string)}
                personnel={personnel.sergeants}
                placeholder="Select sergeant..."
                role="sergeant"
                allowCustom
                allowClear
              />
            ) : field === 'calendar_day' ? (
              <CalendarDayEditor value={editValue} onChange={setEditValue} />
            ) : (
              <Input
                value={editValue as string}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEdit();
                  if (e.key === 'Escape') cancelEdit();
                }}
                autoFocus
                className="h-9"
              />
            )}
            <div className="flex gap-1.5">
              <Button size="sm" onClick={saveEdit} className="h-7 text-xs">
                <Save className="h-3 w-3 mr-1" /> Save
              </Button>
              <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-7 text-xs">
                <X className="h-3 w-3 mr-1" /> Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="min-h-[36px] flex items-center px-3 py-2 rounded-md border border-transparent hover:border-border hover:bg-muted/50 cursor-pointer transition-colors group"
            onClick={() => startEdit(field, Array.isArray(displayValue) ? displayValue : (displayValue || ""))}
          >
            {field === 'justice' ? (
              <div className="flex items-center gap-2 flex-wrap">
                {row.justice ? (
                  <>
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${row.judge_present ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} />
                    <span className={row.justice_departed || row.justice_inactive ? 'line-through text-muted-foreground' : 'font-medium'}>
                      {row.justice}
                    </span>
                    {row.justice_departed && <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4">Departed</Badge>}
                    {row.justice_inactive && !row.justice_departed && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-orange-400 text-orange-600 dark:text-orange-400">Inactive</Badge>
                    )}
                    {!row.justice_departed && !row.justice_inactive && (
                      <>
                        <JudgeStatusBadge status={personnel.judges.find(j => j.name === row.justice)?.judgeStatus || 'active'} />
                        <JudgeStatusDropdown judgeName={row.justice} compact />
                      </>
                    )}
                  </>
                ) : (
                  <span className="text-muted-foreground text-sm italic">Click to assign</span>
                )}
              </div>
            ) : field === 'clerks' ? (
              <div className="flex flex-wrap gap-1">
                {Array.isArray(displayValue) && displayValue.length > 0 ? (
                  displayValue.map((c, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{c}</Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm italic">Click to assign</span>
                )}
              </div>
            ) : field === 'calendar_day' ? (
              <CalendarDayDisplay value={displayValue as string} />
            ) : (
              <span className={displayValue ? 'text-sm' : 'text-muted-foreground text-sm italic'}>
                {(displayValue as string) || 'Click to add'}
              </span>
            )}
            <span className="ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity text-xs">Edit</span>
          </div>
        )}
      </div>
    );
  };

  // Status banner color
  const statusColor = hasMaintenance
    ? 'border-l-red-500'
    : !row.is_active
      ? 'border-l-blue-500'
      : urgentIssues
        ? 'border-l-yellow-500'
        : row.justice_departed || row.justice_inactive
          ? 'border-l-orange-500'
          : 'border-l-emerald-500';

  return (
    <div className={`h-full flex flex-col border-l-4 ${statusColor}`}>
      {/* Header */}
      <div className="p-4 sm:p-5 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold">Room {row.room_number}</h3>
              {row.courtroom_number && (
                <Badge variant="outline" className="text-xs">Ct {row.courtroom_number}</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {row.part && <Badge className="text-xs">Part {row.part}</Badge>}
              {hasMaintenance && <Badge variant="destructive" className="text-xs">Maintenance</Badge>}
              {!row.is_active && !hasMaintenance && <Badge variant="outline" className="text-xs">Inactive</Badge>}
              {hasIssues && !hasMaintenance && (
                <Badge variant="secondary" className="text-xs text-yellow-700 dark:text-yellow-400">
                  {urgentIssues ? '⚠ Urgent Issues' : 'Has Issues'}
                </Badge>
              )}
            </div>
          </div>
          {row.assignment_id && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(row.assignment_id!)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {renderField('part', 'Part', <MapPin className="h-3.5 w-3.5" />, row.part)}
        {renderField('justice', 'Justice', <Gavel className="h-3.5 w-3.5" />, row.justice)}
        {renderField('clerks', 'Clerks', <Users className="h-3.5 w-3.5" />, row.clerks)}
        {renderField('sergeant', 'Sergeant / Officer', <Shield className="h-3.5 w-3.5" />, row.sergeant)}
        
        <div className="border-t pt-4 space-y-4">
          {renderField('tel', 'Phone', <Phone className="h-3.5 w-3.5" />, row.tel)}
          {renderField('fax', 'Fax', <Printer className="h-3.5 w-3.5" />, row.fax)}
          {renderField('calendar_day', 'Calendar Days', <CalendarIcon className="h-3.5 w-3.5" />, row.calendar_day)}
        </div>
      </div>
    </div>
  );
};

// Calendar day sub-components
const CalendarDayEditor = ({ value, onChange }: { value: string | string[]; onChange: (v: string[]) => void }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const selected = Array.isArray(value) ? value : ((value as string) || '').split(',').map(s => s.trim()).filter(Boolean);
  const toggleDay = (d: string) => {
    const set = new Set(selected);
    if (set.has(d)) set.delete(d); else set.add(d);
    onChange(Array.from(set));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {days.map(d => (
          <Button
            key={d}
            size="sm"
            variant={selected.includes(d) ? 'default' : 'outline'}
            className="h-7 text-xs"
            onClick={() => toggleDay(d)}
          >
            {d.substring(0, 3)}
          </Button>
        ))}
      </div>
      {selected.length > 0 && (
        <Button size="sm" variant="ghost" className="h-6 text-xs text-muted-foreground" onClick={() => onChange([])}>
          Clear all
        </Button>
      )}
    </div>
  );
};

const CalendarDayDisplay = ({ value }: { value: string }) => {
  const abbr: Record<string, string> = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri' };
  const canonMap: Record<string, string> = {
    mon: 'Monday', monday: 'Monday', tue: 'Tuesday', tues: 'Tuesday', tuesday: 'Tuesday',
    wed: 'Wednesday', weds: 'Wednesday', wednesday: 'Wednesday',
    thu: 'Thursday', thur: 'Thursday', thurs: 'Thursday', thursday: 'Thursday',
    fri: 'Friday', friday: 'Friday'
  };
  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  let items: string[] = [];
  try {
    const maybe = JSON.parse(value);
    if (Array.isArray(maybe)) items = maybe;
  } catch {}
  if (!items.length) {
    items = value.replace(/[\[\]"]+/g, '').split(',').map(s => s.trim()).filter(Boolean);
  }
  const parsed = items
    .map(s => canonMap[s.toLowerCase()] || s)
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));

  if (!parsed.length) return <span className="text-muted-foreground text-sm italic">Click to set</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {parsed.map(d => <Badge key={d} variant="secondary" className="text-xs">{abbr[d] || d}</Badge>)}
    </div>
  );
};
