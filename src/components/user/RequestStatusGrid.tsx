import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  Wrench, 
  Key,
  ChevronRight,
  AlertCircle,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RequestStatusGridProps {
  activeSupplyRequests: number;
  readyForPickup: number;
  openIssues: number;
  inProgressIssues: number;
  keysHeld: number;
  pendingKeyRequests: number;
  onViewSupplies?: () => void;
  onViewIssues?: () => void;
  onViewKeys?: () => void;
}

export function RequestStatusGrid({
  activeSupplyRequests,
  readyForPickup,
  openIssues,
  inProgressIssues,
  keysHeld,
  pendingKeyRequests,
  onViewSupplies,
  onViewIssues,
  onViewKeys,
}: RequestStatusGridProps) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      {/* Supply Requests Card */}
      <Card 
        className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/30 ${
          readyForPickup > 0 ? 'border-warning bg-warning/5 ring-2 ring-warning/30' : ''
        }`}
        onClick={onViewSupplies}
      >
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            {readyForPickup > 0 && (
              <Badge variant="default" className="bg-warning text-warning-foreground animate-pulse">
                <AlertCircle className="h-3 w-3 mr-1" />
                Pickup Ready
              </Badge>
            )}
          </div>
          
          <div className="space-y-1">
            <div className="text-3xl font-bold">{activeSupplyRequests}</div>
            <div className="text-sm text-muted-foreground">Active Requests</div>
          </div>
          
          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
            {readyForPickup > 0 ? (
              <span className="text-warning-foreground font-medium">
                {readyForPickup} ready for pickup
              </span>
            ) : activeSupplyRequests > 0 ? (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                In progress
              </span>
            ) : (
              <span>No active requests</span>
            )}
            <ChevronRight className="h-3 w-3 ml-auto" />
          </div>
        </CardContent>
      </Card>

      {/* Issues Card */}
      <Card 
        className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
        onClick={onViewIssues}
      >
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Wrench className="h-5 w-5 text-orange-600" />
            </div>
            {openIssues > 0 && (
              <Badge variant="outline" className="border-orange-500/50 text-orange-600">
                {openIssues} open
              </Badge>
            )}
          </div>
          
          <div className="space-y-1">
            <div className="text-3xl font-bold">{openIssues + inProgressIssues}</div>
            <div className="text-sm text-muted-foreground">Reported Issues</div>
          </div>
          
          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
            {inProgressIssues > 0 ? (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {inProgressIssues} in progress
              </span>
            ) : openIssues > 0 ? (
              <span>Awaiting response</span>
            ) : (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-3 w-3" />
                All resolved
              </span>
            )}
            <ChevronRight className="h-3 w-3 ml-auto" />
          </div>
        </CardContent>
      </Card>

      {/* Keys Card */}
      <Card 
        className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
        onClick={onViewKeys}
      >
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Key className="h-5 w-5 text-green-600" />
            </div>
            {pendingKeyRequests > 0 && (
              <Badge variant="outline" className="border-yellow-500/50 text-yellow-600">
                {pendingKeyRequests} pending
              </Badge>
            )}
          </div>
          
          <div className="space-y-1">
            <div className="text-3xl font-bold">{keysHeld}</div>
            <div className="text-sm text-muted-foreground">Keys Held</div>
          </div>
          
          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
            {pendingKeyRequests > 0 ? (
              <span>{pendingKeyRequests} request{pendingKeyRequests !== 1 ? 's' : ''} pending</span>
            ) : keysHeld > 0 ? (
              <span>View assignments</span>
            ) : (
              <span>No keys assigned</span>
            )}
            <ChevronRight className="h-3 w-3 ml-auto" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
