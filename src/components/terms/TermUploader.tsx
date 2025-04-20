
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
      
      // Enhanced part code patterns to match special formats
      const partPatterns = [
        /^((?:IDV|N-SCT|TAP\s*[A-G]|GWP\d|MDC-\d+|IA\d+|FAP\d+|CI\d+|PART\s*[A-Z0-9]+)\b)/i,
        /^([0-9]+[A-Z]*\s*(?:PART)?)/i,
        /^(TAP\s*[A-Z]?)/i,
        /^([A-Z]+\s*\d+[A-Z]*)/,
        /^([IVX]+\s*)/,
        /^(PART\s*[A-Z0-9]+)/i,
      ];
      
      // Look for standard table headers to locate assignment tables
      const tableStartIndex = lines.findIndex(line => 
        /PART.*JUSTICE|JUDGE.*PART|COURT.*PART|COURTROOM.*JUDGE|COURT PART/i.test(line)
      );
      
      // If we can't find a standard header, look for first line with a part code
      let startIndex = tableStartIndex;
      if (startIndex === -1) {
        startIndex = lines.findIndex(line => 
          partPatterns.some(pattern => pattern.test(line.trim()))
        );
      }

      if (startIndex === -1) {
        console.error("Could not find assignment table in PDF");
        return [];
      }

      console.log("Starting to process assignments from line", startIndex);
      
      let currentLineIndex = startIndex;
      const processedLines = new Set(); // Track processed lines to avoid duplicates
      
      // Scan through all lines after the header
      while (currentLineIndex < lines.length && 
             currentLineIndex - startIndex < 200) { // Extend scan range to 200 lines
        
        const line = lines[currentLineIndex].trim();
        currentLineIndex++;
        
        if (!line || line.match(/END OF|PAGE|^\s*$/i) || processedLines.has(line)) {
          continue;
        }

        processedLines.add(line);
        
        // Try to extract part code using each pattern
        let partMatch = null;
        let matchedPattern = null;
        
        for (const pattern of partPatterns) {
          partMatch = line.match(pattern);
          if (partMatch) {
            matchedPattern = pattern;
            break;
          }
        }

        if (partMatch) {
          console.log("Processing line:", line);
          
          const part = partMatch[1].trim().replace(/\s+/g, ' ');
          const remainingText = line.substring(partMatch[0].length).trim();
          
          // More flexible justice name extraction - look for capitalized names
          // Improved pattern to handle formats like "HON. J. DOE" or "J. SMITH"
          const justicePattern = /((?:HON\.?\s+)?[A-Z](?:\.\s+|\s+)[A-Z][A-Za-z\-']+(?:\s+[A-Z][A-Za-z\-']+)?)/;
          const justiceMatch = remainingText.match(justicePattern);
          
          if (justiceMatch) {
            const justice = justiceMatch[1].trim();
            const afterJustice = remainingText.substring(remainingText.indexOf(justice) + justice.length).trim();
            
            // Enhanced room number extraction - handle various formats
            // Look for "ROOM", "RM", or just a 3-4 digit number
            const roomPattern = /(?:(?:RM|ROOM)[\.:]?\s*)?(\d{3,4}[A-Z]?)/i;
            const roomMatch = afterJustice.match(roomPattern);
            
            let room = null;
            let remainingInfo = afterJustice;
            
            if (roomMatch) {
              room = roomMatch[1].trim();
              remainingInfo = afterJustice;
            }
            
            // Enhanced phone extraction - handle formats like (6)4051, 646-4051, or 646.4051
            const phonePatterns = [
              /\((\d)\)(\d{4})/,                   // (6)4051 format
              /\(?\d{3}[\s\.\-]?\d{3}[\s\.\-]?\d{4}\)?/i,  // Regular phone numbers
              /\d{3,4}-\d{4}/,                     // Extension format
              /\d{3,4}\.\d{4}/                     // Period-separated format
            ];
            
            let phone = null;
            for (const phonePattern of phonePatterns) {
              const phoneMatch = remainingInfo.match(phonePattern);
              if (phoneMatch) {
                phone = phoneMatch[0];
                break;
              }
            }
            
            // Extract fax number
            const faxPattern = /(?:FAX|F)[:.]\s*(\(?\d{3}[\s\.\-]?\d{3}[\s\.\-]?\d{4}|\d{3,4}-\d{4}|\d{3,4}\.\d{4})/i;
            const faxMatch = remainingInfo.match(faxPattern);
            let fax = faxMatch ? faxMatch[1] : null;
            
            // Extract sergeant (last name only) - enhanced to handle various formats
            const sgtPattern = /\b(?:SGT\.?\s+|SERGEANT\s+)([A-Z]+)\b/i;
            const sgtMatch = remainingInfo.match(sgtPattern);
            let sgt = sgtMatch ? sgtMatch[1] : '';
            
            // Enhanced clerk name extraction - handle various formats
            // Look for patterns like "T. SMITH", "T.SMITH", "T SMITH"
            let clerks: string[] = [];
            const clerkPattern = /[A-Z]\.?\s+[A-Za-z\-']+(?:\s+[A-Za-z\-']+)?/g;
            let clerkText = remainingInfo;
            
            // Remove the sergeant part if found to avoid confusion
            if (sgtMatch) {
              clerkText = clerkText.replace(sgtMatch[0], '');
            }
            
            // Find all potential clerk names
            const clerkMatches = clerkText.match(clerkPattern);
            
            if (clerkMatches) {
              // Filter out false positives like "SGT. SMITH" or the justice name
              clerks = clerkMatches
                .filter(name => !name.match(/^(SGT|SERGEANT|HON|JUDGE|ROOM|RM|FAX|F)\b/i))
                .filter(name => name !== justice)
                .map(name => name.trim());
            }
            
            console.log("Extracted assignment:", {
              part,
              justice,
              room,
              phone,
              fax,
              sgt,
              clerks
            });
            
            assignments.push({
              part,
              justice,
              room,
              tel: phone,
              fax,
              sgt,
              clerks
            });
          }
        }
      }
      
      // If we didn't find many assignments, try a secondary parsing approach with looser patterns
      if (assignments.length < 5) {
        console.log("Few assignments found, trying secondary parsing approach");
        
        // Try to detect table structure by looking for consistent patterns
        // in consecutive lines with similar spacing
        
        // Reset and scan through all lines in PDF
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          
          if (!line || processedLines.has(line)) continue;
          
          // Look for lines that potentially contain part, justice, and room info
          // but might not match our rigid patterns
          if (line.match(/[A-Z0-9]{1,6}\s+[A-Z]/)) {
            // Attempt to split the line by whitespace groups and analyze parts
            const parts = line.split(/\s{2,}/);
            
            if (parts.length >= 2) {
              const potentialPart = parts[0].trim();
              const potentialJustice = parts[1].trim();
              
              // If this looks like part/justice data, extract it
              if (potentialPart.length <= 10 && potentialJustice.match(/[A-Z]/)) {
                let roomInfo = '';
                let phoneInfo = '';
                let clerkInfo = '';
                
                if (parts.length >= 3) roomInfo = parts[2].trim();
                if (parts.length >= 4) phoneInfo = parts[3].trim();
                if (parts.length >= 5) clerkInfo = parts.slice(4).join(' ').trim();
                
                // Extract phone number if present
                let phone = null;
                if (phoneInfo.match(/\d{3,4}[\.\-]?\d{4}/)) {
                  phone = phoneInfo;
                }
                
                // Create a new assignment based on this looser parsing
                assignments.push({
                  part: potentialPart,
                  justice: potentialJustice,
                  room: roomInfo.match(/\d{3,4}/) ? roomInfo.match(/\d{3,4}/)[0] : null,
                  tel: phone,
                  fax: null,
                  sgt: '',
                  clerks: clerkInfo ? [clerkInfo] : []
                });
              }
            }
          }
        }
      }
      
      // Perform post-processing to clean up and standardize data
      const processedAssignments = assignments.map(assignment => {
        // Clean part code - standardize format and remove extra spaces
        const cleanedPart = assignment.part.replace(/PART\s+/i, '').trim();
        
        // Clean justice name - ensure consistent format
        let justice = assignment.justice;
        if (justice.startsWith('HON.')) {
          justice = justice.substring(4).trim();
        }
        
        // Standardize clerk names format
        const cleanedClerks = Array.isArray(assignment.clerks) 
          ? assignment.clerks.map((c: string) => c.trim()) 
          : [];
        
        return {
          ...assignment,
          part: cleanedPart,
          justice,
          clerks: cleanedClerks
        };
      });
      
      // Remove any duplicate assignments based on part code
      const uniqueAssignments = Array.from(
        new Map(processedAssignments.map(a => [a.part, a])).values()
      );
      
      console.log(`Successfully extracted ${uniqueAssignments.length} assignments`);
      return uniqueAssignments;
    } catch (error) {
      console.error("Error parsing assignments:", error);
      return [];
    }
  };

  const processTermData = async (pdfFile: File): Promise<any[]> => {
    try {
      const extractedText = await extractTextFromPdf(pdfFile);
      
      // Extract term information from PDF
      // Look for term title in various formats
      const termTitleMatch = extractedText.match(/TERM\s+(I+V?|V?I+|[IVX]+|[0-9]+)(?:\s+ASSIGNMENT)?/mi);
      if (termTitleMatch && !extractedInfo) {
        setExtractedInfo({
          termName: `Term ${termTitleMatch[1]}`,
          termNumber: new Date().getFullYear().toString()
        });
      }
      
      // Enhanced date extraction - handle various date formats
      // Traditional format: JANUARY 30, 2023 - FEBRUARY 28, 2023
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
      
      // Try alternative date formats
      if (!dateRangeMatch) {
        // MM/DD/YYYY format
        const simpleDateMatch = extractedText.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s*[-–]\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/i);
        if (simpleDateMatch && extractedInfo) {
          setExtractedInfo(prev => ({
            ...prev,
            startDate: `${simpleDateMatch[3]}-${simpleDateMatch[1].padStart(2, '0')}-${simpleDateMatch[2].padStart(2, '0')}`,
            endDate: `${simpleDateMatch[6]}-${simpleDateMatch[4].padStart(2, '0')}-${simpleDateMatch[5].padStart(2, '0')}`
          }));
        } else {
          // Text date without year: JANUARY 3 - FEBRUARY 2
          const shortDateMatch = extractedText.match(/(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\s+(\d{1,2})\s*[-–]\s*(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\s+(\d{1,2})/i);
          
          if (shortDateMatch && extractedInfo) {
            const currentYear = new Date().getFullYear();
            setExtractedInfo(prev => ({
              ...prev,
              startDate: `${currentYear}-${getMonthNumber(shortDateMatch[1])}-${shortDateMatch[2].padStart(2, '0')}`,
              endDate: `${currentYear}-${getMonthNumber(shortDateMatch[3])}-${shortDateMatch[4].padStart(2, '0')}`
            }));
          }
        }
      }
      
      // Extract location information
      const locationMatch = extractedText.match(/(?:COUNTY|BOROUGH|DISTRICT|COURT)\s+OF\s+([A-Z\s]+)/i);
      if (locationMatch && extractedInfo) {
        setExtractedInfo(prev => ({
          ...prev,
          location: locationMatch[1].trim()
        }));
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
          location: extractedInfo?.location || "New York",
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
