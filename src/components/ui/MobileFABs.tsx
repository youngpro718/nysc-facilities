import React from "react";
import { PlusCircle, KeyRound } from "lucide-react";

interface MobileFABsProps {
  onRequestKey: () => void;
  onReportIssue: () => void;
}

export const MobileFABs: React.FC<MobileFABsProps> = ({ onRequestKey, onReportIssue }) => {
  return (
    <div className="fixed bottom-20 right-4 flex flex-col gap-4 z-50 md:hidden">
      <button
        aria-label="Request Key"
        className="bg-primary text-white rounded-full shadow-lg w-14 h-14 flex items-center justify-center active:scale-95 transition"
        onClick={onRequestKey}
      >
        <KeyRound className="w-7 h-7" />
      </button>
      <button
        aria-label="Report Issue"
        className="bg-destructive text-white rounded-full shadow-lg w-14 h-14 flex items-center justify-center active:scale-95 transition"
        onClick={onReportIssue}
      >
        <PlusCircle className="w-7 h-7" />
      </button>
    </div>
  );
};
