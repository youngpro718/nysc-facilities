
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
          </SelectContent>
        </Select>

        <Select
          value={newConnection.direction}
          onValueChange={(value) => onConnectionChange("direction", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select direction (optional)" />
          </SelectTrigger>
          <SelectContent>
            {/* Hallway positions and other directions */}
            <SelectItem value="start_of_hallway">Start of Hallway</SelectItem>
            <SelectItem value="middle_of_hallway">Middle of Hallway</SelectItem>
            <SelectItem value="end_of_hallway">End of Hallway</SelectItem>
            <SelectItem value="left_of_hallway">Left of Hallway</SelectItem>
            <SelectItem value="right_of_hallway">Right of Hallway</SelectItem>
            <SelectItem value="adjacent">Adjacent</SelectItem>
          </SelectContent>
        </Select>
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
