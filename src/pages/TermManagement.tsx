
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { TermUploader } from "@/components/terms/TermUploader";
import { TermList } from "@/components/terms/TermList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, ClipboardListIcon, UsersIcon, FileTextIcon } from "lucide-react";

export function TermManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "upload");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  // Update URL when tab changes
  useEffect(() => {
    setSearchParams({ tab: activeTab });
  }, [activeTab, setSearchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Reset success message when changing tabs
    if (value !== "upload") {
      setUploadSuccess(false);
    }
  };

  const handleUploadSuccess = () => {
    setUploadSuccess(true);
    // Automatically switch to terms tab after successful upload
    setTimeout(() => {
      setActiveTab("terms");
      setUploadSuccess(false);
    }, 2000);
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Court Term Management</h1>
      
      {uploadSuccess && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <Info className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Success!</AlertTitle>
          <AlertDescription className="text-green-700">
            Term sheet uploaded and processed successfully. Redirecting to term list...
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs 
        value={activeTab} 
        className="w-full"
        onValueChange={handleTabChange}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <FileTextIcon className="h-4 w-4" />
            Upload Term Sheet
          </TabsTrigger>
          <TabsTrigger value="terms" className="flex items-center gap-2">
            <ClipboardListIcon className="h-4 w-4" />
            Term Schedules
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <ClipboardListIcon className="h-4 w-4" />
            Assignments
          </TabsTrigger>
          <TabsTrigger value="personnel" className="flex items-center gap-2">
            <UsersIcon className="h-4 w-4" />
            Personnel
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-4">
          <ErrorBoundary>
            <TermUploader onUploadSuccess={handleUploadSuccess} />
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
