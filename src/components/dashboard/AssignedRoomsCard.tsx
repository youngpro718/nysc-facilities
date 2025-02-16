
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { UserAssignment } from "@/types/dashboard";

interface AssignedRoomsCardProps {
  rooms: UserAssignment[];
}

export function AssignedRoomsCard({ rooms }: AssignedRoomsCardProps) {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Assigned Rooms</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Room Name</TableHead>
            <TableHead>Assigned Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rooms.length === 0 ? (
            <TableRow>
              <TableCell colSpan={2} className="text-center">
                No rooms assigned
              </TableCell>
            </TableRow>
          ) : (
            rooms.map((room) => (
              <TableRow key={room.id}>
                <TableCell>{room.room_name}</TableCell>
                <TableCell>
                  {new Date(room.assigned_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
