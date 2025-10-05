import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Smartphone, 
  Share2, 
  Copy, 
  Check, 
  Download,
  Mail,
  MessageSquare,
  QrCode
} from 'lucide-react';
import { toast } from 'sonner';

export default function InstallApp() {
  const [copied, setCopied] = useState(false);
  const appUrl = window.location.origin;
  const appName = "NYSC Facilities";

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Install ${appName}`);
    const body = encodeURIComponent(
      `Hi,\n\nYou can access the ${appName} app here:\n${appUrl}\n\nOn your phone:\n1. Open this link\n2. Tap the Share button\n3. Select "Add to Home Screen"\n\nBest regards`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const shareViaSMS = () => {
    const message = encodeURIComponent(
      `Access ${appName} here: ${appUrl}\n\nTap the link, then tap Share > Add to Home Screen to install.`
    );
    window.location.href = `sms:?&body=${message}`;
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: appName,
          text: `Install ${appName} on your phone`,
          url: appUrl,
        });
        toast.success('Shared successfully!');
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          toast.error('Failed to share');
        }
      }
    } else {
      toast.error('Sharing not supported on this device');
    }
  };

  const downloadQR = () => {
    const svg = document.getElementById('qr-code');
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
          a.download = `${appName.replace(/\s+/g, '-')}-QR.png`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success('QR code downloaded!');
        }
      });
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold">Install {appName}</h1>
          <p className="text-muted-foreground">
            Get quick access on your phone - no app store needed
          </p>
        </div>

        {/* QR Code Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-6 w-6" />
              Scan QR Code
            </CardTitle>
            <CardDescription>
              Open your phone's camera and point it at this code
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <QRCodeSVG
                id="qr-code"
                value={appUrl}
                size={256}
                level="H"
                includeMargin={true}
              />
            </div>
            <Button onClick={downloadQR} variant="outline" className="w-full sm:w-auto">
              <Download className="h-4 w-4 mr-2" />
              Download QR Code
            </Button>
          </CardContent>
        </Card>

        {/* Share Link Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-6 w-6" />
              Share Link
            </CardTitle>
            <CardDescription>
              Send the app link to others
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Copy Link */}
            <div className="flex gap-2">
              <Input
                value={appUrl}
                readOnly
                className="flex-1"
              />
              <Button onClick={copyToClipboard} variant="outline">
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Share Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {navigator.share && (
                <Button onClick={shareNative} variant="outline" className="w-full">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              )}
              <Button onClick={shareViaEmail} variant="outline" className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
              <Button onClick={shareViaSMS} variant="outline" className="w-full">
                <MessageSquare className="h-4 w-4 mr-2" />
                Text Message
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Installation Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-6 w-6" />
              Installation Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* iPhone Instructions */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span className="text-2xl">📱</span>
                iPhone / iPad
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Open the link in Safari browser</li>
                <li>Tap the Share button (square with arrow pointing up)</li>
                <li>Scroll down and tap "Add to Home Screen"</li>
                <li>Tap "Add" in the top right corner</li>
                <li>The app icon will appear on your home screen</li>
              </ol>
            </div>

            {/* Android Instructions */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span className="text-2xl">🤖</span>
                Android
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Open the link in Chrome browser</li>
                <li>Tap the menu button (three dots in top right)</li>
                <li>Tap "Add to Home screen" or "Install app"</li>
                <li>Tap "Add" or "Install"</li>
                <li>The app icon will appear on your home screen</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Features Card */}
        <Card>
          <CardHeader>
            <CardTitle>Why Install?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                <span>Quick access from your home screen</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                <span>Works offline - view cached data without internet</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                <span>Faster loading - no browser overhead</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                <span>Full-screen experience - no browser bars</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                <span>Receive push notifications (coming soon)</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
