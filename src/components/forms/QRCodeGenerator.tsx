import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Printer, QrCode } from 'lucide-react';
import { toast } from 'sonner';

interface QRCodeGeneratorProps {
  open: boolean;
  onClose: () => void;
}

export function QRCodeGenerator({ open, onClose }: QRCodeGeneratorProps) {
  const publicFormsUrl = `${window.location.origin}/public-forms`;

  const downloadQR = () => {
    const svg = document.getElementById('public-forms-qr');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'NYSC-Facilities-Forms-QR.png';
          a.click();
          URL.revokeObjectURL(url);
          toast.success('QR code downloaded!');
        }
      });
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const printQR = () => {
    window.print();
    toast.success('Print dialog opened');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            QR Code for Public Forms
          </DialogTitle>
          <DialogDescription>
            Print and post these QR codes for easy access to forms
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* QR Code Display */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-white p-6 rounded-lg shadow-lg">
                  <QRCodeSVG
                    id="public-forms-qr"
                    value={publicFormsUrl}
                    size={256}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <div className="text-center space-y-2">
                  <p className="font-semibold">Scan to Access Forms</p>
                  <p className="text-sm text-muted-foreground font-mono">{publicFormsUrl}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={downloadQR}>
                    <Download className="w-4 h-4 mr-2" />
                    Download QR Code
                  </Button>
                  <Button variant="outline" onClick={printQR}>
                    <Printer className="w-4 h-4 mr-2" />
                    Print Poster
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Printable Poster Template */}
          <div className="print:block hidden">
            <div className="bg-white p-12 text-black">
              <div className="text-center space-y-8">
                <div>
                  <h1 className="text-5xl font-bold text-blue-600 mb-4">NYSC Facilities</h1>
                  <h2 className="text-3xl font-semibold mb-2">Request Forms</h2>
                  <p className="text-xl text-gray-600">No Account Needed</p>
                </div>

                <div className="flex justify-center">
                  <div className="bg-white p-8 rounded-2xl shadow-2xl border-4 border-blue-600">
                    <QRCodeSVG
                      value={publicFormsUrl}
                      size={300}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-2xl font-semibold">Scan with your phone camera</p>
                  <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
                    <p className="text-lg mb-4 font-semibold">Available Forms:</p>
                    <ul className="text-left space-y-2 text-base max-w-2xl mx-auto">
                      <li>• Key & Elevator Pass Requests</li>
                      <li>• Major Work Requests (Outlets, Flooring, Painting)</li>
                      <li>• Facility Change Documentation</li>
                      <li>• General Facility Requests</li>
                    </ul>
                  </div>
                </div>

                <div className="border-t-2 border-gray-300 pt-6 space-y-2">
                  <p className="text-lg font-semibold">Or visit:</p>
                  <p className="text-xl font-mono text-blue-600">{publicFormsUrl}</p>
                  <p className="text-base text-gray-600 mt-4">Email: facilities@nysc.gov | Phone: (555) 123-4567</p>
                </div>
              </div>
            </div>
          </div>

          {/* Preview of Poster */}
          <Card className="print:hidden">
            <CardContent className="pt-6">
              <div className="bg-white p-8 text-black border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center space-y-6 scale-50 origin-top">
                  <div>
                    <h1 className="text-5xl font-bold text-blue-600 mb-4">NYSC Facilities</h1>
                    <h2 className="text-3xl font-semibold mb-2">Request Forms</h2>
                    <p className="text-xl text-gray-600">No Account Needed</p>
                  </div>

                  <div className="flex justify-center">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl border-4 border-blue-600">
                      <QRCodeSVG
                        value={publicFormsUrl}
                        size={300}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-2xl font-semibold">Scan with your phone camera</p>
                    <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
                      <p className="text-lg mb-4 font-semibold">Available Forms:</p>
                      <ul className="text-left space-y-2 text-base max-w-2xl mx-auto">
                        <li>• Key & Elevator Pass Requests</li>
                        <li>• Major Work Requests (Outlets, Flooring, Painting)</li>
                        <li>• Facility Change Documentation</li>
                        <li>• General Facility Requests</li>
                      </ul>
                    </div>
                  </div>

                  <div className="border-t-2 border-gray-300 pt-6 space-y-2">
                    <p className="text-lg font-semibold">Or visit:</p>
                    <p className="text-xl font-mono text-blue-600">{publicFormsUrl}</p>
                    <p className="text-base text-gray-600 mt-4">Email: facilities@nysc.gov | Phone: (555) 123-4567</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center mt-4">
                Preview of printable poster (scaled down)
              </p>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">How to Use:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li><strong>Download QR Code:</strong> Save as image for digital use or printing</li>
                <li><strong>Print Poster:</strong> Full-size poster with QR code and instructions</li>
                <li><strong>Post in Building:</strong> Place near entrances, elevators, or facilities office</li>
                <li><strong>Share Link:</strong> Copy the URL to share via email or messaging</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
