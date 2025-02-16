
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

interface AssignedKeysCardProps {
  keys: UserAssignment[];
}

export function AssignedKeysCard({ keys }: AssignedKeysCardProps) {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Assigned Keys</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Key Name</TableHead>
            <TableHead>Assigned Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {keys.length === 0 ? (
            <TableRow>
              <TableCell colSpan={2} className="text-center">
                No keys assigned
              </TableCell>
            </TableRow>
          ) : (
            keys.map((key) => (
              <TableRow key={key.id}>
                <TableCell>{key.key_name}</TableCell>
                <TableCell>
                  {new Date(key.assigned_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
