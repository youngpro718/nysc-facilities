
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IssueDialog } from "@/components/issues/IssueDialog";
import { IssuesList } from "@/components/issues/IssuesList";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";

const Issues = () => {
  const [showIssueForm, setShowIssueForm] = useState(false);
  
  return (
    <PageContainer>
      <PageHeader 
        title="Issues" 
        description="Manage and track facility issues"
      >
        <Button onClick={() => setShowIssueForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Report Issue
        </Button>
      </PageHeader>

      <IssueDialog 
        open={showIssueForm} 
        onOpenChange={setShowIssueForm}
      />
      
      <IssuesList />
    </PageContainer>
  );
};

export default Issues;
