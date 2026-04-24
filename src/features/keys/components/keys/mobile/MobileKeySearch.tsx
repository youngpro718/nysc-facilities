import { Search, ScanLine } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface MobileKeySearchProps {
  value: string;
  onChange: (v: string) => void;
}

export function MobileKeySearch({ value, onChange }: MobileKeySearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search room, key name, or box/slot…"
        className="pl-10 pr-12 h-12 bg-card border-border rounded-xl"
      />
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10"
        onClick={() => toast.info("Barcode scanner coming soon")}
        aria-label="Scan barcode"
      >
        <ScanLine className="h-5 w-5" />
      </Button>
    </div>
  );
}
