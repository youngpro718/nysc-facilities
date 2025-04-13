import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CardContent } from '@/components/ui/card';
import { CardFooter } from '@/components/ui/card';
import { CardHeader } from '@/components/ui/card';
import { CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs } from '@/components/ui/tabs';
import { TabsContent } from '@/components/ui/tabs';
import { TabsList } from '@/components/ui/tabs';
import { TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set the worker source for PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
import { TermImportData, CourtTerm, TermAssignment, TermPersonnel } from '../types/termTypes';
import { Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TermVisualImporterProps {
  file: File;
  onSave: (data: TermImportData) => void;
  onCancel: () => void;
}

export function TermVisualImporter({ file, onSave, onCancel }: TermVisualImporterProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [term, setTerm] = useState<Partial<CourtTerm>>({
    term_number: '',
    term_name: '',
    description: '',
    start_date: '',
    end_date: '',
    location: ''
  });
  
  const [personnel, setPersonnel] = useState<Partial<TermPersonnel>[]>([
    { role: 'administrative_judge' as any, name: '', phone: '', room: '' },
    { role: 'chief_clerk' as any, name: '', phone: '', room: '' }
  ]);
  
  const [assignments, setAssignments] = useState<Partial<TermAssignment>[]>([
    createEmptyAssignment()
  ]);
  
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isPdf, setIsPdf] = useState<boolean>(false);
  
  // PDF loading functions
  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
  }
  
  // Change PDF page
  const changePage = (offset: number) => {
    setCurrentPage(prevPageNumber => prevPageNumber + offset);
  };
  
  const previousPage = () => changePage(-1);
  const nextPage = () => changePage(1);
  
  // Generate object URL for the file
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      
      // Check if file is PDF
      setIsPdf(file.type === 'application/pdf');
      
      if (file.type !== 'application/pdf') {
        setLoading(false);
      }
      
      // Extract term info from filename if possible
      const filename = file.name.toUpperCase();
      const termMatch = filename.match(/TERM\s+([IVX\d]+)/i);
      if (termMatch) {
        setTerm(prev => ({ 
          ...prev, 
          term_number: termMatch[1],
          term_name: `Term ${termMatch[1]}`
        }));
      }
      
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [file]);
  
  // Create empty assignment
  function createEmptyAssignment(): Partial<TermAssignment> {
    return {
      part_code: '',
      justice_name: '',
      room_number: '',
      fax: '',
      phone: '',
      tel_extension: '',
      sergeant_name: '',
      clerk_names: ['']
    };
  }
  
  // Add new assignment row
  const addAssignment = () => {
    setAssignments([...assignments, createEmptyAssignment()]);
  };
  
  // Remove an assignment
  const removeAssignment = (index: number) => {
    setAssignments(assignments.filter((_, i) => i !== index));
  };
  
  // Add new personnel
  const addPersonnel = () => {
    setPersonnel([...personnel, { role: '' as any, name: '', phone: '' }]);
  };
  
  // Remove personnel
  const removePersonnel = (index: number) => {
    setPersonnel(personnel.filter((_, i) => i !== index));
  };
  
  // Update assignment at index
  const updateAssignment = (index: number, field: keyof TermAssignment, value: any) => {
    const newAssignments = [...assignments];
    newAssignments[index] = {
      ...newAssignments[index],
      [field]: value
    };
    setAssignments(newAssignments);
  };
  
  // Update clerk name at specific index
  const updateClerkName = (assignmentIndex: number, clerkIndex: number, value: string) => {
    const newAssignments = [...assignments];
    const currentClerks = [...(newAssignments[assignmentIndex].clerk_names || [''])];
    currentClerks[clerkIndex] = value;
    newAssignments[assignmentIndex].clerk_names = currentClerks;
    setAssignments(newAssignments);
  };
  
  // Add clerk to an assignment
  const addClerk = (assignmentIndex: number) => {
    const newAssignments = [...assignments];
    const currentClerks = [...(newAssignments[assignmentIndex].clerk_names || [])];
    currentClerks.push('');
    newAssignments[assignmentIndex].clerk_names = currentClerks;
    setAssignments(newAssignments);
  };
  
  // Remove clerk from an assignment
  const removeClerk = (assignmentIndex: number, clerkIndex: number) => {
    const newAssignments = [...assignments];
    const currentClerks = [...(newAssignments[assignmentIndex].clerk_names || [''])];
    currentClerks.splice(clerkIndex, 1);
    newAssignments[assignmentIndex].clerk_names = currentClerks;
    setAssignments(newAssignments);
  };
  
  // Update personnel field
  const updatePersonnel = (index: number, field: keyof TermPersonnel, value: any) => {
    const newPersonnel = [...personnel];
    newPersonnel[index] = {
      ...newPersonnel[index],
      [field]: value
    };
    setPersonnel(newPersonnel);
  };
  
  // Match room numbers to actual room IDs before saving
  const matchRoomIds = async () => {
    try {
      // Get all room numbers from the assignments
      const roomNumbers = assignments
        .filter(a => a.room_number)
        .map(a => a.room_number);
        
      if (roomNumbers.length === 0) {
        return;
      }
      
      // Query rooms by room numbers
      const { data: rooms, error } = await supabase
        .from('rooms')
        .select('id, room_number')
        .in('room_number', roomNumbers);
        
      if (error) {
        console.error('Error fetching rooms:', error);
        return;
      }
      
      // Create a map of room_number -> id
      const roomMap = Object.fromEntries(
        (rooms || []).map(room => [room.room_number, room.id])
      );
      
      // Update assignments with room IDs
      const updatedAssignments = assignments.map(assignment => {
        if (assignment.room_number && roomMap[assignment.room_number]) {
          return {
            ...assignment,
            room_id: roomMap[assignment.room_number]
          };
        }
        return assignment;
      });
      
      setAssignments(updatedAssignments);
    } catch (err) {
      console.error('Error matching room IDs:', err);
    }
  };
  
  // Handle save button
  const handleSave = async () => {
    // First match room IDs
    await matchRoomIds();
    
    // Prepare the complete import data
    const importData: TermImportData = {
      term: term as CourtTerm,
      personnel,
      assignments
    };
    
    onSave(importData);
  };
  
  // Apply sample data from Term IV document
  const applyTermIVSample = () => {
    setTerm({
      term_number: 'IV',
      term_name: 'Term IV',
      description: 'SUPREME COURT - CRIMINAL TERM',
      start_date: '2025-03-31',
      end_date: '2025-04-25',
      location: '100 CENTRE STREET & 111 CENTRE STREET'
    });
    
    setPersonnel([
      { role: 'administrative_judge' as any, name: 'ELLEN BIBEN', phone: '646-386-4303', room: '1060' },
      { role: 'chief_clerk' as any, name: 'CHRISTOPHER DISANTO ESQ', phone: '646-386-3920', room: '1000' },
      { role: 'first_deputy_clerk' as any, name: 'JULIA KUAN', phone: '646-386-3921', room: '1096' }
    ]);
    
    setAssignments([
      {
        part_code: 'TAP A',
        justice_name: 'M. LEWIS',
        room_number: '1180',
        fax: '720-9302',
        phone: '646-386-4107',
        sergeant_name: 'MADIGAN',
        clerk_names: ['A. WRIGHT', 'A. SARMIENTO']
      },
      {
        part_code: 'TAP G',
        justice_name: 'S. LITMAN',
        room_number: '1130',
        fax: '401-9072',
        phone: '646-386-4044',
        sergeant_name: 'SANTORE',
        clerk_names: ['T. GREENDGE', 'C. WELDON']
      },
      {
        part_code: 'AT1 21',
        justice_name: 'E. BIBEN',
        room_number: '1123',
        phone: '646-386-4199',
        sergeant_name: 'DE TOMMASO',
        clerk_names: ['R. STEAKER', 'T. CEDENO-BARRETT']
      }
    ]);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manual Data Entry with Visual Reference</h2>
        <Button variant="outline" onClick={applyTermIVSample}>
          Use Term IV Sample
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Document Preview */}
        <Card className="md:row-span-2">
          <CardHeader>
            <CardTitle>Document Reference</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : imageUrl ? (
              <div className="overflow-auto max-h-[600px] border rounded">
                {isPdf ? (
                  <div className="pdf-container">
                    <Document
                      file={imageUrl}
                      onLoadSuccess={onDocumentLoadSuccess}
                      loading={<Loader2 className="h-8 w-8 animate-spin" />}
                    >
                      <Page 
                        pageNumber={currentPage} 
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                        width={550}
                      />
                    </Document>
                    
                    {numPages && numPages > 1 && (
                      <div className="flex justify-between items-center p-2 border-t mt-2">
                        <Button 
                          onClick={previousPage} 
                          disabled={currentPage <= 1}
                          variant="outline"
                          size="sm"
                        >
                          Previous
                        </Button>
                        
                        <p className="text-sm">
                          Page {currentPage} of {numPages}
                        </p>
                        
                        <Button 
                          onClick={nextPage} 
                          disabled={currentPage >= (numPages || 1)}
                          variant="outline"
                          size="sm"
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <img 
                    src={imageUrl} 
                    alt="Term Document" 
                    className="max-w-full h-auto"
                  />
                )}
              </div>
            ) : (
              <div className="flex justify-center items-center h-[400px] text-muted-foreground">
                No document preview available
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Data Entry Form */}
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Term Details</TabsTrigger>
              <TabsTrigger value="personnel">Personnel</TabsTrigger>
              <TabsTrigger value="assignments">Assignments</TabsTrigger>
            </TabsList>
            
            {/* Basic Term Info */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="term-number">Term Number</Label>
                  <Input 
                    id="term-number" 
                    value={term.term_number || ''} 
                    onChange={e => setTerm({...term, term_number: e.target.value})}
                    placeholder="e.g. IV or 4"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="term-name">Term Name</Label>
                  <Input 
                    id="term-name" 
                    value={term.term_name || ''} 
                    onChange={e => setTerm({...term, term_name: e.target.value})}
                    placeholder="e.g. Term IV"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input 
                    id="start-date" 
                    type="date" 
                    value={term.start_date || ''} 
                    onChange={e => setTerm({...term, start_date: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input 
                    id="end-date" 
                    type="date" 
                    value={term.end_date || ''} 
                    onChange={e => setTerm({...term, end_date: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Input 
                    id="description" 
                    value={term.description || ''} 
                    onChange={e => setTerm({...term, description: e.target.value})}
                    placeholder="e.g. SUPREME COURT - CRIMINAL TERM"
                  />
                </div>
                
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="location">Location</Label>
                  <Input 
                    id="location" 
                    value={term.location || ''} 
                    onChange={e => setTerm({...term, location: e.target.value})}
                    placeholder="e.g. 100 CENTRE STREET"
                  />
                </div>
              </div>
            </TabsContent>
            
            {/* Personnel Tab */}
            <TabsContent value="personnel" className="space-y-4">
              <div className="space-y-4">
                {personnel.map((person, index) => (
                  <div key={index} className="border p-4 rounded-md relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2"
                      onClick={() => removePersonnel(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`person-role-${index}`}>Role</Label>
                        <select
                          id={`person-role-${index}`}
                          className="w-full border rounded-md p-2"
                          value={person.role || ''}
                          onChange={e => updatePersonnel(index, 'role', e.target.value)}
                        >
                          <option value="">Select Role</option>
                          <option value="administrative_judge">Administrative Judge</option>
                          <option value="chief_clerk">Chief Clerk</option>
                          <option value="first_deputy_clerk">First Deputy Clerk</option>
                          <option value="deputy_clerk">Deputy Clerk</option>
                          <option value="court_clerk_specialist">Court Clerk Specialist</option>
                          <option value="senior_court_interpreter">Senior Court Interpreter</option>
                          <option value="senior_law_librarian">Senior Law Librarian</option>
                          <option value="major">Major</option>
                          <option value="captain">Captain</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`person-name-${index}`}>Name</Label>
                        <Input 
                          id={`person-name-${index}`} 
                          value={person.name || ''} 
                          onChange={e => updatePersonnel(index, 'name', e.target.value)}
                          placeholder="e.g. ELLEN BIBEN"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`person-phone-${index}`}>Phone</Label>
                        <Input 
                          id={`person-phone-${index}`} 
                          value={person.phone || ''} 
                          onChange={e => updatePersonnel(index, 'phone', e.target.value)}
                          placeholder="e.g. 646-386-4303"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`person-room-${index}`}>Room</Label>
                        <Input 
                          id={`person-room-${index}`} 
                          value={person.room || ''} 
                          onChange={e => updatePersonnel(index, 'room', e.target.value)}
                          placeholder="e.g. 1060"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  onClick={addPersonnel}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Personnel
                </Button>
              </div>
            </TabsContent>
            
            {/* Assignments Tab */}
            <TabsContent value="assignments" className="space-y-4">
              <div className="space-y-4">
                {assignments.map((assignment, index) => (
                  <div key={index} className="border p-4 rounded-md relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2"
                      onClick={() => removeAssignment(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`part-code-${index}`}>Part Code</Label>
                        <Input 
                          id={`part-code-${index}`} 
                          value={assignment.part_code || ''} 
                          onChange={e => updateAssignment(index, 'part_code', e.target.value)}
                          placeholder="e.g. TAP A"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`justice-name-${index}`}>Justice Name</Label>
                        <Input 
                          id={`justice-name-${index}`} 
                          value={assignment.justice_name || ''} 
                          onChange={e => updateAssignment(index, 'justice_name', e.target.value)}
                          placeholder="e.g. M. LEWIS"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`room-number-${index}`}>Room Number</Label>
                        <Input 
                          id={`room-number-${index}`} 
                          value={assignment.room_number || ''} 
                          onChange={e => updateAssignment(index, 'room_number', e.target.value)}
                          placeholder="e.g. 1180"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`fax-${index}`}>Fax</Label>
                        <Input 
                          id={`fax-${index}`} 
                          value={assignment.fax || ''} 
                          onChange={e => updateAssignment(index, 'fax', e.target.value)}
                          placeholder="e.g. 720-9302"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`phone-${index}`}>Phone</Label>
                        <Input 
                          id={`phone-${index}`} 
                          value={assignment.phone || ''} 
                          onChange={e => updateAssignment(index, 'phone', e.target.value)}
                          placeholder="e.g. 646-386-4107"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`sergeant-${index}`}>Sergeant</Label>
                        <Input 
                          id={`sergeant-${index}`} 
                          value={assignment.sergeant_name || ''} 
                          onChange={e => updateAssignment(index, 'sergeant_name', e.target.value)}
                          placeholder="e.g. MADIGAN"
                        />
                      </div>
                      
                      <div className="space-y-2 col-span-2">
                        <Label>Clerks</Label>
                        {(assignment.clerk_names || ['']).map((clerk, clerkIndex) => (
                          <div key={`clerk-${index}-${clerkIndex}`} className="flex gap-2 mt-2">
                            <Input
                              value={clerk}
                              onChange={e => updateClerkName(index, clerkIndex, e.target.value)}
                              placeholder={`Clerk ${clerkIndex + 1}`}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeClerk(index, clerkIndex)}
                              disabled={(assignment.clerk_names || []).length <= 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addClerk(index)}
                          className="mt-2"
                        >
                          <Plus className="mr-2 h-3 w-3" />
                          Add Clerk
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  onClick={addAssignment}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Assignment
                </Button>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Save and Import
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
