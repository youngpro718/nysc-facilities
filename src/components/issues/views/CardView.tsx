
import { Issue } from "../types/IssueTypes";
import { IssueCard } from "../card/IssueCard";

interface CardViewProps {
  issues: Issue[];
  onIssueSelect: (id: string) => void;
}

export const CardView = ({ issues, onIssueSelect }: CardViewProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {issues?.map((issue) => (
        <div key={issue.id} onClick={() => onIssueSelect(issue.id)}>
          <IssueCard 
            issue={issue}
            onMarkAsSeen={() => {}}
          />
        </div>
      ))}
    </div>
  );
};
