
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { UserIssue } from "@/types/dashboard";

interface ReportedIssuesCardProps {
  issues: UserIssue[];
}

export function ReportedIssuesCard({ issues }: ReportedIssuesCardProps) {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-4">My Reported Issues</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Date Reported</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {issues.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                No issues reported
              </TableCell>
            </TableRow>
          ) : (
            issues.map((issue) => (
              <TableRow key={issue.id}>
                <TableCell>{issue.title}</TableCell>
                <TableCell className="capitalize">{issue.status}</TableCell>
                <TableCell className="capitalize">{issue.priority}</TableCell>
                <TableCell>{issue.rooms?.name || 'N/A'}</TableCell>
                <TableCell>
                  {new Date(issue.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
