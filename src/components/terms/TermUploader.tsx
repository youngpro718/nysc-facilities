
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
import { Upload, FileText, Check, Loader2, AlertTriangle, Info } from "lucide-react";
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
  const [pdfText, setPdfText] = useState<string>("");
  const [debugInfo, setDebugInfo] = useState<any>(null);

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
      
      // Save full text for debugging
      setPdfText(fullText);
      
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

      console.log("PDF text sample:", pdfText.substring(0, 1000));

      const assignments: any[] = [];
      const lines = pdfText.split('\n').map(line => line.trim());
      
      // Debug: Log all lines for inspection
      console.log("Total lines:", lines.length);
      setDebugInfo({ lineCount: lines.length, sampleLines: lines.slice(0, 20) });
      
      // Multi-approach strategy for finding the assignment table section
      
      // Approach 1: Look for standard table headers
      let tableStartIndex = -1;
      const possibleHeaders = [
        /PART.*JUSTICE.*ROOM/i,
        /PART.*JUDGE.*ROOM/i,
        /P(AR)?T.*J\..+ROOM/i,
        /^\s*PART\s*$/i,
        /JUDGE.*PART.*ROOM/i,
        /COURTROOM.*JUDGE/i,
        /PART.*COURTROOM/i,
      ];

      for (let i = 0; i < lines.length; i++) {
        // Check current line and a few following lines together
        for (let j = 0; j < 3 && i + j < lines.length; j++) {
          const combinedLines = lines.slice(i, i + j + 1).join(' ');
          
          if (possibleHeaders.some(pattern => pattern.test(combinedLines))) {
            console.log("Found table header at line:", i, combinedLines);
            tableStartIndex = i;
            break;
          }
        }
        if (tableStartIndex !== -1) break;
      }

      // Approach 2: Find room numbers as anchors
      if (tableStartIndex === -1) {
        console.log("Trying to find room numbers as anchors...");
        const roomNumberPattern = /\b(?:RM\.?|ROOM)?\s*\d{3,4}[A-Z]?\b|\b\d{3,4}[A-Z]?\s*$/i;
        
        for (let i = 0; i < lines.length; i++) {
          if (roomNumberPattern.test(lines[i]) && 
              (i > 0 && /[A-Z]\.?\s+[A-Z][a-z]+/.test(lines[i]))) { // Looks like a justice name
            console.log("Found potential assignment line with room:", i, lines[i]);
            tableStartIndex = i - 1; // Start from the line before this
            break;
          }
        }
      }
      
      // Approach 3: Scan for patterns that look like part numbers followed by justice names
      if (tableStartIndex === -1) {
        console.log("Scanning for part number patterns...");
        const partPattern = /^\s*(?:[0-9]+[A-Z]*|[IVX]+|TAP\s*[A-Z]?|[A-Z]+\s*\d+)\s+[A-Z]\.?\s/i;
        
        for (let i = 0; i < lines.length; i++) {
          if (partPattern.test(lines[i])) {
            console.log("Found potential part number pattern:", i, lines[i]);
            tableStartIndex = i - 1;
            break;
          }
        }
      }

      if (tableStartIndex === -1) {
        console.error("Could not find assignment table in PDF");
        return [];
      }

      console.log("Starting to process assignments from line", tableStartIndex);
      
      // More flexible parsing algorithms
      const partPatterns = [
        /^([0-9]+[A-Z]*)/,
        /^(TAP\s*[A-Z]?)/i,
        /^([A-Z]*\s*\d+[A-Z]*)/,
        /^([IVX]+)/,
        /^(IDV|MDC|SCT)/i,
      ];
      
      // Pre-process potential room numbers from the entire document
      const roomNumbers = new Set<string>();
      const roomPattern = /(?:RM\.?|ROOM)?\s*(\d{1,4}[A-Z]?)\b|\b(\d{3,4}[A-Z]?)(?:\s|$)/i;
      
      for (const line of lines) {
        const roomMatches = line.match(new RegExp(roomPattern, 'gi'));
        if (roomMatches) {
          roomMatches.forEach(match => {
            const extracted = match.match(roomPattern);
            if (extracted) {
              const room = (extracted[1] || extracted[2]).trim();
              if (/^\d{3,4}[A-Z]?$/.test(room)) { // Validate it looks like a room number
                roomNumbers.add(room);
              }
            }
          });
        }
      }
      
      console.log("Potential room numbers found:", Array.from(roomNumbers));
      
      // Process assignment lines with more flexibility
      let currentLineIndex = tableStartIndex;
      let assignmentCount = 0;
      const maxLinesToProcess = 100; // Safety limit
      
      while (currentLineIndex < lines.length && 
             currentLineIndex - tableStartIndex < maxLinesToProcess) {
        
        const line = lines[currentLineIndex].trim();
        
        // Skip empty lines or footer markers
        if (!line || 
            line.match(/END OF|PAGE No\.|LOCATED AT|COURT NOTES|^\s*\d+\s*$/i)) {
          currentLineIndex++;
          continue;
        }

        // Try to extract part number first
        let partMatch = null;
        for (const pattern of partPatterns) {
          partMatch = line.match(pattern);
          if (partMatch) break;
        }

        if (partMatch) {
          console.log("Processing potential assignment line:", line);
          
          const part = partMatch[1].trim();
          const remainingText = line.substring(partMatch[0].length).trim();
          
          // More flexible justice name extraction - look for name patterns
          // Justice names are usually in format: X. LASTNAME or X. X. LASTNAME or similar
          const justicePattern = /([A-Z]\.?\s+(?:[A-Z]\.?\s+)?[A-Z][A-Za-z\-']+)/;
          const justiceMatch = remainingText.match(justicePattern);
          
          if (justiceMatch) {
            const justice = justiceMatch[1].trim();
            const afterJustice = remainingText.substring(remainingText.indexOf(justice) + justice.length).trim();
            
            // Look for room number - more flexible pattern
            const roomPatterns = [
              /(?:RM\.?|ROOM)?\s*(\d{1,4}[A-Z]?)/i,
              /(\d{3,4}[A-Z]?)\s*$/i, // Room number at end of line
            ];
            
            let roomMatch = null;
            let room = '';
            
            for (const pattern of roomPatterns) {
              roomMatch = afterJustice.match(pattern);
              if (roomMatch) {
                room = roomMatch[1].trim();
                break;
              }
            }
            
            // If no room found but we have collected room numbers, try to find if any appears in the text
            if (!room && roomNumbers.size > 0) {
              for (const potentialRoom of roomNumbers) {
                if (afterJustice.includes(potentialRoom)) {
                  room = potentialRoom;
                  break;
                }
              }
            }
            
            // Only process if we found what looks like a room number
            if (room) {
              // Extract remaining info - phone, fax, clerks
              let remainingInfo = afterJustice;
              if (roomMatch) {
                remainingInfo = afterJustice.substring(0, roomMatch.index) + 
                               afterJustice.substring(roomMatch.index + roomMatch[0].length);
              }
              
              // Phone and fax extraction
              const phonePattern = /(?:TEL:?)?\s*(?:\()?(\d{3}[\s-]?\d{3}[\s-]?\d{4})(?:\))?/i;
              const faxPattern = /(?:FAX:?)?\s*(?:\()?(\d{3}[\s-]?\d{3}[\s-]?\d{4})(?:\))?/i;
              
              const phoneMatch = remainingInfo.match(phonePattern);
              const faxMatch = remainingInfo.match(faxPattern);
              
              // Try to extract clerks and other personnel - more flexible approach
              let clerks: string[] = [];
              let sgt = '';
              
              // Try to find 'SGT' or similar pattern
              const sgtPattern = /\b(SGT\.?\s+[A-Z]+)/i;
              const sgtMatch = remainingInfo.match(sgtPattern);
              if (sgtMatch) {
                sgt = sgtMatch[1];
                remainingInfo = remainingInfo.replace(sgtMatch[0], '');
              }
              
              // Clean up remaining text and split potential clerk names
              if (phoneMatch) remainingInfo = remainingInfo.replace(phoneMatch[0], '');
              if (faxMatch) remainingInfo = remainingInfo.replace(faxMatch[0], '');
              
              // Look for name patterns in the remaining text
              const namePattern = /[A-Z][A-Za-z\-'.]+(?:\s+[A-Z][A-Za-z\-'.]+)*/g;
              const nameMatches = remainingInfo.match(namePattern);
              
              if (nameMatches) {
                // Filter out known non-clerk terms
                clerks = nameMatches.filter(name => 
                  !['TEL', 'FAX', 'RM', 'ROOM', 'SGT', 'PART'].includes(name) &&
                  !name.match(/^\d+$/) &&
                  name.length > 1
                );
              }
              
              console.log("Extracted assignment:", {
                part,
                justice,
                room,
                phone: phoneMatch ? phoneMatch[1] : '',
                fax: faxMatch ? faxMatch[1] : '',
                sgt,
                clerks
              });
              
              assignments.push({
                part,
                justice,
                room,
                tel: phoneMatch ? phoneMatch[1] : null,
                fax: faxMatch ? faxMatch[1] : null,
                sgt,
                clerks
              });
              
              assignmentCount++;
            }
          }
        }
        
        currentLineIndex++;
      }
      
      console.log(`Successfully extracted ${assignments.length} assignments`);
      return assignments;
    } catch (error) {
      console.error("Error parsing assignments:", error);
      return [];
    }
  };

  const processTermData = async (pdfFile: File): Promise<any[]> => {
    try {
      const extractedText = await extractTextFromPdf(pdfFile);
      
      const termTitleMatch = extractedText.match(/TERM\s+(I+V?|V?I+|[IVX]+)\s*$/m);
      if (termTitleMatch && !extractedInfo) {
        setExtractedInfo({
          termName: `Term ${termTitleMatch[1]}`,
          termNumber: new Date().getFullYear().toString()
        });
      }
      
      const dateRangeMatch = extractedText.match(/(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\s+(\d{1,2})[,\s]+(\d{4})\s*[-–]\s*(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\s+(\d{1,2})[,\s]+(\d{4})/i);
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
      
      // Add fallback date extraction for more formats
      if (!dateRangeMatch) {
        const simpleDateMatch = extractedText.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s*[-–]\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/i);
        if (simpleDateMatch && extractedInfo) {
          setExtractedInfo(prev => ({
            ...prev,
            startDate: `${simpleDateMatch[3]}-${simpleDateMatch[1].padStart(2, '0')}-${simpleDateMatch[2].padStart(2, '0')}`,
            endDate: `${simpleDateMatch[6]}-${simpleDateMatch[4].padStart(2, '0')}-${simpleDateMatch[5].padStart(2, '0')}`
          }));
        }
      }
      
      const parsedAssignments = parseAssignments(extractedText);
      console.log("Parsed assignments:", parsedAssignments);
      setAssignments(parsedAssignments);
      return parsedAssignments;
    } catch (error) {
      console.error("Error processing term data:", error);
      setAssignments([]);
      return [];
    }
  };
  
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
          (a.clerks ? a.clerks.split(/[,\/]/).map((s: string) => s.trim()).filter(Boolean) : []),
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
      
      console.log("Processing term data...");
      const sampleAssignments = await processTermData(values.pdfFile);
      
      if (!extractedInfo || !extractedInfo.termName) {
        setExtractedInfo({
          termName: "Term " + new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          termNumber: `${new Date().getFullYear()}-${new Date().getMonth() + 1}`,
        });
      }
      
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
        setProcessingError(`No assignments could be extracted from the PDF. PDF text length: ${pdfText.length} characters.`);
        
        // Create term but show warning
        toast.warning("Term created but no assignments could be extracted. You may need to add assignments manually.");
        
        setTimeout(() => {
          navigate("/terms?tab=terms");
        }, 2000);
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
                            setPdfText("");
                            setDebugInfo(null);
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
            
            {debugInfo && (
              <Alert className="bg-blue-50 border-blue-200 text-blue-900">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-blue-800">
                  <p className="font-medium">PDF Processing Information:</p>
                  <p className="text-sm">Lines found: {debugInfo.lineCount}</p>
                  <details className="mt-2">
                    <summary className="text-sm cursor-pointer">View sample lines</summary>
                    <div className="mt-1 p-2 bg-blue-100 rounded-md text-xs overflow-auto max-h-32">
                      {debugInfo.sampleLines?.map((line: string, idx: number) => (
                        <div key={idx} className="mb-1">
                          Line {idx}: {line || "(empty)"}
                        </div>
                      ))}
                    </div>
                  </details>
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
        
        {pdfText && pdfText.length > 0 && (
          <div className="mt-8">
            <details>
              <summary className="text-sm font-medium cursor-pointer">View Raw PDF Text (for debugging)</summary>
              <div className="mt-2 p-3 bg-gray-50 border rounded text-xs overflow-auto max-h-96 whitespace-pre-wrap">
                {pdfText}
              </div>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
