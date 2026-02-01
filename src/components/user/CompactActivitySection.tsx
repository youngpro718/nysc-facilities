/**
 * CompactActivitySection - Tab-based activity viewer for the user dashboard
 * 
 * Shows supplies, issues, and keys in a clean tabbed interface:
 * - Horizontal tab buttons with counts
 * - Single content area that switches based on active tab
 * - Progress indicators for supplies
 * - Quick links to detailed pages
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Package, 
  Wrench, 
  Key,
  ChevronRight,
  AlertCircle,
  Clock,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Status to progress mapping for supplies
const STATUS_PROGRESS: Record<string, number> = {
  'pending': 10,
  'approved': 25,
  'picking': 50,
  'ready': 90,
  'fulfilled': 100,
  'completed': 100,
};

interface SupplyRequest {
  id: string;
  title?: string;
  status: string;
  created_at: string;
  items?: Array<{ name?: string; quantity?: number }>;
}

interface Issue {
  id: string;
  title: string;
  status: string;
  priority: string;
  description?: string;
}

interface CompactActivitySectionProps {
  supplyRequests: SupplyRequest[];
  issues: Issue[];
  keysHeld: number;
  pendingKeyRequests: number;
  userId?: string;
  className?: string;
}

export function CompactActivitySection({
  supplyRequests,
  issues,
  keysHeld,
  pendingKeyRequests,
  userId,
  className,
}: CompactActivitySectionProps) {
  const navigate = useNavigate();
  
  // Calculate counts
  const activeSupplies = supplyRequests.filter(
    r => !['fulfilled', 'rejected', 'cancelled', 'completed'].includes(r.status)
  );
  const readyForPickup = supplyRequests.filter(r => r.status === 'ready');
  const openIssues = issues.filter(i => i.status === 'open' || i.status === 'in_progress');

  // Determine default tab based on what needs attention
  const getDefaultTab = () => {
    if (readyForPickup.length > 0) return 'supplies';
    if (openIssues.length > 0) return 'issues';
    if (activeSupplies.length > 0) return 'supplies';
    return 'supplies';
  };

  const [activeTab, setActiveTab] = useState(getDefaultTab());

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending Review';
      case 'approved': return 'Approved';
      case 'picking': return 'Being Picked';
      case 'ready': return 'Ready for Pickup';
      case 'fulfilled': return 'Completed';
      default: return status;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'ready': return 'default';
      case 'picking': return 'secondary';
      case 'pending': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">My Activity</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={() => navigate('/my-activity')}
          >
            View All
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3 h-auto p-1">
            <TabsTrigger 
              value="supplies" 
              className="flex items-center gap-1.5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Supplies</span>
              {activeSupplies.length > 0 && (
                <Badge 
                  variant={readyForPickup.length > 0 ? "destructive" : "secondary"} 
                  className="h-5 min-w-5 px-1.5 text-[10px]"
                >
                  {activeSupplies.length}
                </Badge>
              )}
            </TabsTrigger>
            
            <TabsTrigger 
              value="issues"
              className="flex items-center gap-1.5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Wrench className="h-4 w-4" />
              <span className="hidden sm:inline">Issues</span>
              {openIssues.length > 0 && (
                <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-[10px]">
                  {openIssues.length}
                </Badge>
              )}
            </TabsTrigger>
            
            <TabsTrigger 
              value="keys"
              className="flex items-center gap-1.5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Key className="h-4 w-4" />
              <span className="hidden sm:inline">Keys</span>
              {(keysHeld > 0 || pendingKeyRequests > 0) && (
                <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-[10px]">
                  {keysHeld + pendingKeyRequests}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Supplies Tab */}
          <TabsContent value="supplies" className="mt-3">
            {activeSupplies.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No active supply requests</p>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="mt-1"
                  onClick={() => navigate('/request')}
                >
                  Request Supplies
                </Button>
              </div>
            ) : (
              <ScrollArea className={activeSupplies.length > 4 ? "h-[280px]" : undefined}>
                <div className="space-y-3">
                  {activeSupplies.map((request) => {
                    const progress = STATUS_PROGRESS[request.status] || 0;
                    const isReady = request.status === 'ready';
                    const itemCount = request.items?.length || 0;
                    const firstItem = request.items?.[0]?.name || 'Supply Request';
                    
                    return (
                      <div 
                        key={request.id}
                        className={cn(
                          "border rounded-lg p-3 transition-colors",
                          isReady && "border-primary bg-primary/5 ring-1 ring-primary/20"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">
                              {request.title || firstItem}
                              {itemCount > 1 && (
                                <span className="text-muted-foreground ml-1">
                                  +{itemCount - 1} more
                                </span>
                              )}
                            </p>
                          </div>
                          <Badge 
                            variant={getStatusVariant(request.status)}
                            className={cn(
                              "flex-shrink-0 text-xs",
                              isReady && "animate-pulse"
                            )}
                          >
                            {isReady && <AlertCircle className="h-3 w-3 mr-1" />}
                            {getStatusLabel(request.status)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={progress} className="h-1.5 flex-1" />
                          <span className="text-xs text-muted-foreground w-8 text-right">
                            {progress}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          {/* Issues Tab */}
          <TabsContent value="issues" className="mt-3">
            {issues.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle className="h-10 w-10 mx-auto mb-2 opacity-40 text-green-500" />
                <p className="text-sm">No reported issues</p>
                <p className="text-xs mt-1">All clear!</p>
              </div>
            ) : (
              <ScrollArea className={issues.length > 4 ? "h-[280px]" : undefined}>
                <div className="space-y-2">
                  {issues.slice(0, 8).map((issue) => (
                    <div 
                      key={issue.id}
                      className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{issue.title}</p>
                          {issue.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                              {issue.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {issue.priority === 'urgent' || issue.priority === 'high' ? (
                            <Badge variant="destructive" className="text-xs">
                              {issue.priority}
                            </Badge>
                          ) : null}
                          <Badge 
                            variant={issue.status === 'open' ? 'outline' : 'secondary'}
                            className="text-xs"
                          >
                            {issue.status === 'in_progress' ? (
                              <><Clock className="h-3 w-3 mr-1" />In Progress</>
                            ) : (
                              issue.status
                            )}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                  {issues.length > 8 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full text-xs"
                      onClick={() => navigate('/my-issues')}
                    >
                      View {issues.length - 8} more issues
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          {/* Keys Tab */}
          <TabsContent value="keys" className="mt-3">
            <div className="space-y-3">
              {/* Summary stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-primary">{keysHeld}</div>
                  <div className="text-xs text-muted-foreground">Keys Held</div>
                </div>
                <div className="border rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-amber-500">{pendingKeyRequests}</div>
                  <div className="text-xs text-muted-foreground">Pending Requests</div>
                </div>
              </div>
              
              {keysHeld === 0 && pendingKeyRequests === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  <Key className="h-10 w-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No keys assigned</p>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate('/my-keys')}
                >
                  View Key Assignments
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
