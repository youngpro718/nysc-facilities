
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuickIssueForm } from "@/components/issues/QuickIssueForm";
import { useState } from "react";
import { IssuesList } from "@/components/issues/IssuesList";
import { IssueFilters } from "@/components/issues/IssueFilters";
import { useIssueFilters } from "@/components/issues/hooks/useIssueFilters";

const Issues = () => {
  const [showIssueForm, setShowIssueForm] = useState(false);
  const { 
    filters, 
    setFilters, 
    searchQuery,
    setSearchQuery,
    viewMode 
  } = useIssueFilters();
  
  return (
    <div className="space-y-6 max-w-full pb-20">
      <div className="flex justify-between items-center sticky top-0 bg-background z-10 py-4">
        <h1 className="text-xl sm:text-2xl font-bold">Issues</h1>
        <Button onClick={() => setShowIssueForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Report Issue
        </Button>
      </div>

      <div className="space-y-6">
        {showIssueForm ? (
          <QuickIssueForm onSuccess={() => setShowIssueForm(false)} />
        ) : (
          <div className="space-y-6">
            <IssueFilters
              onFilterChange={setFilters}
              onSearchChange={setSearchQuery}
              searchQuery={searchQuery}
              viewMode={viewMode}
            />
            <div className="overflow-y-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <IssuesList />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Issues;
