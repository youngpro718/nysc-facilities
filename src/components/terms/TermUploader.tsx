import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUp, AlertCircle, CalendarRange, Clock, MapPin } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

// --- Formatting Helpers ---
function formatPart(part: string | undefined, fallback: string | undefined) {
  if (typeof part === 'string' && part.trim()) return part;
  if (typeof fallback === 'string' && fallback.trim()) return fallback;
  return '—';
}

function formatPhone(phone: string | undefined) {
  if (!phone) return '—';
  if (/^\(\d\)\d{4}$/.test(phone)) return phone;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 5 && digits[0] === '6') {
    return `(6)${digits.slice(1)}`;
  }
  if (digits.length === 4) {
    return `(6)${digits}`;
  }
  return phone;
}

function formatSergeant(sgt: string | undefined) {
  if (!sgt || typeof sgt !== 'string') return '—';
  const parts = sgt.trim().split(/\s+/);
  return parts.length > 0 ? parts[parts.length - 1].replace(/[^A-Z\-]/gi, '') : sgt;
}

function formatClerks(clerks: string[] | string | undefined) {
  if (!clerks) return '—';
  if (typeof clerks === 'string') clerks = clerks.split(',').map(c => c.trim()).filter(Boolean);
  if (!Array.isArray(clerks) || clerks.length === 0) return '—';
  return clerks.map(name => {
    if (/^[A-Z]\.\s+[A-Za-z\-']+$/.test(name)) return name;
    const parts = name.split(/\s+/);
    if (parts.length >= 2) {
      let initial = parts[0].replace(/[^A-Z.]/gi, '');
      let last = parts.slice(1).join(' ').replace(/[^A-Za-z\-']/gi, '');
      return `${initial} ${last}`;
    }
    return name;
  }).join(', ');
}

export function TermUploader({ onUploadSuccess }: { onUploadSuccess?: () => void }) {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [termName, setTermName] = useState("");
  const [termNumber, setTermNumber] = useState("");
  const [location, setLocation] = useState("Manhattan");
  const [status, setStatus] = useState("upcoming");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [previewAssignments, setPreviewAssignments] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState("upload");
  
  const navigate = useNavigate();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf") {
        setError("Please upload a PDF file.");
        return;
      }
      
      setPdfFile(file);
      setError(null);
      
      if (!termName || !termNumber) {
        const fileName = file.name.replace(".pdf", "");
        const match = fileName.match(/(.+?)(?:\s*[-–]\s*(.+))?$/);
        
        if (match) {
          if (!termName && match[1]) setTermName(match[1].trim());
          if (!termNumber && match[2]) setTermNumber(match[2].trim());
        }
      }
    }
  };
  
  const validateForm = () => {
    if (!pdfFile) {
      setError("Please select a PDF file to upload.");
      return false;
    }
    
    if (!termName) {
      setError("Please enter a term name.");
      return false;
    }
    
    if (!termNumber) {
      setError("Please enter a term number.");
      return false;
    }
    
    if (!startDate || !endDate) {
      setError("Please select both start and end dates.");
      return false;
    }
    
    return true;
  };
  
  const extractDataFromPDF = async () => {
    if (!pdfFile) return null;
    
    try {
      setUploading(true);
      console.info("Processing term data...");
      
      const pdfData = new FormData();
      pdfData.append("file", pdfFile);
      
      const reader = new FileReader();
      
      return new Promise<any>((resolve, reject) => {
        reader.onload = async (e) => {
          try {
            const pdfArrayBuffer = e.target?.result as ArrayBuffer;
            
            const pdfjsLib = await import('pdfjs-dist');
            pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
            
            const pdf = await pdfjsLib.getDocument({ data: pdfArrayBuffer }).promise;
            console.info(`PDF loaded with ${pdf.numPages} pages`);
            
            let extractedText = '';
            
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items.map((item: any) => item.str).join(' ');
              extractedText += pageText + '\n';
            }
            
            console.info(`Extracted text length: ${extractedText.length} characters`);
            console.info(`PDF text sample: ${extractedText.substring(0, 1000)}`);
            
            const assignments = parseAssignmentsFromText(extractedText);
            
            resolve(assignments);
          } catch (error) {
            console.error("Error processing PDF:", error);
            reject(error);
          }
        };
        
        reader.onerror = (error) => {
          reject(error);
        };
        
        reader.readAsArrayBuffer(pdfFile);
      });
    } catch (error) {
      console.error("Error in extractDataFromPDF:", error);
      return null;
    }
  };
  
  const parseAssignmentsFromText = (text: string) => {
    try {
      const lines = text.split(/\n/).map(line => line.trim()).filter(Boolean);
      console.info(`Total lines: ${lines.length}`);
      
      const assignmentPattern = /\b([A-Z0-9-]+)\s+([A-Za-z\s\.-]+)(?:\s+([Rr]oom\s+)?(\d+[A-Z]?))?(?:\s+\(?(\d[-\d]+)\)?)?/i;
      
      const assignments: any[] = [];
      
      console.info(`Starting to process assignments from line 0`);
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(assignmentPattern);
        
        if (match) {
          const [_, part, justice, roomPrefix, room, phone] = match;
          
          let sgt = '';
          let clerks: string[] = [];
          
          if (i + 1 < lines.length && lines[i + 1].includes('SGT')) {
            sgt = lines[i + 1].replace('SGT', '').trim();
            i++;
          }
          
          let clerkLine = '';
          while (i + 1 < lines.length && !lines[i + 1].match(assignmentPattern)) {
            clerkLine += ' ' + lines[i + 1];
            i++;
            
            if (lines[i].includes('PART') || lines[i].includes('JUDGE')) break;
          }
          
          if (clerkLine) {
            clerks = clerkLine.split(',').map(c => c.trim()).filter(Boolean);
            if (clerks.length === 0 && clerkLine.trim()) {
              clerks = [clerkLine.trim()];
            }
          }
          
          assignments.push({
            part,
            justice: justice.trim(),
            room,
            tel: phone,
            fax: null,
            sgt,
            clerks
          });
        }
      }
      
      if (assignments.length < 3) {
        console.info("Few assignments found, trying secondary parsing approach");
        
        const tablePattern = /([A-Z0-9-]+)\s+([A-Za-z\s\.-]+)/g;
        let match;
        let tableAssignments = [];
        
        while ((match = tablePattern.exec(text)) !== null) {
          const [_, part, justice] = match;
          if (part && justice && part.length < 10) {
            tableAssignments.push({
              part,
              justice: justice.trim(),
              room: null,
              tel: null,
              fax: null,
              sgt: "",
              clerks: []
            });
          }
        }
        
        if (tableAssignments.length > assignments.length && tableAssignments.length < 50) {
          assignments.push(...tableAssignments);
        }
      }
      
      console.info(`Successfully extracted ${assignments.length} assignments`);
      console.info(`Parsed assignments: ${JSON.stringify(assignments, null, 2)}`);
      
      return assignments;
    } catch (error) {
      console.error("Error parsing assignments:", error);
      return [];
    }
  };
  
  const handleAnalyzeClick = async () => {
    try {
      const assignments = await extractDataFromPDF();
      setPreviewAssignments(assignments || []);
      setCurrentStep("review");
    } catch (error: any) {
      console.error("Error analyzing PDF:", error);
      setError(`Error analyzing PDF: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setUploading(true);
      setError(null);
      
      const timestamp = Date.now();
      const fileExt = pdfFile!.name.split('.').pop();
      const filePath = `term_pdfs/${timestamp}-${pdfFile!.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, pdfFile!);
      
      if (uploadError) {
        throw uploadError;
      }
      
      const { data: publicUrlData } = await supabase.storage
        .from('documents')
        .getPublicUrl(filePath);
      
      const termId = crypto.randomUUID();
      const { error: termError } = await supabase
        .from('court_terms')
        .insert({
          term_name: termName,
          term_number: termNumber,
          location: location,
          status: status,
          start_date: startDate,
          end_date: endDate,
          pdf_url: publicUrlData.publicUrl
        });
      
      if (termError) {
        throw termError;
      }
      
      const assignments = previewAssignments.map(assignment => ({
        term_id: termId,
        partCode: assignment.part,
        justiceName: assignment.justice,
        roomNumber: assignment.room,
        phone: assignment.tel,
        sergeantName: assignment.sgt,
        clerkNames: assignment.clerks,
        extension: assignment.extension || null,
        fax: assignment.fax || null
      }));
      
      console.info(`Submitting assignments to backend: ${JSON.stringify(assignments, null, 2)}`);
      
      const { data: processingResult, error: processingError } = await supabase.functions
        .invoke('parse-term-sheet', {
          body: {
            term_id: termId,
            assignments: assignments
          }
        });
      
      if (processingError) {
        throw processingError;
      }
      
      console.info(`PDF processing result: ${JSON.stringify(processingResult, null, 2)}`);
      
      toast.success("Term uploaded successfully!");
      onUploadSuccess?.();
      
      setPdfFile(null);
      setTermName("");
      setTermNumber("");
      setStartDate(undefined);
      setEndDate(undefined);
      setPreviewAssignments([]);
      setCurrentStep("upload");
      
    } catch (error: any) {
      console.error("Error uploading term:", error);
      setError(`Error uploading: ${error.message}`);
      toast.error("Failed to upload term");
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="container mx-auto">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Upload Term Schedule</CardTitle>
          <CardDescription>
            Upload a term sheet PDF to create assignments and personnel records.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={currentStep} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="upload" onClick={() => setCurrentStep("upload")}>
                Upload PDF
              </TabsTrigger>
              <TabsTrigger 
                value="review" 
                onClick={() => previewAssignments.length > 0 && setCurrentStep("review")}
                disabled={previewAssignments.length === 0}
              >
                Review Data
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload">
              <form onSubmit={(e) => { e.preventDefault(); handleAnalyzeClick(); }}>
                <div className="space-y-6">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="pdf-upload">Upload Term Sheet PDF</Label>
                      <div className="flex items-center gap-4">
                        <Input
                          id="pdf-upload"
                          type="file"
                          accept=".pdf"
                          onChange={handleFileChange}
                          className="flex-1"
                        />
                        {pdfFile && (
                          <Button 
                            type="submit"
                            disabled={uploading}
                          >
                            {uploading ? "Analyzing..." : "Analyze PDF"}
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Upload a PDF file of the court term schedule.
                      </p>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="term-name">Term Name</Label>
                          <Input
                            id="term-name"
                            value={termName}
                            onChange={(e) => setTermName(e.target.value)}
                            placeholder="e.g., Fall 2025"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="term-number">Term Number</Label>
                          <Input
                            id="term-number"
                            value={termNumber}
                            onChange={(e) => setTermNumber(e.target.value)}
                            placeholder="e.g., Term IV"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Start Date</Label>
                          <DatePicker
                            value={startDate}
                            onChange={setStartDate}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>End Date</Label>
                          <DatePicker
                            value={endDate}
                            onChange={setEndDate}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="location">Location</Label>
                          <Select
                            value={location}
                            onValueChange={setLocation}
                          >
                            <SelectTrigger id="location">
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Manhattan">Manhattan</SelectItem>
                              <SelectItem value="Brooklyn">Brooklyn</SelectItem>
                              <SelectItem value="Queens">Queens</SelectItem>
                              <SelectItem value="Bronx">Bronx</SelectItem>
                              <SelectItem value="Staten Island">Staten Island</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="status">Status</Label>
                          <Select
                            value={status}
                            onValueChange={setStatus}
                          >
                            <SelectTrigger id="status">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="upcoming">Upcoming</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="review">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Extracted Assignments</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setCurrentStep("upload")}>
                      Back
                    </Button>
                    <Button onClick={handleSubmit} disabled={uploading}>
                      {uploading ? "Uploading..." : "Submit"}
                    </Button>
                  </div>
                </div>
                
                {previewAssignments.length === 0 ? (
                  <div className="text-center border rounded-md p-8">
                    <p className="text-muted-foreground">No assignments extracted from the PDF.</p>
                    <Button 
                      className="mt-4" 
                      variant="outline" 
                      onClick={() => setCurrentStep("upload")}
                    >
                      Try Again
                    </Button>
                  </div>
                ) : (
                  <div className="border rounded-md overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Part</TableHead>
                            <TableHead>Justice</TableHead>
                            <TableHead>Room</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>SGT</TableHead>
                            <TableHead>Clerks</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {previewAssignments.map((assignment, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{formatPart(assignment.part, undefined)}</TableCell>
                              <TableCell>{assignment.justice}</TableCell>
                              <TableCell>{assignment.room || '—'}</TableCell>
                              <TableCell>{formatPhone(assignment.tel)}</TableCell>
                              <TableCell>{formatSergeant(assignment.sgt)}</TableCell>
                              <TableCell>{formatClerks(assignment.clerks)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end mt-4">
                  <Button onClick={handleSubmit} disabled={uploading}>
                    {uploading ? "Uploading..." : "Submit"}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            <div className="flex items-center">
              <FileUp className="h-4 w-4 mr-1" />
              {pdfFile ? pdfFile.name : "No file selected"}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {startDate && endDate && (
              <>
                <CalendarRange className="h-4 w-4" />
                <span>
                  {format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")}
                </span>
              </>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
