
import { useIsMobile } from "@/hooks/use-mobile";
import { type Issue } from "../types/IssueTypes";
import { IssueMobileCard } from "../table/IssueMobileCard";
import { IssueDesktopTable } from "../table/IssueDesktopTable";

interface IssueTableProps {
  issues: Issue[];
}

export const IssueTable = ({ issues }: IssueTableProps) => {
  if (useIsMobile()) {
    return (
      <div className="space-y-4 px-2">
        {issues.map((issue) => (
          <IssueMobileCard key={issue.id} issue={issue} />
        ))}
      </div>
    );
  }

  return <IssueDesktopTable issues={issues} />;
};
