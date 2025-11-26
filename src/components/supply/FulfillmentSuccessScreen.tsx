import { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Package, 
  TrendingDown, 
  User, 
  MapPin, 
  Clock,
  Mail,
  Printer,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface InventoryChange {
  itemName: string;
  before: number;
  after: number;
  subtracted: number;
  unit: string;
}

interface FulfillmentSuccessScreenProps {
  open: boolean;
  onClose: () => void;
  orderNumber: string;
  requesterName: string;
  deliveryLocation: string;
  inventoryChanges: InventoryChange[];
  receiptNumber: string;
  fulfilledBy: string;
  completedAt: Date;
}

export function FulfillmentSuccessScreen({
  open,
  onClose,
  orderNumber,
  requesterName,
  deliveryLocation,
  inventoryChanges,
  receiptNumber,
  fulfilledBy,
  completedAt,
}: FulfillmentSuccessScreenProps) {
  
  const printRef = useRef<HTMLDivElement>(null);

  const handleEmailReceipt = async () => {
    // Generate receipt content for email
    const receiptContent = `
Supply Order Receipt - ${receiptNumber}
========================================
Order #: ${orderNumber}
Date: ${format(completedAt, 'MMM d, yyyy h:mm a')}

Requester: ${requesterName}
Delivery Location: ${deliveryLocation}
Fulfilled By: ${fulfilledBy}

Items Fulfilled:
${inventoryChanges.map(c => `- ${c.itemName}: ${c.subtracted} ${c.unit}`).join('\n')}

Thank you for using NYSC Facilities Management.
    `.trim();

    // Try to use mailto link for email
    const subject = encodeURIComponent(`Supply Order Receipt - ${receiptNumber}`);
    const body = encodeURIComponent(receiptContent);
    const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
    
    try {
      window.open(mailtoLink, '_blank');
      toast.success("Email client opened", {
        description: "Receipt content has been prepared for sending"
      });
    } catch (error) {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(receiptContent);
      toast.success("Receipt copied to clipboard", {
        description: "You can paste this into an email"
      });
    }
  };

  const handlePrint = () => {
    // Create a printable version of the receipt
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Supply Order Receipt - ${receiptNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; }
          h1 { font-size: 24px; border-bottom: 2px solid #000; padding-bottom: 10px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .section { margin: 15px 0; }
          .label { color: #666; font-size: 12px; }
          .value { font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f5f5f5; }
          .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>Supply Order Receipt</h1>
        <div class="header">
          <div>
            <div class="label">Order Number</div>
            <div class="value">#${orderNumber}</div>
          </div>
          <div>
            <div class="label">Receipt Number</div>
            <div class="value">${receiptNumber}</div>
          </div>
        </div>
        <div class="section">
          <div class="label">Requester</div>
          <div class="value">${requesterName}</div>
        </div>
        <div class="section">
          <div class="label">Delivery Location</div>
          <div class="value">${deliveryLocation}</div>
        </div>
        <div class="section">
          <div class="label">Fulfilled By</div>
          <div class="value">${fulfilledBy}</div>
        </div>
        <div class="section">
          <div class="label">Completed At</div>
          <div class="value">${format(completedAt, 'MMM d, yyyy h:mm a')}</div>
        </div>
        <h2>Items Fulfilled</h2>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Unit</th>
            </tr>
          </thead>
          <tbody>
            ${inventoryChanges.map(c => `
              <tr>
                <td>${c.itemName}</td>
                <td>${c.subtracted}</td>
                <td>${c.unit}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          <p>NYSC Facilities Management System</p>
          <p>Generated: ${format(new Date(), 'MMM d, yyyy h:mm a')}</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      toast.success("Print dialog opened");
    } else {
      toast.error("Unable to open print window", {
        description: "Please check your popup blocker settings"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <CheckCircle className="h-6 w-6 text-green-600" />
            Order Fulfilled Successfully!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Order Number</p>
                  <p className="font-semibold text-lg">#{orderNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Receipt Number</p>
                  <p className="font-semibold text-lg">{receiptNumber}</p>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-xs">Requester</p>
                    <p className="font-medium">{requesterName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-xs">Delivery To</p>
                    <p className="font-medium">{deliveryLocation}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-xs">Fulfilled By</p>
                    <p className="font-medium">{fulfilledBy}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-xs">Completed At</p>
                    <p className="font-medium">{format(completedAt, 'MMM d, yyyy h:mm a')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Inventory Changes - THE CRITICAL PART */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Inventory Updated</h3>
              <Badge variant="secondary" className="ml-auto">
                {inventoryChanges.length} item{inventoryChanges.length !== 1 ? 's' : ''} updated
              </Badge>
            </div>

            <div className="space-y-3">
              {inventoryChanges.map((change, index) => (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-base mb-2">{change.itemName}</p>
                        
                        {/* Visual Before/After */}
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Before:</span>
                            <Badge variant="outline" className="font-mono">
                              {change.before} {change.unit}
                            </Badge>
                          </div>
                          
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">After:</span>
                            <Badge variant="secondary" className="font-mono">
                              {change.after} {change.unit}
                            </Badge>
                          </div>
                          
                          <CheckCircle className="h-4 w-4 text-green-600 ml-2" />
                        </div>

                        {/* Subtracted Amount - Highlighted */}
                        <div className="mt-2 flex items-center gap-2 bg-red-50 border border-red-200 rounded px-3 py-1.5 w-fit">
                          <TrendingDown className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-semibold text-red-700">
                            Subtracted: {change.subtracted} {change.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          {/* Actions Completed Checklist */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Actions Completed</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Order marked as fulfilled</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Inventory updated ({inventoryChanges.length} items)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Receipt generated ({receiptNumber})</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Requester will be notified</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleEmailReceipt}
              className="flex-1"
            >
              <Mail className="mr-2 h-4 w-4" />
              Email Receipt
            </Button>
            <Button
              variant="outline"
              onClick={handlePrint}
              className="flex-1"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Receipt
            </Button>
            <Button
              onClick={onClose}
              className="flex-1"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
