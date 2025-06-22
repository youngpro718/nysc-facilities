
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSupabaseClient } from '@/contexts/SupabaseContext';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/integrations/supabase/types';
import { SupabaseClient } from '@supabase/supabase-js';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Search, FileText, Users, Calendar, Building, Gavel, Upload, FileUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { processCourtTermPdf, importCourtTermData, CourtTermData } from '@/utils/pdfProcessing';
import { useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Types for the Court Term data
interface CourtTerm {
  id: string;
  term_number: string;
  term_name: string;
  location: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  assignments_count?: number;
}

interface CourtAssignment {
  id: string;
  term_id: string;
  room_id: string | null;
  part: string;
  part_details: string | null;
  calendar_day: string | null;
  justice: string;
  room_number: string;
  fax: string | null;
  tel: string | null;
  sergeant: string | null;
  clerks: string[];
}

export function CourtTermsTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('terms');
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  
  const supabase = useSupabaseClient() as SupabaseClient<Database>;
  const queryClient = useQueryClient();
  
  // Fetch court terms
  const { data: courtTerms, isLoading: isLoadingTerms } = useQuery<CourtTerm[]>({
    queryKey: ['court-terms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('court_terms')
        .select(`
          id, 
          term_number, 
          term_name, 
          location, 
          start_date,
          end_date,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Count assignments for each term
      const termsWithCounts = await Promise.all(
        (data || []).map(async (term) => {
          const { count, error: countError } = await supabase
            .from('court_assignments')
            .select('*', { count: 'exact', head: true })
            .eq('term_id', term.id);
            
          return {
            ...term,
            assignments_count: count || 0
          };
        })
      );
      
      return termsWithCounts;
    }
  });
  
  // Fetch assignments for a specific term
  const { data: assignments, isLoading: isLoadingAssignments } = useQuery<CourtAssignment[]>({
    queryKey: ['court-assignments', selectedTerm],
    queryFn: async () => {
      if (!selectedTerm) return [];
      
      const { data, error } = await supabase
        .from('court_assignments')
        .select(`
          id,
          term_id,
          room_id,
          part,
          part_details,
          calendar_day,
          justice,
          fax,
          tel,
          sergeant,
          room_number,
          clerks
        `)
        .eq('term_id', selectedTerm)
        .order('part');
        
      if (error) throw error;
      
      return (data || []).map(assignment => ({
        ...assignment,
        part_details: assignment.part_details as string | null,
        calendar_day: assignment.calendar_day as string | null,
        fax: assignment.fax as string | null,
        tel: assignment.tel as string | null,
        sergeant: assignment.sergeant as string | null,
        clerks: (assignment.clerks as string[]) || []
      }));
    },
    enabled: !!selectedTerm
  });
  
  // Filter court terms based on search term
  const filteredTerms = courtTerms?.filter(term => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      term.term_number.toLowerCase().includes(searchLower) ||
      term.term_name.toLowerCase().includes(searchLower) ||
      term.location.toLowerCase().includes(searchLower)
    );
  });
  
  // Handle term selection for assignments view
  const handleTermSelect = (termId: string) => {
    setSelectedTerm(termId);
    setActiveTab('assignments');
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Court Terms Management</h2>
          <p className="text-muted-foreground">
            Manage court term assignments and import term schedules from PDF documents.
          </p>
        </div>
        <Button onClick={() => setIsImporterOpen(true)} className="flex items-center gap-2">
          <FileUp size={16} />
          Import Court Term
        </Button>
        <CourtTermImporter 
          isOpen={isImporterOpen} 
          onOpenChange={setIsImporterOpen} 
          onImportComplete={() => {
            queryClient.invalidateQueries({ queryKey: ['court-terms'] });
          }} 
        />
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="terms" className="flex items-center gap-2">
            <Calendar size={16} />
            Court Terms
          </TabsTrigger>
          <TabsTrigger 
            value="assignments" 
            className="flex items-center gap-2" 
            disabled={!selectedTerm}
          >
            <Users size={16} />
            Assignments
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="terms" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Available Court Terms</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search terms..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <CardDescription>
                Showing {filteredTerms?.length || 0} court terms
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTerms ? (
                <div className="flex justify-center py-8">Loading court terms...</div>
              ) : filteredTerms?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileText size={48} className="text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No Court Terms Found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm 
                      ? 'Try adjusting your search criteria.' 
                      : 'Import a court term schedule to get started.'}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Term</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-center">Assignments</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTerms?.map((term) => (
                      <TableRow key={term.id}>
                        <TableCell className="font-medium">{term.term_number}</TableCell>
                        <TableCell>{term.term_name}</TableCell>
                        <TableCell>{`${formatDate(term.start_date)} - ${formatDate(term.end_date)}`}</TableCell>
                        <TableCell>{term.location}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{term.assignments_count}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleTermSelect(term.id)}
                          >
                            View Assignments
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="assignments" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>
                    {courtTerms?.find(term => term.id === selectedTerm)?.term_number} Assignments
                  </CardTitle>
                  <CardDescription>
                    {courtTerms?.find(term => term.id === selectedTerm)?.term_name}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('terms')}>
                  Back to Terms
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingAssignments ? (
                <div className="flex justify-center py-8">Loading assignments...</div>
              ) : !assignments || assignments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle size={48} className="text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No Assignments Found</h3>
                  <p className="text-muted-foreground">
                    This court term has no room assignments.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part</TableHead>
                      <TableHead>Justice</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Calendar Day</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Sergeant</TableHead>
                      <TableHead>Clerks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-medium">
                          {assignment.part_details || assignment.part}
                        </TableCell>
                        <TableCell>{assignment.justice}</TableCell>
                        <TableCell>{assignment.room_number}</TableCell>
                        <TableCell>{assignment.calendar_day || '—'}</TableCell>
                        <TableCell>{assignment.tel || '—'}</TableCell>
                        <TableCell>{assignment.sergeant || '—'}</TableCell>
                        <TableCell>
                          {assignment.clerks.length > 0 
                            ? assignment.clerks.join(', ') 
                            : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            <CardFooter className="border-t pt-4">
              <div className="text-sm text-muted-foreground">
                Last updated: {formatDate(courtTerms?.find(term => term.id === selectedTerm)?.updated_at || '')}
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Court Term Importer Component
interface CourtTermImporterProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
}

function CourtTermImporter({ isOpen, onOpenChange, onImportComplete }: CourtTermImporterProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<CourtTermData | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const supabase = useSupabaseClient() as SupabaseClient<Database>;
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      // Reset states
      setSelectedFile(file);
      setExtractedData(null);
      setError(null);
      setSuccess(null);
      setProgress(0);
      
      // Only allow PDF files
      if (!file.type.includes('pdf')) {
        setError('Please select a PDF file');
        return;
      }
      
      // Process the PDF file
      await handleProcessPdf(file);
    }
  };
  
  const handleProcessPdf = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setExtractedData(null);
    setProgress(20);
    try {
      const data = await processCourtTermPdf(file);
      console.log('Processed PDF data:', data);
      if (!data || !data.assignments || data.assignments.length === 0) {
        throw new Error('No valid court term data found in PDF');
      }
      setExtractedData(data);
      setProgress(80);
      toast({
        title: 'PDF Processed Successfully',
        description: `Found ${data.assignments.length} court assignments`,
      });
    } catch (err) {
      console.error('PDF processing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process PDF');
      toast({
        variant: 'destructive',
        title: 'Processing Error',
        description: err instanceof Error ? err.message : 'Failed to process PDF',
      });
    } finally {
      setIsLoading(false);
      setProgress(100);
    }
  };
  
  const handleImport = async () => {
    if (!extractedData) {
      setError('Please process a PDF file first');
      return;
    }

    if (!isAuthenticated) {
      setError('You must be logged in to import court term data');
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'Please log in to import court term data',
      });
      return;
    }
    
    setIsLoading(true);
    setProgress(20);
    try {
      await importCourtTermData(extractedData, supabase);
      
      setSuccess('Court term data imported successfully');
      toast({
        title: 'Import Successful',
        description: 'Court term data has been imported successfully',
      });
      
      // Call the onImportComplete callback if provided
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import court term data');
      toast({
        variant: 'destructive',
        title: 'Import Error',
        description: err instanceof Error ? err.message : 'Failed to import court term data',
      });
    } finally {
      setIsLoading(false);
      setProgress(100);
    }
  };
  
  const resetState = () => {
    setSelectedFile(null);
    setExtractedData(null);
    setError(null);
    setSuccess(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleClose = () => {
    onOpenChange(false);
    resetState();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle className="text-foreground">Import Court Term Data</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Upload a PDF file containing court term data to import.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col space-y-4 text-foreground">
            
            <Separator className="bg-border" />
            
            <div className="grid gap-2">
              <Label htmlFor="pdfFile" className="text-foreground">PDF File</Label>
              <Input
                id="pdfFile"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                disabled={isLoading}
                className="bg-background text-foreground border-input"
              />
            </div>
            
            {selectedFile && (
              <div className="text-sm text-foreground">
                Selected file: {selectedFile.name}
              </div>
            )}
            
            {error && (
              <div className="text-sm text-destructive">
                {error}
              </div>
            )}
            
            {success && (
              <div className="text-sm text-green-500">
                {success}
              </div>
            )}
            
            {extractedData && (
              <div className="text-sm text-foreground bg-muted p-4 rounded-lg">
                <div className="font-medium mb-2">Extracted Data:</div>
                <div className="space-y-1">
                  <div>Assignments: {extractedData.assignments.length}</div>
                </div>
              </div>
            )}
        </div>
        
        <DialogFooter>
          <Button
            onClick={handleImport}
            disabled={!selectedFile || isLoading || !extractedData}
            variant="default"
            className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-[100px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              'Import'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
