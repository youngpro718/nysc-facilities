import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { parsePDF, ParsedTermData } from '@/utils/pdfParser';

interface PdfUploadAreaProps {
  onPdfParsed: (data: ParsedTermData) => void;
  onFileUploaded: (url: string) => void;
  disabled?: boolean;
}

export const PdfUploadArea = ({ onPdfParsed, onFileUploaded, disabled }: PdfUploadAreaProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    console.log('🎯 File drop triggered with files:', acceptedFiles.length);
    const file = acceptedFiles[0];
    if (!file) {
      console.log('❌ No file provided');
      return;
    }

    console.log('📁 File details:', { 
      name: file.name, 
      type: file.type, 
      size: file.size,
      lastModified: new Date(file.lastModified).toISOString()
    });

    // Enhanced file validation
    if (file.type !== 'application/pdf') {
      console.log('❌ Invalid file type:', file.type);
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a PDF file only.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      console.log('❌ File too large:', file.size);
      toast({
        title: 'File Too Large',
        description: 'Please upload a PDF file smaller than 50MB.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size === 0) {
      console.log('❌ Empty file');
      toast({
        title: 'Empty File',
        description: 'The selected file appears to be empty.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setUploadedFile(file);
    console.log('🚀 Starting comprehensive PDF processing...');

    try {
      // Step 1: Upload the PDF first
      console.log('☁️ Step 1: Uploading PDF to storage...');
      const { supabase } = await import('@/integrations/supabase/client');
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = fileName;

      console.log('📤 Uploading file:', filePath);
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('term-pdfs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        if (uploadError.message?.includes('Bucket not found')) {
          throw new Error('Storage configuration error: term-pdfs bucket not found');
        } else if (uploadError.message?.includes('permissions')) {
          throw new Error('Storage permission error: unable to upload file');
        } else {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }
      }

      console.log('✅ Upload successful:', uploadData);

      // Step 2: Parse the PDF using Edge Function
      console.log('📄 Step 2: Parsing PDF with server-side processing...');
      const { data: parsedData, error: parseError } = await supabase.functions.invoke('parse-pdf', {
        body: { filePath: filePath }
      });

      if (parseError) {
        console.error('❌ Parse error:', parseError);
        throw new Error(`PDF parsing failed: ${parseError.message}`);
      }

      if (!parsedData || parsedData.assignments.length === 0) {
        toast({
          title: 'No Data Found',
          description: 'No court assignments could be extracted from this PDF. Please verify the file format.',
          variant: 'destructive',
        });
        return;
      }

      console.log('✅ PDF parsed successfully:', {
        termName: parsedData.termName,
        location: parsedData.location,
        assignmentCount: parsedData.assignments.length
      });
      
      // Step 3: Get public URL
      console.log('🔗 Step 3: Getting public URL...');
      const { data: { publicUrl } } = supabase.storage
        .from('term-pdfs')
        .getPublicUrl(filePath);

      console.log('✅ Public URL generated:', publicUrl);

      // Step 4: Notify parent components
      console.log('📢 Step 4: Notifying parent components...');
      onFileUploaded(publicUrl);
      onPdfParsed(parsedData);

      // Success notification
      toast({
        title: 'PDF Processed Successfully',
        description: `Successfully parsed ${parsedData.assignments.length} court assignments from ${file.name}.`,
      });

      console.log('🎉 PDF processing completed successfully');
      
    } catch (error) {
      console.error('💥 Error during PDF processing:', error);
      
      // Provide specific error messages
      let title = 'Processing Error';
      let description = 'An unexpected error occurred. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          title = 'Processing Timeout';
          description = 'The PDF took too long to process. Try with a smaller or simpler file.';
        } else if (error.message.includes('worker')) {
          title = 'PDF Processing Error';
          description = 'Unable to initialize PDF processor. Please refresh the page and try again.';
        } else if (error.message.includes('Invalid PDF') || error.message.includes('corrupted')) {
          title = 'Invalid PDF File';
          description = 'The PDF file appears to be corrupted or invalid. Please try a different file.';
        } else if (error.message.includes('Storage')) {
          title = 'Upload Error';
          description = error.message;
        } else if (error.message.includes('No text')) {
          title = 'Cannot Extract Text';
          description = 'This PDF might be image-based or encrypted. Please try a text-based PDF.';
        } else {
          description = error.message;
        }
      }
      
      toast({
        title,
        description,
        variant: 'destructive',
      });
      
      // Reset file on error
      setUploadedFile(null);
    } finally {
      setIsProcessing(false);
      console.log('🏁 PDF processing pipeline completed');
    }
  }, [onPdfParsed, onFileUploaded, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    disabled: disabled || isProcessing
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
          ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {isProcessing ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Processing PDF...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            {uploadedFile ? (
              <>
                <FileText className="h-8 w-8 text-green-600" />
                <p className="text-sm font-medium">{uploadedFile.name}</p>
                <p className="text-xs text-muted-foreground">PDF uploaded and processed</p>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">
                  {isDragActive ? 'Drop the PDF here' : 'Drag & drop a PDF file here'}
                </p>
                <p className="text-xs text-muted-foreground">or click to select a file</p>
              </>
            )}
          </div>
        )}
      </div>

      {uploadedFile && !isProcessing && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setUploadedFile(null);
            onFileUploaded('');
            onPdfParsed({ assignments: [] });
          }}
          className="w-full"
        >
          Upload Different File
        </Button>
      )}
    </div>
  );
};