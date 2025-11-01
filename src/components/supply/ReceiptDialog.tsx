import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SupplyOrderReceipt } from './SupplyOrderReceipt';
import type { ReceiptData } from '@/types/receipt';
import { toast } from 'sonner';

interface ReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receiptData: ReceiptData;
}

export function ReceiptDialog({ open, onOpenChange, receiptData }: ReceiptDialogProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    toast.info('PDF download feature coming soon');
  };

  const handleEmail = () => {
    toast.info('Email feature coming soon');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Supply Order Receipt</DialogTitle>
        </DialogHeader>
        <SupplyOrderReceipt 
          receiptData={receiptData}
          onPrint={handlePrint}
          onDownload={handleDownload}
          onEmail={handleEmail}
        />
      </DialogContent>
    </Dialog>
  );
}
