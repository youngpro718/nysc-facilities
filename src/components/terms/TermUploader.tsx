
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
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  const watchPdfFile = form.watch("pdfFile");

  useEffect(() => {
    // Create object URL for PDF preview when file is selected
    if (watchPdfFile && watchPdfFile instanceof File) {
      const fileUrl = URL.createObjectURL(watchPdfFile);
      setPdfPreviewUrl(fileUrl);
      
      // Try to extract preliminary information from filename
      const filename = watchPdfFile.name;
      const termMatch = filename.match(/(spring|fall|summer|winter)\s+term\s+(\d{4})/i);
      
      if (termMatch) {
        setExtractedInfo({
          termName: `${termMatch[1].charAt(0).toUpperCase() + termMatch[1].slice(1)} Term ${termMatch[2]}`,
          termNumber: termMatch[2]
        });
      }
      
      // Clean up object URL on unmount
      return () => {
        URL.revokeObjectURL(fileUrl);
      };
    }
  }, [watchPdfFile]);

  const processPdfContent = async (termId: string, pdfUrl: string) => {
    try {
      setProcessingError(null);
      
      // Call the edge function to process the PDF
      const { data, error } = await supabase.functions.invoke('parse-term-sheet', {
        body: { term_id: termId, pdf_url: pdfUrl },
      });

      if (error) {
        console.error("Error calling parse-term-sheet function:", error);
        throw new Error(`Error processing PDF: ${error.message}`);
      }

      console.log("PDF processing result:", data);
      return data;
    } catch (error) {
      console.error("Error calling parse-term-sheet function:", error);
      
      // Set error message
      setProcessingError(error instanceof Error ? error.message : "Failed to process PDF content");
      
      // Re-throw to handle in the calling function
      throw error;
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      setIsUploading(true);
      setCurrentStep(1);
      setProcessingError(null);
      
      // Generate a filename based on timestamp to ensure uniqueness
      const fileName = `term-sheet-${Date.now()}.pdf`;
      setUploadProgress(10);
      
      // 1. Upload the PDF to storage
      const { data: fileData, error: fileError } = await supabase.storage
        .from('term-sheets')
        .upload(fileName, values.pdfFile);
      
      if (fileError) {
        throw new Error(`Error uploading file: ${fileError.message}`);
      }
      
      setUploadProgress(40);
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('term-sheets')
        .getPublicUrl(fileName);
      
      setUploadProgress(50);
      setCurrentStep(2);
      
      // 2. Create the term record with placeholder data that will be updated after parsing
      const { data: termData, error: termError } = await supabase
        .from('court_terms')
        .insert({
          term_name: extractedInfo?.termName || "New Term",
          term_number: extractedInfo?.termNumber || `${new Date().getFullYear()}-${new Date().getMonth() + 1}`,
          location: "To be extracted",
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0],
          description: "Automatically generated from PDF upload",
          pdf_url: publicUrl,
        })
        .select()
        .single();
      
      if (termError) {
        throw new Error(`Error creating term: ${termError.message}`);
      }
      
      setUploadProgress(70);
      setCurrentStep(3);
      
      // 3. Call the edge function to parse the PDF
      try {
        const result = await processPdfContent(termData.id, publicUrl);
        setUploadProgress(100);
        
        if (result.success) {
          toast.success(`Term sheet processed successfully. Extracted ${result.extracted.assignments} assignments and ${result.extracted.personnel} personnel records.`);
          
          // Call the success callback if provided
          if (onUploadSuccess) {
            onUploadSuccess();
          }
        } else {
          toast.warning("Term sheet uploaded, but data extraction was incomplete. Some manual editing may be required.");
        }
      } catch (parseError) {
        console.error("PDF parsing encountered issues:", parseError);
        toast.warning("Term sheet uploaded, but PDF parsing had issues. You may need to enter some data manually.");
        
        // Still navigate to terms tab since we successfully created the term
        setTimeout(() => {
          navigate("/terms?tab=terms");
        }, 2000);
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
      </CardContent>
    </Card>
  );
}
