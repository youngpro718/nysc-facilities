import { UseFormReturn } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { RoomFormData } from "./RoomFormSchema";
import { RoomTypeEnum, roomTypeToString } from "../../rooms/types/roomEnums";
import { wouldCreateCircularDependency } from "@features/spaces/utils/roomValidation";

// Room types that can be parent rooms (typically larger spaces)
export const PARENT_ROOM_TYPES: RoomTypeEnum[] = [
  RoomTypeEnum.OFFICE,
  RoomTypeEnum.COURTROOM,
  RoomTypeEnum.CHAMBER,
  RoomTypeEnum.JUDGES_CHAMBERS,
  RoomTypeEnum.ADMINISTRATIVE_OFFICE,
  RoomTypeEnum.CONFERENCE_ROOM,
  RoomTypeEnum.RECORDS_ROOM,
];

// Room types that can have parent rooms (typically smaller subdivisions)
export const CAN_HAVE_PARENT_ROOM_TYPES: RoomTypeEnum[] = [
  RoomTypeEnum.OFFICE,
  RoomTypeEnum.ADMINISTRATIVE_OFFICE,
  RoomTypeEnum.BREAK_ROOM,
  RoomTypeEnum.IT_ROOM,
  RoomTypeEnum.UTILITY_ROOM,
  RoomTypeEnum.CONFERENCE,
  RoomTypeEnum.CONFERENCE_ROOM,
  RoomTypeEnum.RECORDS_ROOM,
  RoomTypeEnum.FILING_ROOM,
  RoomTypeEnum.WITNESS_ROOM,
  RoomTypeEnum.ROBING_ROOM,
];

// Witness rooms and robing rooms are subordinate to a courtroom rather than
// a generic "office suite" — different label/copy, and their room number
// (when they don't have one of their own) is suggested from the courtroom's.
const COURTROOM_SERVING_TYPES: RoomTypeEnum[] = [
  RoomTypeEnum.WITNESS_ROOM,
  RoomTypeEnum.ROBING_ROOM,
];

const ROOM_NUMBER_SUFFIX: Partial<Record<RoomTypeEnum, string>> = {
  [RoomTypeEnum.WITNESS_ROOM]: "W",
  [RoomTypeEnum.ROBING_ROOM]: "RR",
};

interface ParentRoomFieldProps {
  form: UseFormReturn<RoomFormData>;
  floorId: string;
  currentRoomId?: string; // To prevent self-selection during edit
}

export function ParentRoomField({ form, floorId, currentRoomId }: ParentRoomFieldProps) {
  const roomType = form.watch("roomType") as RoomTypeEnum;
  const [circularWarning, setCircularWarning] = useState<string | null>(null);

  // Only show parent room field for room types that can have parents
  const canHaveParent = CAN_HAVE_PARENT_ROOM_TYPES.includes(roomType);
  const servesCourtroom = COURTROOM_SERVING_TYPES.includes(roomType);

  // Watch for parent room changes and validate
  const selectedParentId = form.watch("parentRoomId");
  
  useEffect(() => {
    async function checkCircular() {
      if (!selectedParentId || !currentRoomId) {
        setCircularWarning(null);
        return;
      }
      
      const isCircular = await wouldCreateCircularDependency(currentRoomId, selectedParentId);
      if (isCircular) {
        setCircularWarning("This selection would create a circular dependency. Please choose a different parent room.");
        form.setError("parentRoomId", {
          type: "circular",
          message: "Circular dependency detected"
        });
      } else {
        setCircularWarning(null);
        form.clearErrors("parentRoomId");
      }
    }
    
    checkCircular();
  }, [selectedParentId, currentRoomId, form]);
  
  // Witness/robing rooms only ever serve a courtroom, so narrow the picker
  // instead of offering every parent-capable room type on the floor.
  const parentTypesForQuery = servesCourtroom ? [RoomTypeEnum.COURTROOM] : PARENT_ROOM_TYPES;

  const { data: potentialParents, isLoading } = useQuery({
    queryKey: ["potential-parent-rooms", floorId, currentRoomId, servesCourtroom],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('id, name, room_number, room_type')
        .eq('floor_id', floorId)
        .neq('id', currentRoomId || '') // Exclude current room if editing
        .in('room_type', parentTypesForQuery.map(type => roomTypeToString(type)))
        .eq('status', 'active')
        .order('room_number');

      if (error) throw error;
      return data || [];
    },
    enabled: canHaveParent && !!floorId,
  });

  if (!canHaveParent) {
    return null;
  }

  const label = servesCourtroom ? "Courtroom (Part)" : "Office Suite (Optional)";
  const placeholder = servesCourtroom ? "Select the courtroom this serves..." : "Select an office suite...";
  const emptyOptionLabel = servesCourtroom ? "No courtroom linked yet" : "No office suite";
  const description = servesCourtroom
    ? "Link this room to the courtroom it serves. If it doesn't have its own room number yet, one will be suggested from the courtroom's number — you can still edit it."
    : "Select an office suite if this is a sub room or subdivision of a larger space.";

  const handleParentChange = (value: string, field: { onChange: (v: string | null) => void }) => {
    field.onChange(value === 'none' ? null : value);

    if (!servesCourtroom || value === 'none') return;

    const currentRoomNumber = form.getValues('roomNumber');
    if (currentRoomNumber && currentRoomNumber.trim().length > 0) return; // don't clobber a manually entered number

    const parentRoom = potentialParents?.find((room) => room.id === value);
    const suffix = ROOM_NUMBER_SUFFIX[roomType];
    if (parentRoom?.room_number && suffix) {
      form.setValue('roomNumber', `${parentRoom.room_number}-${suffix}`, { shouldValidate: true });
    }
  };

  return (
    <div className="space-y-2">
      <FormField
        control={form.control}
        name="parentRoomId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <Select
              onValueChange={(value) => handleParentChange(value, field)}
              value={field.value || 'none'}
              disabled={isLoading}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="none">{emptyOptionLabel}</SelectItem>
                {potentialParents?.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.room_number} - {room.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>{description}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {circularWarning && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{circularWarning}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}