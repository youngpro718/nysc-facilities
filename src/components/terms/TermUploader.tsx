
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
import { FileUp, AlertCircle, CalendarRange, Clock, MapPin, Loader2, CheckCircle, XCircle } from "lucide-react";
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
import { 
  validatePDFFile, 
  extractTextFromPDF, 
  parseAssignmentsFromText,
  formatPart, 
  formatPhone, 
  formatSergeant, 
  formatClerks,
  getReadableFileSize,
  type TermAssignment
} from "@/utils/pdfProcessing";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function TermUploader({ onUploadSuccess }: { onUploadSuccess?: () => void }) {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [termName, setTermName] = useState("");
  const [termNumber, setTermNumber] = useState("");
  const [location, setLocation] = useState("Manhattan");
  const [status, setStatus] = useState("upcoming");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [previewAssignments, setPreviewAssignments] = useState<TermAssignment[]>([]);
  const [currentStep, setCurrentStep] = useState("upload");
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [extractionMethod, setExtractionMethod] = useState<string | null>(null);
  
  const navigate = useNavigate();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validation = validatePDFFile(file);
      
      if (!validation.valid) {
        setError(validation.error);
        return;
      }
      
      setPdfFile(file);
      setFileSize(getReadableFileSize(file.size));
      setError(null);
      setPreviewAssignments([]);
      
      // Try to extract term info from filename
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
    
    if (startDate && endDate && startDate > endDate) {
      setError("Start date cannot be after end date.");
      return false;
    }
    
    return true;
  };
  
  const extractDataFromPDF = async () => {
    if (!pdfFile) return null;
    
    try {
      setProcessing(true);
      setProcessingProgress(10);
      console.info("Processing term data...");
      
      // Use FileReader to get the PDF as an ArrayBuffer
      return new Promise<TermAssignment[]>((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
          try {
            const pdfArrayBuffer = e.target?.result as ArrayBuffer;
            setProcessingProgress(30);
            
            // Extract text from the PDF
            const extractedText = await extractTextFromPDF(pdfArrayBuffer);
            console.info(`Extracted text length: ${extractedText.length} characters`);
            setProcessingProgress(60);
            
            // Parse assignments from the extracted text
            const assignments = parseAssignmentsFromText(extractedText);
            console.info(`Successfully extracted ${assignments.length} assignments`);
            setProcessingProgress(90);
            
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
    } finally {
      setProcessingProgress(100);
      setTimeout(() => setProcessing(false), 500); // Small delay to show completed progress
    }
  };
  
  const handleAnalyzeClick = async () => {
    try {
      if (!validateForm()) {
        return;
      }
      
      setProcessing(true);
      setExtractionMethod(null);
      const assignments = await extractDataFromPDF();
      
      if (!assignments || assignments.length === 0) {
        toast.error("No assignments could be extracted from the PDF");
        setError("No assignments could be extracted from the PDF. Please check the file and try again.");
        setCurrentStep("upload");
      } else {
        setPreviewAssignments(assignments);
        setCurrentStep("review");
        setExtractionMethod("Improved pattern matching");
        toast.success(`Found ${assignments.length} assignments in the PDF`);
      }
    } catch (error: any) {
      console.error("Error analyzing PDF:", error);
      setError(`Error analyzing PDF: ${error.message}`);
      toast.error("Error analyzing PDF");
    } finally {
      setProcessing(false);
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
      
      // Create a unique term ID
      const termId = crypto.randomUUID();
      
      // Upload PDF to storage
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
      
      // Create term record
      const { error: termError } = await supabase
        .from('court_terms')
        .insert({
          id: termId,
          term_name: termName,
          term_number: termNumber,
          location: location,
          status: status,
          start_date: startDate ? startDate.toISOString().split('T')[0] : null,
          end_date: endDate ? endDate.toISOString().split('T')[0] : null,
          pdf_url: publicUrlData.publicUrl
        });
      
      if (termError) {
        throw termError;
      }
      
      // Prepare assignments data for processing
      const assignments = previewAssignments.map(assignment => ({
        partCode: assignment.part,
        justiceName: assignment.justice,
        roomNumber: assignment.room,
        phone: assignment.tel,
        sergeantName: assignment.sgt,
        clerkNames: assignment.clerks,
        extension: assignment.extension || null,
        fax: assignment.fax || null
      }));
      
      console.info(`Submitting assignments to edge function: ${assignments.length} items`);
      
      // Process assignments using edge function
      const { data: processingResult, error: processingError } = await supabase.functions
        .invoke('parse-term-sheet', {
          body: {
            term_id: termId,
            pdf_url: publicUrlData.publicUrl,
            client_extracted: {
              assignments: assignments
            }
          }
        });
      
      if (processingError) {
        throw processingError;
      }
      
      console.info(`PDF processing result: ${JSON.stringify(processingResult, null, 2)}`);
      
      // Success handling
      toast.success(`Term uploaded successfully! Created ${processingResult?.results?.success || 0} assignments.`);
      onUploadSuccess?.();
      
      // Reset form
      setPdfFile(null);
      setTermName("");
      setTermNumber("");
      setStartDate(undefined);
      setEndDate(undefined);
      setPreviewAssignments([]);
      setCurrentStep("upload");
      setFileSize(null);
      
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
                          disabled={processing || uploading}
                        />
                        {pdfFile && (
                          <Button 
                            type="submit"
                            disabled={processing || uploading}
                          >
                            {processing ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Analyzing...
                              </>
                            ) : "Analyze PDF"}
                          </Button>
                        )}
                      </div>
                      {fileSize && (
                        <div className="flex flex-col gap-1">
                          <p className="text-sm text-muted-foreground">
                            File size: {fileSize}
                          </p>
                          {processing && (
                            <div className="w-full">
                              <Progress value={processingProgress} className="h-1" />
                              <p className="text-xs text-muted-foreground mt-1">
                                {processingProgress < 100 ? "Analyzing PDF..." : "Analysis complete"}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
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
                            disabled={processing || uploading}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="term-number">Term Number</Label>
                          <Input
                            id="term-number"
                            value={termNumber}
                            onChange={(e) => setTermNumber(e.target.value)}
                            placeholder="e.g., Term IV"
                            disabled={processing || uploading}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Start Date</Label>
                          <DatePicker
                            value={startDate}
                            onChange={setStartDate}
                            disabled={processing || uploading}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>End Date</Label>
                          <DatePicker
                            value={endDate}
                            onChange={setEndDate}
                            disabled={processing || uploading}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="location">Location</Label>
                          <Select
                            value={location}
                            onValueChange={setLocation}
                            disabled={processing || uploading}
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
                            disabled={processing || uploading}
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
                  <div className="space-y-1">
                    <h3 className="text-lg font-medium">Extracted Assignments</h3>
                    {extractionMethod && (
                      <p className="text-sm text-muted-foreground">
                        Method: {extractionMethod} • {previewAssignments.length} assignments found
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setCurrentStep("upload")} disabled={uploading}>
                      Back
                    </Button>
                    <Button onClick={handleSubmit} disabled={uploading}>
                      {uploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : "Submit"}
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
                            <TableHead className="w-[100px]">Status</TableHead>
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
                              <TableCell>
                                {assignment.part && assignment.justice ? (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    <CheckCircle className="h-3 w-3 mr-1" /> Valid
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                    <AlertCircle className="h-3 w-3 mr-1" /> Incomplete
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end mt-4">
                  <Button onClick={handleSubmit} disabled={uploading}>
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : "Submit"}
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

export function TermList() {
  return <div>Term List Coming Soon</div>;
}
