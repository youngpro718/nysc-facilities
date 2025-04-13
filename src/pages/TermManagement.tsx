
import { TermUploader } from "@/components/terms/TermUploader";
import { TermList } from "@/components/terms/TermList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export function TermManagement() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Court Term Management</h1>
      
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="upload">Upload Term Sheet</TabsTrigger>
          <TabsTrigger value="terms">Term Schedules</TabsTrigger>
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
      </Tabs>
    </div>
  );
}

export default TermManagement;
