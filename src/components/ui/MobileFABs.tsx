import React from "react";
import { PlusCircle, KeyRound } from "lucide-react";

interface MobileFABsProps {
  onRequestKey: () => void;
  onReportIssue: () => void;
}

export const MobileFABs: React.FC<MobileFABsProps> = ({ onRequestKey, onReportIssue }) => {
  return (
    <div className="fixed bottom-20 right-4 flex flex-col gap-3 z-50 md:hidden pb-safe">
      <button
        aria-label="Request Key"
        className="bg-primary text-primary-foreground rounded-full shadow-lg w-14 h-14 flex items-center justify-center active:scale-95 transition-all duration-200 hover:shadow-xl"
        onClick={onRequestKey}
      >
        <KeyRound className="w-6 h-6" />
      </button>
      <button
        aria-label="Report Issue"
        className="bg-destructive text-destructive-foreground rounded-full shadow-lg w-14 h-14 flex items-center justify-center active:scale-95 transition-all duration-200 hover:shadow-xl"
        onClick={onReportIssue}
      >
        <PlusCircle className="w-6 h-6" />
      </button>
    </div>
  );
};
