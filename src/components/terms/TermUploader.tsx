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
import { FileUp, AlertCircle, CalendarRange, Clock, MapPin, Loader2, CheckCircle, XCircle, Info, BrainCircuit } from "lucide-react";
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
  extractTermMetadata,
  type TermAssignment,
  type ExtractedTermMetadata
} from "@/utils/pdfProcessing";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  const [pdfText, setPdfText] = useState<string | null>(null);
  const [termMetadata, setTermMetadata] = useState<ExtractedTermMetadata | null>(null);
  const [extractingMetadata, setExtractingMetadata] = useState(false);
  const [autoExtracted, setAutoExtracted] = useState<{
    termName: boolean;
    termNumber: boolean;
    location: boolean;
    dates: boolean;
  }>({
    termName: false,
    termNumber: false,
    location: false,
    dates: false
  });
  
  const navigate = useNavigate();
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      
      // Immediately begin extracting metadata
      setExtractingMetadata(true);
      try {
        const extractedText = await extractTextFromPDF(await file.arrayBuffer());
        setPdfText(extractedText);
        
        const metadata = extractTermMetadata(extractedText);
        setTermMetadata(metadata);
        
        // Auto-fill form with extracted metadata
        let fieldsExtracted = {
          termName: false,
          termNumber: false,
          location: false,
          dates: false
        };
        
        if (metadata.termName) {
          setTermName(metadata.termName);
          fieldsExtracted.termName = true;
        }
        
        if (metadata.termNumber) {
          setTermNumber(metadata.termNumber);
          fieldsExtracted.termNumber = true;
        }
        
        if (metadata.location) {
          setLocation(metadata.location);
          fieldsExtracted.location = true;
        }
        
        if (metadata.startDate && metadata.endDate) {
          setStartDate(metadata.startDate);
          setEndDate(metadata.endDate);
          fieldsExtracted.dates = true;
        } else if (metadata.startDate) {
          setStartDate(metadata.startDate);
          // Estimate end date (3 months after start)
          const estimatedEnd = new Date(metadata.startDate);
          estimatedEnd.setMonth(estimatedEnd.getMonth() + 3);
          setEndDate(estimatedEnd);
          fieldsExtracted.dates = true;
        }
        
        setAutoExtracted(fieldsExtracted);
        
        let extractedCount = 0;
        Object.values(fieldsExtracted).forEach(value => {
          if (value) extractedCount++;
        });
        
        // Display extraction results with confidence details if available
        if (extractedCount > 0) {
          if (metadata.confidence?.overall && metadata.confidence.overall > 0) {
            // Format the confidence as a percentage
            const confidencePercent = Math.round(metadata.confidence.overall * 100);
            toast.success(`Metadata extracted with ${confidencePercent}% confidence (${extractedCount} fields)`);
          } else {
            toast.success(`Metadata extracted from PDF (${extractedCount} fields)`);
          }
        }
        
        // If we found sufficient metadata, automatically trigger assignment analysis
        if (fieldsExtracted.termName && fieldsExtracted.dates) {
          handleAnalyzeClick();
        }
      } catch (error) {
        console.error("Error extracting metadata:", error);
        toast.error("Could not extract metadata from PDF");
      } finally {
        setExtractingMetadata(false);
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
    if (!pdfFile) return { assignments: [], method: "None" };
    
    try {
      setProcessing(true);
      setProcessingProgress(10);
      console.info("Processing term data...");
      
      // If we've already extracted the text, use it
      let extractedText = pdfText;
      
      if (!extractedText) {
        // Use FileReader to get the PDF as an ArrayBuffer
        const pdfArrayBuffer = await pdfFile.arrayBuffer();
        setProcessingProgress(30);
        extractedText = await extractTextFromPDF(pdfArrayBuffer);
        setPdfText(extractedText);
      } else {
        setProcessingProgress(30);
      }
      
      console.info(`Using extracted text length: ${extractedText.length} characters`);
      setProcessingProgress(60);
      
      // Parse assignments from the extracted text
      const result = parseAssignmentsFromText(extractedText);
      console.info(`Successfully extracted ${result.assignments.length} assignments using ${result.method}`);
      setProcessingProgress(90);
      
      return result;
    } catch (error) {
      console.error("Error in extractDataFromPDF:", error);
      return { assignments: [], method: "Error" };
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
      const result = await extractDataFromPDF();
      
      if (!result.assignments || result.assignments.length === 0) {
        toast.error("No assignments could be extracted from the PDF");
        setError("No assignments could be extracted from the PDF. Please check the file and try again.");
        setCurrentStep("upload");
      } else {
        setPreviewAssignments(result.assignments);
        setCurrentStep("review");
        setExtractionMethod(result.method);
        toast.success(`Found ${result.assignments.length} assignments in the PDF using ${result.method}`);
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
          term_number: termNumber || null, // Allow null for term number
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
      setPdfText(null);
      setTermMetadata(null);
      setAutoExtracted({
        termName: false,
        termNumber: false,
        location: false,
        dates: false
      });
      
      // Navigate to term list
      navigate("/terms");
      
    } catch (error: any) {
      console.error("Error uploading term:", error);
      setError(`Error uploading: ${error.message}`);
      toast.error("Failed to upload term");
    } finally {
      setUploading(false);
    }
  };

  const getMetadataStatusIcon = (extracted: boolean, confidence?: number) => {
    if (extracted) {
      // High confidence is green, medium confidence is amber
      const highConfidence = confidence && confidence > 0.75;
      const mediumConfidence = confidence && confidence > 0.4;
      
      if (highConfidence) {
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      } else if (mediumConfidence) {
        return <CheckCircle className="h-3 w-3 text-amber-500" />;
      } else {
        return <CheckCircle className="h-3 w-3 text-blue-500" />;
      }
    } else {
      return <Info className="h-3 w-3 text-amber-500" />;
    }
  };
  
  const getConfidenceLabel = (confidence?: number) => {
    if (!confidence) return '';
    
    if (confidence > 0.85) return 'High confidence';
    if (confidence > 0.6) return 'Medium confidence';
    return 'Possible match';
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
                Review Data ({previewAssignments.length})
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
                          disabled={processing || uploading || extractingMetadata}
                        />
                        {pdfFile && (
                          <Button 
                            type="submit"
                            disabled={processing || uploading || extractingMetadata}
                          >
                            {processing ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Analyzing...
                              </>
                            ) : extractingMetadata ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Extracting...
                              </>
                            ) : "Analyze PDF"}
                          </Button>
                        )}
                      </div>
                      {fileSize && (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground">
                              File size: {fileSize}
                            </p>
                            {pdfFile && (termMetadata || extractingMetadata) && (
                              <span className="text-sm text-muted-foreground">
                                {extractingMetadata ? (
                                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Extracting metadata
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    <CheckCircle className="h-3 w-3 mr-1" /> Metadata extracted
                                    {termMetadata?.confidence?.overall ? 
                                      ` (${Math.round(termMetadata.confidence.overall * 100)}%)` : 
                                      ''}
                                  </Badge>
                                )}
                              </span>
                            )}
                          </div>
                          {(processing || extractingMetadata) && (
                            <div className="w-full">
                              <Progress value={processing ? processingProgress : 50} className="h-1" />
                              <p className="text-xs text-muted-foreground mt-1">
                                {processing ? 
                                  (processingProgress < 100 ? "Analyzing PDF..." : "Analysis complete") : 
                                  "Extracting metadata..."}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Automated Extraction Banner */}
                    {pdfFile && (Object.values(autoExtracted).some(Boolean) || extractingMetadata) && (
                      <Alert className="bg-blue-50 border-blue-200">
                        <BrainCircuit className="h-4 w-4 text-blue-600" />
                        <AlertTitle className="text-blue-800">Automated Extraction</AlertTitle>
                        <AlertDescription className="text-blue-700">
                          <p className="mb-1">
                            PDF information has been automatically extracted and pre-filled below.
                            {termMetadata?.confidence?.overall ? 
                              ` Overall confidence: ${Math.round(termMetadata.confidence.overall * 100)}%` : 
                              ''}
                          </p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-xs text-blue-700">
                            <div className="flex items-center">
                              <span className={`mr-1 ${autoExtracted.termName ? 'text-green-600' : 'text-amber-600'}`}>
                                {autoExtracted.termName ? 
                                  <CheckCircle className="h-3 w-3" /> : 
                                  <XCircle className="h-3 w-3" />}
                              </span>
                              Term Name
                              {autoExtracted.termName && termMetadata?.confidence?.termName && (
                                <span className="ml-1 text-blue-600">
                                  ({getConfidenceLabel(termMetadata.confidence.termName)})
                                </span>
                              )}
                            </div>
                            <div className="flex items-center">
                              <span className={`mr-1 ${autoExtracted.termNumber ? 'text-green-600' : 'text-amber-600'}`}>
                                {autoExtracted.termNumber ? 
                                  <CheckCircle className="h-3 w-3" /> : 
                                  <XCircle className="h-3 w-3" />}
                              </span>
                              Term Number
                              {autoExtracted.termNumber && termMetadata?.confidence?.termNumber && (
                                <span className="ml-1 text-blue-600">
                                  ({getConfidenceLabel(termMetadata.confidence.termNumber)})
                                </span>
                              )}
                            </div>
                            <div className="flex items-center">
                              <span className={`mr-1 ${autoExtracted.location ? 'text-green-600' : 'text-amber-600'}`}>
                                {autoExtracted.location ? 
                                  <CheckCircle className="h-3 w-3" /> : 
                                  <XCircle className="h-3 w-3" />}
                              </span>
                              Location
                              {autoExtracted.location && termMetadata?.confidence?.location && (
                                <span className="ml-1 text-blue-600">
                                  ({getConfidenceLabel(termMetadata.confidence.location)})
                                </span>
                              )}
                            </div>
                            <div className="flex items-center">
                              <span className={`mr-1 ${autoExtracted.dates ? 'text-green-600' : 'text-amber-600'}`}>
                                {autoExtracted.dates ? 
                                  <CheckCircle className="h-3 w-3" /> : 
                                  <XCircle className="h-3 w-3" />}
                              </span>
                              Term Dates
                              {autoExtracted.dates && termMetadata?.confidence?.dates && (
                                <span className="ml-1 text-blue-600">
                                  ({getConfidenceLabel(termMetadata.confidence.dates)})
                                </span>
                              )}
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TooltipProvider>
                          <div className="space-y-2">
                            <Label htmlFor="term-name" className="flex items-center gap-1">
                              Term Name
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-help">
                                    {getMetadataStatusIcon(
                                      autoExtracted.termName, 
                                      termMetadata?.confidence?.termName
                                    )}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {autoExtracted.termName ? 
                                    `Automatically extracted from PDF${termMetadata?.confidence?.termName ? 
                                      ` (${Math.round(termMetadata.confidence.termName * 100)}% confidence)` : 
                                      ''}` : 
                                    "Enter or verify the term name"}
                                </TooltipContent>
                              </Tooltip>
                            </Label>
                            <Input
                              id="term-name"
                              value={termName}
                              onChange={(e) => setTermName(e.target.value)}
                              placeholder="e.g., Fall 2025"
                              disabled={processing || uploading || extractingMetadata}
                              className={autoExtracted.termName ? "border-green-500" : ""}
                            />
                          </div>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <div className="space-y-2">
                            <Label htmlFor="term-number" className="flex items-center gap-1">
                              Term Number
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-help">
                                    {getMetadataStatusIcon(
                                      autoExtracted.termNumber,
                                      termMetadata?.confidence?.termNumber
                                    )}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {autoExtracted.termNumber ? 
                                    `Automatically extracted from PDF${termMetadata?.confidence?.termNumber ? 
                                      ` (${Math.round(termMetadata.confidence.termNumber * 100)}% confidence)` : 
                                      ''}` : 
                                    "Enter the term number if available"}
                                </TooltipContent>
                              </Tooltip>
                            </Label>
                            <Input
                              id="term-number"
                              value={termNumber}
                              onChange={(e) => setTermNumber(e.target.value)}
                              placeholder="e.g., Term IV"
                              disabled={processing || uploading || extractingMetadata}
                              className={autoExtracted.termNumber ? "border-green-500" : ""}
                            />
                          </div>
                        </TooltipProvider>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TooltipProvider>
                          <div className="space-y-2">
                            <Label className="flex items-center gap-1">
                              Start Date
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-help">
                                    {getMetadataStatusIcon(
                                      autoExtracted.dates,
                                      termMetadata?.confidence?.dates
                                    )}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {autoExtracted.dates ? 
                                    `Date range extracted from PDF${termMetadata?.confidence?.dates ? 
                                      ` (${Math.round(termMetadata.confidence.dates * 100)}% confidence)` : 
                                      ''}` : 
                                    "Select the term start date"}
                                </TooltipContent>
                              </Tooltip>
                            </Label>
                            <DatePicker
                              value={startDate}
                              onChange={setStartDate}
                              disabled={processing || uploading || extractingMetadata}
                              className={autoExtracted.dates ? "border-green-500" : ""}
                            />
                          </div>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <div className="space-y-2">
                            <Label className="flex items-center gap-1">
                              End Date
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-help">
                                    {getMetadataStatusIcon(
                                      autoExtracted.dates,
                                      termMetadata?.confidence?.dates
                                    )}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {autoExtracted.dates ? 
                                    `Date range extracted from PDF${termMetadata?.confidence?.dates ? 
                                      ` (${Math.round(termMetadata.confidence.dates * 100)}% confidence)` : 
                                      ''}` : 
                                    "Select the term end date"}
                                </TooltipContent>
                              </Tooltip>
                            </Label>
                            <DatePicker
                              value={endDate}
                              onChange={setEndDate}
                              disabled={processing || uploading || extractingMetadata}
                              className={autoExtracted.dates ? "border-green-500" : ""}
                            />
                          </div>
                        </TooltipProvider>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TooltipProvider>
                          <div className="space-y-2">
                            <Label htmlFor="location" className="flex items-center gap-1">
                              Location
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-help">
                                    {getMetadataStatusIcon(
                                      autoExtracted.location,
                                      termMetadata?.confidence?.location
                                    )}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {autoExtracted.location ? 
                                    `Location extracted from PDF${termMetadata?.confidence?.location ? 
                                      ` (${Math.round(termMetadata.confidence.location * 100)}% confidence)` : 
                                      ''}` : 
                                    "Select the court location"}
                                </TooltipContent>
                              </Tooltip>
                            </Label>
                            <Select
                              value={location}
                              onValueChange={setLocation}
                              disabled={processing || uploading || extractingMetadata}
                            >
                              <SelectTrigger id="location" className={autoExtracted.location ? "border-green-500" : ""}>
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
                        </TooltipProvider>
                        
                        <div className="space-y-2">
                          <Label htmlFor="status">Status</Label>
                          <Select
                            value={status}
                            onValueChange={setStatus}
                            disabled={processing || uploading || extractingMetadata}
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
                              <TableCell className="font-medium">{formatPart(assignment.part, undefined)}</TableCell>
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
            {location && (
              <>
                <MapPin className="h-4 w-4 ml-2" />
                <span>{location}</span>
              </>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
