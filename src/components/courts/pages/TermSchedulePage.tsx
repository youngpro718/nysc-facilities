import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTerms } from '../hooks/useTerms';
import { supabase } from '@/integrations/supabase/client';
import { TermAssignmentsTable } from '../components/TermAssignmentsTable';
import { TermImportDialog } from '../components/TermImportDialog';
import { Separator } from '@/components/ui/separator';
import { Upload, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export function TermSchedulePage() {
  const { terms, currentTerm, isLoading, importTerm, isImporting } = useTerms();
  const [selectedTermId, setSelectedTermId] = useState<string>('');
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoData, setDemoData] = useState<any>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    // Check if the database tables exist by attempting to fetch terms
    // If it fails, enable demo mode
    const checkDatabaseSetup = async () => {
      try {
        const { data, error } = await supabase.from('court_terms' as any).select('count').single();
        if (error) {
          console.warn('Database table court_terms not found, enabling demo mode:', error.message);
          setIsDemoMode(true);
          toast({
            title: "Demo Mode Enabled",
            description: "Database tables not yet created. Running in demonstration mode.",
          });
        }
      } catch (error) {
        console.error('Error checking database setup:', error);
        setIsDemoMode(true);
      }
    };
    
    checkDatabaseSetup();
  }, [toast]);
  
  // When component loads, if there's a current term, select it
  if (currentTerm && !selectedTermId) {
    setSelectedTermId(currentTerm.id);
  }
  
  // If there's no selected term but there are terms available, select the first one
  if (!selectedTermId && terms.length > 0 && !isLoading) {
    setSelectedTermId(terms[0].id);
  }
  
  const selectedTerm = terms.find(term => term.id === selectedTermId);
  
  // Handler for import completion in demo mode
  const handleDemoImport = (data: any) => {
    setDemoData(data);
    toast({
      title: "Demo Import Successful",
      description: "Term data processed successfully. In demo mode, data is not saved to the database.",
    });
    setIsImportDialogOpen(false);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Court Term Schedule</h1>
        <Button onClick={() => setIsImportDialogOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Import Term Schedule
        </Button>
      </div>
      
      {isLoading ? (
        <Card>
          <CardHeader>
            <CardTitle>Loading Terms</CardTitle>
            <CardDescription>Please wait while we load court term data.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-40 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      ) : terms.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Court Terms Found</CardTitle>
            <CardDescription>
              There are no court terms in the system yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Import a term schedule document to get started.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => setIsImportDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import Term Schedule
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Select Court Term</CardTitle>
              <CardDescription>
                Choose a term to view its schedule and assignments.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select 
                value={selectedTermId} 
                onValueChange={setSelectedTermId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Court Terms</SelectLabel>
                    {terms.map(term => (
                      <SelectItem key={term.id} value={term.id}>
                        {term.term_name} ({format(new Date(term.start_date), "MMM d")} - {format(new Date(term.end_date), "MMM d, yyyy")})
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
          
          {selectedTerm && (
            <>
              <Card className="border-2 border-muted">
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">
                    {selectedTerm.description || "SUPREME COURT - CRIMINAL TERM"}
                  </CardTitle>
                  <CardDescription className="text-md">
                    {selectedTerm.location}
                  </CardDescription>
                  <div className="font-medium flex items-center justify-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(selectedTerm.start_date), "MMMM d, yyyy")} - {format(new Date(selectedTerm.end_date), "MMMM d, yyyy")}
                  </div>
                </CardHeader>
              </Card>
              
              <Tabs defaultValue="assignments">
                <TabsList className="w-full">
                  <TabsTrigger value="assignments">Court Assignments</TabsTrigger>
                  <TabsTrigger value="personnel">Administrative Personnel</TabsTrigger>
                  <TabsTrigger value="relocations">Related Relocations</TabsTrigger>
                </TabsList>
                
                <TabsContent value="assignments">
                  <TermAssignmentsTable termId={selectedTermId} />
                </TabsContent>
                
                <TabsContent value="personnel">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Administrative Personnel
                      </CardTitle>
                      <CardDescription>
                        Key personnel for the selected court term.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Personnel data will be displayed here when available.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="relocations">
                  <Card>
                    <CardHeader>
                      <CardTitle>Related Relocations</CardTitle>
                      <CardDescription>
                        Relocations scheduled during this term period.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Any relocations that overlap with this term period will be shown here.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </>
      )}
      
      <TermImportDialog
        open={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onSuccess={(data) => {
          if (isDemoMode) {
            handleDemoImport(data);
          } else {
            importTerm(data);
            toast({
              title: "Term Import Started",
              description: "Your term document is being processed and imported.",
            });
          }
        }}
      />
    </div>
  );
}
