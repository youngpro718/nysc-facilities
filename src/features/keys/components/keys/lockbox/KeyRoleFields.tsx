import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LockboxSlotKeyRole } from "../types/LockboxTypes";

interface KeyRoleFieldsProps {
  keyRole: LockboxSlotKeyRole | null;
  subRoomLabel: string;
  onKeyRoleChange: (role: LockboxSlotKeyRole | null) => void;
  onSubRoomLabelChange: (value: string) => void;
  disabled?: boolean;
  selectZIndex?: string;
}

const ROLE_OPTIONS: { value: LockboxSlotKeyRole; label: string; hint?: string }[] = [
  { value: 'main_door', label: 'Main Door' },
  { value: 'top_lock', label: 'Top Lock' },
  { value: 'bottom_lock', label: 'Bottom Lock' },
  { value: 'sub_room', label: 'Sub-Room', hint: 'A room inside this room (e.g. Treatment Office)' },
  { value: 'other', label: 'Other' },
];

const NONE_VALUE = '__none__';

export function KeyRoleFields({
  keyRole,
  subRoomLabel,
  onKeyRoleChange,
  onSubRoomLabelChange,
  disabled,
  selectZIndex = 'z-[120]',
}: KeyRoleFieldsProps) {
  return (
    <div className="space-y-2">
      <Label>Key Role</Label>
      <Select
        value={keyRole ?? NONE_VALUE}
        onValueChange={(v) => onKeyRoleChange(v === NONE_VALUE ? null : (v as LockboxSlotKeyRole))}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder="Unspecified" />
        </SelectTrigger>
        <SelectContent className={selectZIndex}>
          <SelectItem value={NONE_VALUE}>Unspecified</SelectItem>
          {ROLE_OPTIONS.map(opt => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Which lock does this key open? Use Top/Bottom for double-lock doors, or Sub-Room for inner rooms.
      </p>

      {keyRole === 'sub_room' && (
        <div className="pt-1">
          <Label className="text-xs">Sub-Room Name</Label>
          <Input
            placeholder="e.g. Treatment Office"
            value={subRoomLabel}
            onChange={(e) => onSubRoomLabelChange(e.target.value)}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}
