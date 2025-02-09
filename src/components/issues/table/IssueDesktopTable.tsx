
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type Issue } from "../types/IssueTypes";
import { IssueTableRow } from "./IssueTableRow";

interface IssueDesktopTableProps {
  issues: Issue[];
}

export const IssueDesktopTable = ({ issues }: IssueDesktopTableProps) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {issues.map((issue) => (
            <IssueTableRow key={issue.id} issue={issue} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
