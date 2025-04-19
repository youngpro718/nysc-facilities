import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Upload, FileText, Check, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import * as pdfjs from 'pdfjs-dist';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const formSchema = z.object({
  pdfFile: z.instanceof(File, { message: "Please upload a PDF file" })
    .refine(file => file.size < 10000000, "File size must be less than 10MB")
    .refine(file => file.type === "application/pdf", "File must be a PDF"),
});

type FormValues = z.infer<typeof formSchema>;

interface TermUploaderProps {
  onUploadSuccess?: () => void;
}

export function TermUploader({ onUploadSuccess }: TermUploaderProps) {
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [extractedInfo, setExtractedInfo] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  const watchPdfFile = form.watch("pdfFile");

  useEffect(() => {
    if (watchPdfFile && watchPdfFile instanceof File) {
      const fileUrl = URL.createObjectURL(watchPdfFile);
      setPdfPreviewUrl(fileUrl);
      
      const filename = watchPdfFile.name;
      const termMatch = filename.match(/(spring|fall|summer|winter|term)\s*(i+v?|v?i+|v|iv|iii|ii|i|\d+)\s*(\d{4})?/i);
      
      if (termMatch) {
        const termSeason = termMatch[1].charAt(0).toUpperCase() + termMatch[1].slice(1).toLowerCase();
        const termNumber = termMatch[2].toUpperCase();
        const termYear = termMatch[3] || new Date().getFullYear().toString();
        
        setExtractedInfo({
          termName: `${termSeason} ${termNumber} ${termYear}`.trim(),
          termNumber: termYear
        });
      }
      
      return () => {
        URL.revokeObjectURL(fileUrl);
      };
    }
  }, [watchPdfFile]);

  const extractTextFromPdf = async (pdfFile: File): Promise<string> => {
    console.log("Extracting text from PDF...");
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      console.log(`PDF loaded with ${pdf.numPages} pages`);
      
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + "\n";
      }
      
      console.log(`Extracted text length: ${fullText.length} characters`);
      return fullText;
    } catch (error) {
      console.error("PDF text extraction error:", error);
      throw error;
    }
  };

  const parseAssignments = (pdfText: string): any[] => {
    console.log("Parsing assignments from text...");
    
    try {
      if (!pdfText) {
        throw new Error("No PDF text available for parsing");
      }

      // Log a portion of the text to see what we're working with
      console.log("PDF text sample:", pdfText.substring(0, 500));

      const assignments: any[] = [];
      
      // Look for the assignment table section
      // Split by lines to process line by line
      const lines = pdfText.split('\n').map(line => line.trim());
      
      // Find the section that contains PART, JUSTICE, ROOM headers
      let tableStartIndex = -1;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].match(/PART.*JUSTICE.*ROOM.*CLERKS/i) || 
            lines[i].match(/PART.*JUSTICE.*ROOM/i)) {
          tableStartIndex = i;
          console.log("Found table header at line:", i, lines[i]);
          break;
        }
      }
      
      if (tableStartIndex === -1) {
        // Try alternate header patterns
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].match(/JUSTICE/) && lines[i].match(/PART/) && lines[i+1] && lines[i+1].match(/ROOM/)) {
            tableStartIndex = i;
            console.log("Found alternate table header at line:", i, lines[i]);
            break;
          }
        }
      }
      
      if (tableStartIndex === -1) {
        console.error("Could not find assignment table in PDF");
        return [];
      }
      
      // Skip the header row
      let currentLineIndex = tableStartIndex + 1;
      
      // Process rows until we reach the end of the table or end of document
      while (currentLineIndex < lines.length) {
        const line = lines[currentLineIndex];
        
        // Skip empty lines
        if (!line || line.trim() === '') {
          currentLineIndex++;
          continue;
        }
        
        // Check if we've reached the end of the table
        if (line.match(/END OF TABLE|PAGE No\.|LOCATED AT/i)) {
          console.log("Reached end of table at line:", currentLineIndex, line);
          break;
        }
        
        // Extract assignment information
        // Look for patterns like:
        // 1. Part number/code (could be numbers, TAP, AT, etc.)
        // 2. Justice name (usually in format J. LASTNAME)
        // 3. Room number
        
        // Check if line starts with a part identifier
        const partPattern = /^(\d+\s*[A-Z]*|\*+|TAP\s*[A-Z]?|GWP\d+|AT\d+)/i;
        const partMatch = line.match(partPattern);
        
        if (partMatch) {
          console.log("Found part row:", line);
          
          // Extract the part code
          const part = partMatch[1].trim();
          
          // Extract the justice name (usually follows the part code)
          // Justice names typically in format "J. LASTNAME" or "A. B. LASTNAME"
          const justicePattern = /([A-Z]\.\s+[A-Z](?:\.\s*)?(?:\s+[A-Z](?:\.\s*)?)*\s+[A-Z]+)/;
          const justiceMatch = line.substring(part.length).match(justicePattern);
          
          if (justiceMatch) {
            const justice = justiceMatch[1].trim();
            
            // Extract room number (usually follows the justice name)
            // Room numbers are typically numeric
            const roomPattern = /\b(\d{1,4}[A-Z]?)\b/;
            const lineAfterJustice = line.substring(part.length + justice.length);
            const roomMatch = lineAfterJustice.match(roomPattern);
            
            if (roomMatch) {
              const room = roomMatch[1].trim();
              
              // Extract remaining information (clerks, etc.)
              const remainingText = lineAfterJustice.substring(roomMatch.index! + roomMatch[0].length).trim();
              
              // Extract fax number if present
              let fax = "";
              const faxMatch = remainingText.match(/(\d+-\d+)/);
              if (faxMatch) {
                fax = faxMatch[1];
              }
              
              // Extract telephone extension
              let tel = "";
              const telMatch = remainingText.match(/\(?(\d{3})\)?[\s-]?(\d{3})[-\s]?(\d{4})/);
              if (telMatch) {
                tel = telMatch[0];
              }
              
              // Extract sergeant name if present (usually uppercase)
              let sgt = "";
              const sgtPattern = /([A-Z]{2,}(?:\s+[A-Z]+)*)/;
              const sgtMatch = remainingText.match(sgtPattern);
              if (sgtMatch && !sgtMatch[1].match(/\d/)) {  // Avoid matching phone numbers
                sgt = sgtMatch[1];
              }
              
              // The rest can be considered clerk names
              // Clerks are typically separated by commas or slashes
              let clerks: string[] = [];
              
              // Try to find clerk names after the sergeant
              const clerksText = sgt ? 
                remainingText.substring(remainingText.indexOf(sgt) + sgt.length).trim() : 
                remainingText;
              
              if (clerksText) {
                clerks = clerksText
                  .split(/[,\/]/)
                  .map(c => c.trim())
                  .filter(c => c && c.length > 0 && !/^\d+$/.test(c));  // Filter out pure numbers
              }
              
              // Add the extracted assignment
              assignments.push({
                part,
                justice,
                room,
                fax,
                tel,
                sgt,
                clerks
              });
              
              console.log("Extracted assignment:", {
                part,
                justice,
                room,
                fax,
                tel,
                sgt,
                clerks
              });
            }
          }
        }
        
        currentLineIndex++;
      }
      
      console.log(`Extracted ${assignments.length} assignments`);
      return assignments;
    } catch (error) {
      console.error("Error parsing assignments:", error);
      return [];
    }
  };

  const processTermData = async (pdfFile: File): Promise<any[]> => {
    try {
      const pdfText = await extractTextFromPdf(pdfFile);
      
      // Extract term info from the PDF text
      const termTitleMatch = pdfText.match(/TERM\s+(I+V?|V?I+|[IVX]+)\s*$/m);
      if (termTitleMatch && !extractedInfo) {
        setExtractedInfo({
          termName: `Term ${termTitleMatch[1]}`,
          termNumber: new Date().getFullYear().toString()
        });
      }
      
      // Look for date range
      const dateRangeMatch = pdfText.match(/(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\s+(\d{1,2})[,\s]+(\d{4})\s*[-–]\s*(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\s+(\d{1,2})[,\s]+(\d{4})/i);
      if (dateRangeMatch && extractedInfo) {
        const startMonth = dateRangeMatch[1];
        const startDay = dateRangeMatch[2];
        const startYear = dateRangeMatch[3];
        const endMonth = dateRangeMatch[4];
        const endDay = dateRangeMatch[5];
        const endYear = dateRangeMatch[6];
        
        setExtractedInfo(prev => ({
          ...prev,
          startDate: `${startYear}-${getMonthNumber(startMonth)}-${startDay.padStart(2, '0')}`,
          endDate: `${endYear}-${getMonthNumber(endMonth)}-${endDay.padStart(2, '0')}`
        }));
      }
      
      const parsedAssignments = parseAssignments(pdfText);
      console.log("Parsed assignments:", parsedAssignments);
      setAssignments(parsedAssignments);
      return parsedAssignments;
    } catch (error) {
      console.error("Error processing term data:", error);
      setAssignments([]);
      return [];
    }
  };
  
  // Helper to convert month name to number
  const getMonthNumber = (monthName: string): string => {
    const months: Record<string, string> = {
      'JANUARY': '01', 'FEBRUARY': '02', 'MARCH': '03', 'APRIL': '04',
      'MAY': '05', 'JUNE': '06', 'JULY': '07', 'AUGUST': '08',
      'SEPTEMBER': '09', 'OCTOBER': '10', 'NOVEMBER': '11', 'DECEMBER': '12'
    };
    return months[monthName.toUpperCase()] || '01';
  };

  const processPdfContent = async (termId: string, pdfUrl: string, assignments: any[] = []) => {
    try {
      setProcessingError(null);
      
      const mappedAssignments = assignments.map(a => ({
        partCode: a.part,
        justiceName: a.justice,
        roomNumber: a.room,
        phone: a.tel,
        sergeantName: a.sgt,
        clerkNames: Array.isArray(a.clerks) ? a.clerks : 
          (a.clerks ? a.clerks.split(/[,/]/).map((s: string) => s.trim()).filter(Boolean) : []),
        extension: null,
        fax: a.fax || null
      }));

      console.log('Submitting assignments to backend:', mappedAssignments);
      
      const { data, error } = await supabase.functions.invoke('parse-term-sheet', {
        body: { 
          term_id: termId, 
          pdf_url: pdfUrl,
          client_extracted: {
            assignments: mappedAssignments
          } 
        },
      });

      if (error) {
        console.error("Error calling parse-term-sheet function:", error);
        throw new Error(`Error processing PDF: ${error.message}`);
      }

      console.log("PDF processing result:", data);
      return data;
    } catch (error) {
      console.error("Error calling parse-term-sheet function:", error);
      setProcessingError(error instanceof Error ? error.message : "Failed to process PDF content");
      throw error;
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      setIsUploading(true);
      setCurrentStep(1);
      setProcessingError(null);
      
      const fileName = `term-sheet-${Date.now()}.pdf`;
      setUploadProgress(10);
      
      const { data: fileData, error: fileError } = await supabase.storage
        .from('term-sheets')
        .upload(fileName, values.pdfFile);
      
      if (fileError) {
        throw new Error(`Error uploading file: ${fileError.message}`);
      }
      
      setUploadProgress(40);
      
      const { data: { publicUrl } } = supabase.storage
        .from('term-sheets')
        .getPublicUrl(fileName);
      
      setUploadProgress(50);
      setCurrentStep(2);
      
      // Process PDF content to extract term information
      console.log("Processing term data...");
      const sampleAssignments = await processTermData(values.pdfFile);
      
      if (!extractedInfo || !extractedInfo.termName) {
        setExtractedInfo({
          termName: "Term " + new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          termNumber: `${new Date().getFullYear()}-${new Date().getMonth() + 1}`,
        });
      }
      
      // Create term record with extracted information
      const { data: termData, error: termError } = await supabase
        .from('court_terms')
        .insert({
          term_name: extractedInfo?.termName || "New Term",
          term_number: extractedInfo?.termNumber || `${new Date().getFullYear()}-${new Date().getMonth() + 1}`,
          location: "New York",
          start_date: extractedInfo?.startDate || new Date().toISOString().split('T')[0],
          end_date: extractedInfo?.endDate || new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0],
          description: "Automatically generated from PDF upload",
          pdf_url: publicUrl,
        })
        .select()
        .single();
      
      if (termError) {
        throw new Error(`Error creating term: ${termError.message}`);
      }
      
      setUploadProgress(60);
      
      if (sampleAssignments.length === 0) {
        console.warn("No assignments extracted from PDF");
        toast.warning("No assignments could be extracted from the PDF. Please check the format and try again.");
        setProcessingError("No assignments could be extracted from the PDF");
      } else {
        setUploadProgress(70);
        setCurrentStep(3);
        
        try {
          const result = await processPdfContent(termData.id, publicUrl, sampleAssignments);
          setUploadProgress(100);
          
          if (result.success) {
            toast.success(`Term sheet processed successfully. Extracted ${result.extracted.assignments} assignments and ${result.extracted.personnel} personnel records.`);
            
            if (onUploadSuccess) {
              onUploadSuccess();
            }
          } else {
            toast.warning("Term sheet uploaded, but data extraction was incomplete. Some manual editing may be required.");
          }
        } catch (parseError) {
          console.error("PDF parsing encountered issues:", parseError);
          toast.warning("Term sheet uploaded, but PDF parsing had issues. You may need to enter some data manually.");
          
          setTimeout(() => {
            navigate("/terms?tab=terms");
          }, 2000);
        }
      }
      
      form.reset();
      
    } catch (error) {
      console.error("Error uploading term sheet:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload term sheet");
    } finally {
      setIsUploading(false);
      setCurrentStep(0);
      setUploadProgress(0);
    }
  };

  const handleRetry = async () => {
    if (!form.getValues("pdfFile")) {
      toast.error("Please select a PDF file first");
      return;
    }
    
    setRetryCount(prev => prev + 1);
    onSubmit(form.getValues());
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Upload Court Term Sheet</CardTitle>
        <CardDescription>
          Upload a court term sheet PDF to automatically extract and store court assignments and personnel information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="pdfFile"
              render={({ field: { value, onChange, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>Term Sheet PDF</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            onChange(file);
                            setProcessingError(null);
                          }
                        }}
                        {...fieldProps}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Upload a PDF file containing the court term sheet - we'll automatically extract all relevant information
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {processingError && (
              <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-900">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-red-800">
                  <p className="font-medium">Error processing PDF:</p>
                  <p className="text-sm mt-1">{processingError}</p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 bg-white text-red-600 border-red-300 hover:bg-red-50"
                    onClick={handleRetry}
                  >
                    <Loader2 className={`mr-2 h-4 w-4 ${retryCount > 0 ? "animate-spin" : ""}`} />
                    Retry Upload
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            
            {extractedInfo && (
              <div className="bg-green-50 p-4 rounded-md">
                <h3 className="text-sm font-semibold text-green-800 mb-2">Preliminary Information Detected</h3>
                {extractedInfo.termName && (
                  <p className="text-sm text-green-800">Term Name: {extractedInfo.termName}</p>
                )}
                {extractedInfo.termNumber && (
                  <p className="text-sm text-green-800">Term Number: {extractedInfo.termNumber}</p>
                )}
                {extractedInfo.startDate && extractedInfo.endDate && (
                  <p className="text-sm text-green-800">Date Range: {extractedInfo.startDate} to {extractedInfo.endDate}</p>
                )}
                <p className="text-xs text-green-600 mt-2">Full data will be extracted after upload</p>
              </div>
            )}
            
            {pdfPreviewUrl && (
              <div className="mt-4 border rounded-md p-4">
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  PDF Preview
                </h3>
                <iframe
                  src={pdfPreviewUrl}
                  className="w-full h-[300px] border"
                  title="PDF Preview"
                />
              </div>
            )}
            
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    {currentStep === 1 && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {currentStep > 1 && <Check className="h-4 w-4 mr-2 text-green-500" />}
                    <span>Uploading PDF</span>
                  </div>
                  <span>{currentStep >= 1 ? (currentStep === 1 ? `${uploadProgress}%` : '100%') : '0%'}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    {currentStep === 2 && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {currentStep > 2 && <Check className="h-4 w-4 mr-2 text-green-500" />}
                    <span>Creating Term Record</span>
                  </div>
                  <span>{currentStep >= 2 ? (currentStep === 2 ? 'Processing...' : 'Done') : 'Waiting...'}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    {currentStep === 3 && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {currentStep > 3 && <Check className="h-4 w-4 mr-2 text-green-500" />}
                    <span>Extracting Data</span>
                  </div>
                  <span>{currentStep >= 3 ? (currentStep === 3 ? 'Parsing content...' : 'Done') : 'Waiting...'}</span>
                </div>
                
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
            
            <Button type="submit" disabled={isUploading} className="w-full">
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {currentStep === 1 ? "Uploading..." : 
                   currentStep === 2 ? "Creating Term..." : 
                   currentStep === 3 ? "Extracting Data..." : "Processing..."}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload and Process Term Sheet
                </>
              )}
            </Button>
          </form>
        </Form>

        {assignments && assignments.length > 0 && (
          <div className="mt-8">
            <h3 className="text-base font-semibold mb-2">Extracted Assignments</h3>
            {assignments.length > 0 && assignments.length <= 5 && (
              <div className="mb-2 text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-3 py-2 text-sm">
                Warning: Only {assignments.length} assignments were extracted. This may indicate a parsing issue or incomplete data.
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="min-w-full border text-sm bg-white">
                <thead>
                  <tr className="bg-gray-100 text-gray-900">
                    <th className="border px-2 py-1 text-gray-900">PART</th>
                    <th className="border px-2 py-1 text-gray-900">JUSTICE</th>
                    <th className="border px-2 py-1 text-gray-900">ROOM</th>
                    <th className="border px-2 py-1 text-gray-900">FAX</th>
                    <th className="border px-2 py-1 text-gray-900">TEL</th>
                    <th className="border px-2 py-1 text-gray-900">SGT</th>
                    <th className="border px-2 py-1 text-gray-900">CLERKS</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((a, idx) => (
                    <tr key={idx} className="even:bg-gray-50 text-gray-900">
                      <td className="border px-2 py-1 text-gray-900">{a.part}</td>
                      <td className="border px-2 py-1 text-gray-900">{a.justice}</td>
                      <td className="border px-2 py-1 text-gray-900">{a.room}</td>
                      <td className="border px-2 py-1 text-gray-900">{a.fax}</td>
                      <td className="border px-2 py-1 text-gray-900">{a.tel}</td>
                      <td className="border px-2 py-1 text-gray-900">{a.sgt}</td>
                      <td className="border px-2 py-1 text-gray-900">
                        {Array.isArray(a.clerks) 
                          ? a.clerks.join(', ') 
                          : a.clerks}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
