import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Key, ShieldCheck, ShieldAlert } from "lucide-react";
import { UserAssignment } from "@/types/dashboard";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AssignedKeysCardProps {
  keys: UserAssignment[];
  onViewKey?: (keyId: string) => void;
}

export function AssignedKeysCard({ keys, onViewKey }: AssignedKeysCardProps) {
  const getKeyTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'master':
        return <ShieldCheck className="h-4 w-4 text-green-500" />;
      case 'restricted':
        return <ShieldAlert className="h-4 w-4 text-yellow-500" />;
      default:
        return <Key className="h-4 w-4 text-blue-500" />;
    }
  };

  const getKeyTypeLabel = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'master':
        return 'Master Key';
      case 'restricted':
        return 'Restricted Access';
      default:
        return 'Standard Key';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Key className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-2xl font-semibold">Assigned Keys</h2>
        </div>
        <Badge variant="outline" className="font-normal">
          {keys.length} {keys.length === 1 ? 'Key' : 'Keys'}
        </Badge>
      </div>
      
      <ScrollArea className="h-[300px] pr-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Key Details</TableHead>
              <TableHead>Access Level</TableHead>
              <TableHead>Assignment Info</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  <div className="flex flex-col items-center gap-2 py-4">
                    <Key className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No keys assigned</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              keys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{key.key_name}</span>
                      <span className="text-sm text-muted-foreground">
                        ID: {key.id.slice(0, 8)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge 
                              variant="outline" 
                              className="w-fit flex items-center gap-1"
                            >
                              {getKeyTypeIcon(key.key_type)}
                              {getKeyTypeLabel(key.key_type)}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            {key.key_type === 'master' 
                              ? 'Full access to all areas'
                              : key.key_type === 'restricted'
                              ? 'Limited access to specific areas'
                              : 'Standard access level'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span className="text-sm text-muted-foreground">
                        {key.access_areas || 'General Access'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm">
                        Assigned on {new Date(key.assigned_at).toLocaleDateString()}
                      </span>
                      {key.expiry_date && (
                        <span className="text-xs text-muted-foreground">
                          Expires: {new Date(key.expiry_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewKey?.(key.id)}
                      className="w-full"
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </Card>
  );
}
