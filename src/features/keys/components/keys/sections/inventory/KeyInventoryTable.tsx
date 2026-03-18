
import { Package, AlertCircle, Trash2, Shield, ShieldOff } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KeyData } from "../../types/KeyTypes";
import { KeyStockAdjustment } from "../../inventory/KeyStockAdjustment";

interface KeyInventoryTableProps {
  keys: KeyData[];
  onDeleteKey: (key: KeyData) => void;
  onToggleCaptainOfficeCopy: (keyId: string, currentStatus: boolean) => void;
}

export function KeyInventoryTable({ keys, onDeleteKey, onToggleCaptainOfficeCopy }: KeyInventoryTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Total Stock</TableHead>
            <TableHead>Available</TableHead>
            <TableHead>Captain's Office</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {keys?.map((key) => (
            <TableRow key={key.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {key.name}
                  {key.is_passkey && (
                    <Badge variant="secondary">Passkey</Badge>
                  )}
                  {key.available_quantity === 0 && (
                    <Badge variant="destructive" className="ml-2">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Out of Stock
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{key.type}</Badge>
              </TableCell>
              <TableCell>{key.total_quantity}</TableCell>
              <TableCell>
                <span className={key.available_quantity === 0 ? "text-destructive font-medium" : ""}>
                  {key.available_quantity}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleCaptainOfficeCopy(key.id, key.captain_office_copy)}
                    className={key.captain_office_copy ? "text-success" : "text-muted-foreground"}
                  >
                    {key.captain_office_copy ? (
                      <>
                        <Shield className="h-4 w-4 mr-1" />
                        Has Copy
                      </>
                    ) : (
                      <>
                        <ShieldOff className="h-4 w-4 mr-1" />
                        Missing
                      </>
                    )}
                  </Button>
                  {key.captain_office_copy && key.captain_office_assigned_date && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(key.captain_office_assigned_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={
                    key.status === "available" 
                      ? "default" 
                      : key.status === "assigned" 
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {key.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <KeyStockAdjustment keyId={key.id} keyName={key.name} />
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => onDeleteKey(key)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
