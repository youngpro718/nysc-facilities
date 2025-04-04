
import { Issue } from "../types/IssueTypes";
import { IssueCard } from "../card/IssueCard";
import { DeleteIssueButton } from "../components/DeleteIssueButton";

interface CardViewProps {
  issues: Issue[];
  onIssueSelect: (id: string) => void;
}

export const CardView = ({ issues, onIssueSelect }: CardViewProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {issues?.map((issue) => (
        <div 
          key={issue.id} 
          onClick={() => onIssueSelect(issue.id)}
          className="cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99]"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onIssueSelect(issue.id);
            }
          }}
        >
          <IssueCard 
            issue={issue}
            onMarkAsSeen={() => {}}
            actions={
              <DeleteIssueButton 
                issueId={issue.id} 
                className="mt-2" 
              />
            }
          />
        </div>
      ))}
    </div>
  );
};
