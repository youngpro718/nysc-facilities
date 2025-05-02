
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { TermUploader } from "@/components/terms/TermUploader";
import { TermList } from "@/components/terms/TermList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { 
  Info, 
  ClipboardListIcon, 
  UsersIcon, 
  FileTextIcon,
  CalendarIcon,
  PlusIcon
} from "lucide-react";

export function TermManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "terms");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const navigate = useNavigate();
  
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Court Term Management</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setActiveTab("upload")}
          >
            <FileTextIcon className="h-4 w-4 mr-2" />
            Upload Term Sheet
          </Button>
          <Button
            onClick={() => navigate("/terms/create")}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create New Term
          </Button>
        </div>
      </div>
      
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
          <TabsTrigger value="terms" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Term Schedules
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <FileTextIcon className="h-4 w-4" />
            Upload Term Sheet
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
        
        <TabsContent value="terms" className="space-y-4">
          <ErrorBoundary>
            <TermList />
          </ErrorBoundary>
        </TabsContent>
        
        <TabsContent value="upload" className="space-y-4">
          <ErrorBoundary>
            <TermUploader onUploadSuccess={handleUploadSuccess} />
          </ErrorBoundary>
        </TabsContent>
        
        <TabsContent value="assignments" className="space-y-4">
          <ErrorBoundary>
            <Card>
              <CardHeader>
                <CardTitle>Term Assignments</CardTitle>
                <CardDescription>
                  View and manage court part assignments for all terms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-800">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 mr-2 mt-0.5 text-amber-600" />
                    <div>
                      <h3 className="font-medium mb-1">Assignment Management</h3>
                      <p className="text-sm text-amber-700">
                        This feature is currently being developed. For now, you can view and manage assignments 
                        by selecting a term from the Term Schedules tab and clicking "View Assignments".
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center p-6">
                  <div className="text-center">
                    <h3 className="font-medium mb-2">Recent Terms with Assignments</h3>
                    <p className="text-muted-foreground">
                      Select a term from the Term Schedules tab to view and manage its assignments.
                    </p>
                    <Button 
                      className="mt-4" 
                      variant="outline" 
                      onClick={() => setActiveTab("terms")}
                    >
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      View Terms
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </ErrorBoundary>
        </TabsContent>
        
        <TabsContent value="personnel" className="space-y-4">
          <ErrorBoundary>
            <Card>
              <CardHeader>
                <CardTitle>Term Personnel</CardTitle>
                <CardDescription>
                  View and manage court personnel across all terms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-800">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 mr-2 mt-0.5 text-amber-600" />
                    <div>
                      <h3 className="font-medium mb-1">Personnel Management</h3>
                      <p className="text-sm text-amber-700">
                        This feature is currently being developed. For now, you can view and manage personnel 
                        by selecting a term from the Term Schedules tab and clicking "View Personnel".
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center p-6">
                  <div className="text-center">
                    <h3 className="font-medium mb-2">Court Personnel</h3>
                    <p className="text-muted-foreground">
                      Select a term from the Term Schedules tab to view and manage its personnel.
                    </p>
                    <Button 
                      className="mt-4" 
                      variant="outline" 
                      onClick={() => setActiveTab("terms")}
                    >
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      View Terms
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </ErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default TermManagement;
