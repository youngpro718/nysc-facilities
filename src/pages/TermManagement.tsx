
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { TermUploader } from "@/components/terms/TermUploader";
import { TermList } from "@/components/terms/TermList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
            <Card className="p-6 bg-white rounded-lg shadow">
              <CardHeader>
                <CardTitle>Term Assignments</CardTitle>
                <CardDescription>
                  View and manage court part assignments for all terms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Select a term from the Term Schedules tab and click "View Assignments" to see details,
                  or use the integrated assignments view to manage assignments across terms.
                </p>
              </CardContent>
            </Card>
          </ErrorBoundary>
        </TabsContent>
        
        <TabsContent value="personnel" className="space-y-4">
          <ErrorBoundary>
            <Card className="p-6 bg-white rounded-lg shadow">
              <CardHeader>
                <CardTitle>Term Personnel</CardTitle>
                <CardDescription>
                  View and manage court personnel across all terms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Select a term from the Term Schedules tab and click "View Personnel" to see details,
                  or use this integrated view to manage personnel across terms.
                </p>
              </CardContent>
            </Card>
          </ErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default TermManagement;
