import { ModalFrame } from '@shared/components/common/common/ModalFrame';
import { SupplyOrderReceipt } from './SupplyOrderReceipt';
import type { ReceiptData } from '@features/supply/types/receipt';
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
    <ModalFrame
      open={open}
      onOpenChange={onOpenChange}
      title="Supply Request Receipt"
      size="xl"
    >
      <SupplyOrderReceipt
        receiptData={receiptData}
        onPrint={handlePrint}
        onDownload={handleDownload}
        onEmail={handleEmail}
      />
    </ModalFrame>
  );
}
