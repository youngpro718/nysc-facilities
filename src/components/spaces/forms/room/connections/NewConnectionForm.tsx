
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { NewConnectionFormProps } from "./types";

export function NewConnectionForm({ 
  spaces, 
  isLoading, 
  newConnection, 
  onConnectionChange, 
  onAddConnection, 
  onCancel 
}: NewConnectionFormProps) {
  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading spaces...</div>;
  }

  // Determine if selected space is a hallway
  const selectedSpace = spaces?.find(space => space.id === newConnection.toSpaceId);
  const isHallway = selectedSpace?.type === 'hallway';
  
  return (
    <div className="space-y-3 p-3 border rounded-md">
      <div className="space-y-2">
        <Select
          value={newConnection.toSpaceId}
          onValueChange={(value) => onConnectionChange("toSpaceId", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select space to connect to" />
          </SelectTrigger>
          <SelectContent>
            {spaces?.map(space => (
              <SelectItem key={space.id} value={space.id}>
                {space.room_number 
                  ? `${space.name} (${space.room_number})`
                  : space.name} ({space.type})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={newConnection.connectionType}
          onValueChange={(value) => onConnectionChange("connectionType", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select connection type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="door">Door</SelectItem>
            <SelectItem value="direct">Direct</SelectItem>
            <SelectItem value="secured">Secured</SelectItem>
            {isHallway && (
              <SelectItem value="transition">Transition Door</SelectItem>
            )}
          </SelectContent>
        </Select>

        {isHallway && (
          <Select
            value={newConnection.direction}
            onValueChange={(value) => onConnectionChange("direction", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Position on hallway" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="north">Start of Hallway</SelectItem>
              <SelectItem value="center">Middle of Hallway</SelectItem>
              <SelectItem value="south">End of Hallway</SelectItem>
              <SelectItem value="east">Right Side of Hallway</SelectItem>
              <SelectItem value="west">Left Side of Hallway</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="flex gap-2 justify-end">
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button 
          type="button" 
          size="sm"
          onClick={onAddConnection}
        >
          Add Connection
        </Button>
      </div>
    </div>
  );
}
