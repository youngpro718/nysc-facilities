
import { format } from "date-fns";
import { TableCell, TableRow } from "@/components/ui/table";
import { type Issue } from "../types/IssueTypes";
import { getStatusIcon, getPriorityClass } from "./utils";

interface IssueTableRowProps {
  issue: Issue;
}

export const IssueTableRow = ({ issue }: IssueTableRowProps) => {
  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          {getStatusIcon(issue.status)}
          <span className="capitalize">{issue.status.replace('_', ' ')}</span>
        </div>
      </TableCell>
      <TableCell>{issue.title}</TableCell>
      <TableCell>{issue.type}</TableCell>
      <TableCell>
        <span className={`px-2 py-1 rounded-full text-xs ${getPriorityClass(issue.priority)}`}>
          {issue.priority}
        </span>
      </TableCell>
      <TableCell>
        {[issue.buildingName, issue.floorName, issue.roomName]
          .filter(Boolean)
          .join(' > ')}
      </TableCell>
      <TableCell>{issue.assigned_to}</TableCell>
      <TableCell>
        {issue.due_date ? format(new Date(issue.due_date), 'MMM d, yyyy') : '-'}
      </TableCell>
      <TableCell>
        {format(new Date(issue.created_at), 'MMM d, yyyy')}
      </TableCell>
    </TableRow>
  );
};
