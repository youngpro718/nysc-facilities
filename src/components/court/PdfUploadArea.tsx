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
    console.log('onDrop triggered with files:', acceptedFiles);
    const file = acceptedFiles[0];
    if (!file) {
      console.log('No file provided');
      return;
    }

    console.log('File details:', { name: file.name, type: file.type, size: file.size });

    if (file.type !== 'application/pdf') {
      console.log('Invalid file type:', file.type);
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a PDF file.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setUploadedFile(file);
    console.log('Starting PDF processing...');

    try {
      // Parse the PDF
      console.log('Calling parsePDF...');
      const parsedData = await parsePDF(file);
      console.log('PDF parsed successfully:', parsedData);
      
      // Upload to Supabase storage
      console.log('Uploading to Supabase storage...');
      const { supabase } = await import('@/integrations/supabase/client');
      const fileExt = 'pdf';
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('term-pdfs')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', data);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('term-pdfs')
        .getPublicUrl(filePath);

      console.log('Public URL:', publicUrl);

      onFileUploaded(publicUrl);
      onPdfParsed(parsedData);

      toast({
        title: 'PDF Processed',
        description: `Successfully parsed ${parsedData.assignments.length} court assignments.`,
      });
    } catch (error) {
      console.error('Error processing PDF:', error);
      toast({
        title: 'Processing Error',
        description: 'Failed to process the PDF file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      console.log('Processing completed');
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