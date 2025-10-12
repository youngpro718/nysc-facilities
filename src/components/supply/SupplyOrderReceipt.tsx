import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Receipt, Download, Printer, Mail } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { ReceiptData } from '@/types/receipt';
import { format } from 'date-fns';

interface SupplyOrderReceiptProps {
  receiptData: ReceiptData;
  onPrint?: () => void;
  onDownload?: () => void;
  onEmail?: () => void;
}

export function SupplyOrderReceipt({ 
  receiptData, 
  onPrint, 
  onDownload, 
  onEmail 
}: SupplyOrderReceiptProps) {
  const formatDate = (date: string) => {
    return format(new Date(date), 'MMM dd, yyyy h:mm a');
  };

  const getReceiptTitle = () => {
    switch (receiptData.receiptType) {
      case 'confirmation':
        return 'Order Confirmation';
      case 'pickup':
        return 'Pickup Receipt';
      case 'final':
        return 'Final Receipt';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600';
      default:
        return 'text-green-600';
    }
  };

  return (
    <Card className="p-8 max-w-4xl mx-auto print:shadow-none">
      {/* Actions - Hide when printing */}
      <div className="flex gap-2 mb-6 print:hidden">
        {onPrint && (
          <Button onClick={onPrint} variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        )}
        {onDownload && (
          <Button onClick={onDownload} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        )}
        {onEmail && (
          <Button onClick={onEmail} variant="outline" size="sm">
            <Mail className="w-4 h-4 mr-2" />
            Email
          </Button>
        )}
      </div>

      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Receipt className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">{getReceiptTitle()}</h1>
          </div>
          <p className="text-muted-foreground">Supply Request System</p>
        </div>
        <div className="text-right">
          <div className="mb-4">
            <QRCodeSVG value={receiptData.receiptNumber} size={100} />
          </div>
          <p className="text-sm font-mono font-bold">{receiptData.receiptNumber}</p>
          <p className="text-xs text-muted-foreground">
            {formatDate(receiptData.generatedAt)}
          </p>
        </div>
      </div>

      <Separator className="mb-6" />

      {/* Order Information */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">REQUESTER INFORMATION</h2>
          <div className="space-y-2">
            <p className="font-medium">{receiptData.requester.name}</p>
            <p className="text-sm text-muted-foreground">{receiptData.requester.email}</p>
            <p className="text-sm text-muted-foreground">{receiptData.requester.department}</p>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">ORDER DETAILS</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Request ID:</span>
              <span className="text-sm font-mono">{receiptData.request.id.slice(0, 8)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Title:</span>
              <span className="text-sm font-medium">{receiptData.request.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Priority:</span>
              <span className={`text-sm font-medium uppercase ${getPriorityColor(receiptData.request.priority)}`}>
                {receiptData.request.priority}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Status:</span>
              <span className="text-sm font-medium capitalize">{receiptData.request.status}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">ITEMS</h2>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 text-sm font-medium">Item</th>
                <th className="text-center p-3 text-sm font-medium">Requested</th>
                {receiptData.receiptType !== 'confirmation' && (
                  <>
                    <th className="text-center p-3 text-sm font-medium">Approved</th>
                    {receiptData.receiptType === 'final' && (
                      <th className="text-center p-3 text-sm font-medium">Fulfilled</th>
                    )}
                  </>
                )}
                <th className="text-center p-3 text-sm font-medium">Unit</th>
              </tr>
            </thead>
            <tbody>
              {receiptData.items.map((item, index) => (
                <tr key={index} className="border-t">
                  <td className="p-3 text-sm">{item.name}</td>
                  <td className="p-3 text-sm text-center">{item.quantityRequested}</td>
                  {receiptData.receiptType !== 'confirmation' && (
                    <>
                      <td className="p-3 text-sm text-center">
                        {item.quantityApproved ?? item.quantityRequested}
                      </td>
                      {receiptData.receiptType === 'final' && (
                        <td className="p-3 text-sm text-center font-medium">
                          {item.quantityFulfilled ?? item.quantityApproved ?? item.quantityRequested}
                        </td>
                      )}
                    </>
                  )}
                  <td className="p-3 text-sm text-center">{item.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Timeline */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">TIMELINE</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Submitted:</span>
            <span className="font-medium">{formatDate(receiptData.timeline.submitted)}</span>
          </div>
          {receiptData.timeline.approved && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Approved:</span>
              <span className="font-medium">{formatDate(receiptData.timeline.approved)}</span>
            </div>
          )}
          {receiptData.timeline.ready && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ready for Pickup:</span>
              <span className="font-medium">{formatDate(receiptData.timeline.ready)}</span>
            </div>
          )}
          {receiptData.timeline.completed && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Completed:</span>
              <span className="font-medium">{formatDate(receiptData.timeline.completed)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {receiptData.notes && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">NOTES</h2>
          <p className="text-sm p-3 bg-muted rounded-lg">{receiptData.notes}</p>
        </div>
      )}

      {/* Footer */}
      {receiptData.completedBy && (
        <div className="pt-6 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Completed by: {receiptData.completedBy}
          </p>
        </div>
      )}

      <div className="mt-6 pt-6 border-t">
        <p className="text-xs text-muted-foreground text-center">
          For questions or concerns, please contact the Supply Room
        </p>
      </div>
    </Card>
  );
}
