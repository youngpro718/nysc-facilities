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
import { TermActionsMenu } from '../components/TermActionsMenu';
import { Separator } from '@/components/ui/separator';
import { Upload, Calendar, Users, Plus, Trash, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { AdminFixMissingPolicy } from '../components/AdminFixMissingPolicy';
import { DatabaseMigrationHelper } from '../components/DatabaseMigrationHelper';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function TermSchedulePage() {
  const { terms, currentTerm, isLoading, importTerm, isImporting, deleteTerm, isDeleting } = useTerms();
  const [selectedTermId, setSelectedTermId] = useState<string>('');
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoData, setDemoData] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Add this state to track if delete is working
  const [showDeleteFix, setShowDeleteFix] = useState(false);
  // Add state to show database migration helper
  const [showDatabaseMigration, setShowDatabaseMigration] = useState(false);
  const [termToDelete, setTermToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
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
  
  // Move conditional selection of current term into a useEffect
  useEffect(() => {
    // When component loads, if there's a current term, select it
    if (currentTerm && !selectedTermId) {
      setSelectedTermId(currentTerm.id);
    }
    // If there's no selected term but there are terms available, select the first one
    else if (!selectedTermId && terms.length > 0 && !isLoading) {
      setSelectedTermId(terms[0].id);
    }
  }, [currentTerm, selectedTermId, terms, isLoading]);
  
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

  const handleCreateTerm = () => {
    // Navigate to the term creation page - update to use court-terms route
    navigate('/court-terms/create');
  };
  
  // Add error handler for import term
  const handleImportTerm = (data: any) => {
    if (isDemoMode) {
      handleDemoImport(data);
    } else {
      importTerm(data, {
        onError: (error) => {
          console.error("Error importing term:", error);
          // Check if error is related to missing date columns
          if (error.message && (error.message.includes("end_date") || error.message.includes("start_date"))) {
            setShowDatabaseMigration(true);
            toast({
              title: "Database Update Required",
              description: "Your database needs date columns. See instructions below.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Import Failed",
              description: "There was an error importing the term data.",
              variant: "destructive",
            });
          }
        }
      });
      toast({
        title: "Term Import Started",
        description: "Your term document is being processed and imported.",
      });
    }
  };

  const handleDeleteClick = (termId: string) => {
    setTermToDelete(termId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (termToDelete) {
      deleteTerm(termToDelete, {
        onError: (error) => {
          console.error("Delete term error:", error);
          setShowDeleteFix(true);
        }
      });
    }
    setIsDeleteDialogOpen(false);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Court Term Schedule</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleCreateTerm}>
            <Plus className="mr-2 h-4 w-4" />
            New Term
          </Button>
          <Button onClick={() => setIsImportDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import Term Schedule
          </Button>
        </div>
      </div>
      
      {/* Show database migration helper if needed */}
      {showDatabaseMigration && <DatabaseMigrationHelper />}
      
      {/* Show delete policy helper if needed */}
      {showDeleteFix && <AdminFixMissingPolicy />}
      
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
            <p>Create a new term or import a term schedule document to get started.</p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleCreateTerm}>
              <Plus className="mr-2 h-4 w-4" />
              New Term
            </Button>
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
              <CardTitle>Court Terms</CardTitle>
              <CardDescription>
                Select a term to view its schedule and assignments. You can also edit or delete terms from this list.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Term Name</TableHead>
                    <TableHead>Date Range</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {terms.map(term => (
                    <TableRow 
                      key={term.id} 
                      className={selectedTermId === term.id ? "bg-muted/50" : ""}
                      onClick={() => setSelectedTermId(term.id)}
                    >
                      <TableCell className="font-medium cursor-pointer">
                        {term.term_name}
                      </TableCell>
                      <TableCell className="cursor-pointer">
                        {format(new Date(term.start_date), "MMM d")} - {format(new Date(term.end_date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="cursor-pointer">
                        {term.location}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/court-terms/${term.id}/edit`);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(term.id);
                            }}
                          >
                            <Trash className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          {selectedTerm && (
            <>
              <Card className="border-2 border-muted">
                <CardHeader className="text-center relative">
                  <div className="absolute top-2 right-2">
                    <TermActionsMenu 
                      term={selectedTerm} 
                      onDeleteError={() => setShowDeleteFix(true)}
                    />
                  </div>
                  
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
        onSuccess={handleImportTerm}
      />
      
      {/* Add delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected court term and all related assignments and personnel.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
