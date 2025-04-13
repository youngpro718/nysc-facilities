
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { TermUploader } from "@/components/terms/TermUploader";
import { TermList } from "@/components/terms/TermList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export function TermManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "upload";
  
  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Court Term Management</h1>
      
      <Tabs 
        defaultValue={defaultTab} 
        className="w-full"
        onValueChange={handleTabChange}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="upload">Upload Term Sheet</TabsTrigger>
          <TabsTrigger value="terms">Term Schedules</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="personnel">Personnel</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-4">
          <ErrorBoundary>
            <TermUploader />
          </ErrorBoundary>
        </TabsContent>
        
        <TabsContent value="terms" className="space-y-4">
          <ErrorBoundary>
            <TermList />
          </ErrorBoundary>
        </TabsContent>
        
        <TabsContent value="assignments" className="space-y-4">
          <ErrorBoundary>
            <div className="p-6 bg-white rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Term Assignments</h2>
              <p className="text-muted-foreground">
                This section will display court part assignments extracted from term sheets.
                Select a term from the Term Schedules tab and click "View Assignments" to see details.
              </p>
            </div>
          </ErrorBoundary>
        </TabsContent>
        
        <TabsContent value="personnel" className="space-y-4">
          <ErrorBoundary>
            <div className="p-6 bg-white rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Term Personnel</h2>
              <p className="text-muted-foreground">
                This section will allow management of court personnel including justices, 
                clerks, and sergeants associated with court terms.
              </p>
            </div>
          </ErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default TermManagement;
