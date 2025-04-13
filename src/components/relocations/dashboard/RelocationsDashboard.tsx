
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useRelocations } from "../hooks/useRelocations";
import { useAvailability } from "../hooks/useAvailability";
import { format, addDays, parseISO, differenceInDays } from "date-fns";
import { AvailabilityCalendar } from "@/components/relocations/dashboard/AvailabilityCalendar";
import { WorkAssignmentsList } from "@/components/relocations/dashboard/WorkAssignmentsList";
import { 
  PlusCircle, 
  ArrowUpRight, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight,
  ClipboardList,
  FileText
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

export function RelocationsDashboard() {
  const navigate = useNavigate();
  const [mainTab, setMainTab] = useState("relocations");
  const [courtTermsTab, setCourtTermsTab] = useState("current");
  const [relocationsTab, setRelocationsTab] = useState("active");
  const [dateFilter, setDateFilter] = useState<"today" | "thisWeek" | "nextWeek" | "all">("today");
  const [viewMode, setViewMode] = useState<"cards" | "calendar" | "timeline">("cards");
  
  // Handle relocations data
  const { relocations, isLoading, isError } = useRelocations({
    status: relocationsTab === "all" ? undefined : relocationsTab === "active" ? "active" : undefined
  });
  
  // Get rooms that are currently under relocation
  const activeRoomIds = useMemo(() => {
    return relocations
      .filter(r => r.status === "active")
      .map(r => r.temporary_room?.id || "")
      .filter(Boolean);
  }, [relocations]);
  
  // Calculate date range based on filter
  const today = new Date();
  const dateRange = useMemo(() => {
    const startDate = format(today, 'yyyy-MM-dd');
    let endDate;
    
    switch (dateFilter) {
      case "today":
        endDate = startDate;
        break;
      case "thisWeek":
        endDate = format(addDays(today, 7), 'yyyy-MM-dd');
        break;
      case "nextWeek":
        endDate = format(addDays(today, 14), 'yyyy-MM-dd');
        break;
      case "all":
        endDate = format(addDays(today, 30), 'yyyy-MM-dd');
        break;
      default:
        endDate = format(addDays(today, 7), 'yyyy-MM-dd');
    }
    
    return { startDate, endDate };
  }, [dateFilter, today]);
  
  // Handle availability data
  const { 
    availability, 
    multiRoomAvailability,
    isLoading: isLoadingAvailability 
  } = useAvailability({
    roomIds: activeRoomIds,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate
  });

  // Handle view details click
  const handleViewDetails = (id: string) => {
    navigate(`/relocations/${id}`);
  };

  // Handle create relocation click
  const handleCreateRelocation = () => {
    navigate("/relocations/create");
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "scheduled":
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500">Scheduled</Badge>;
      case "completed":
        return <Badge className="bg-blue-500">Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Temporary Relocations</h1>
          <Button disabled>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Relocation
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
            <CardDescription>Please wait while we load the relocations data.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-40 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Temporary Relocations</h1>
          <Button onClick={handleCreateRelocation}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Relocation
          </Button>
        </div>
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-500">Error Loading Relocations</CardTitle>
            <CardDescription>
              There was a problem loading the relocations data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Please try refreshing the page or contact support if the problem persists.</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Courtroom Relocations & Availability</h1>
        <Button onClick={handleCreateRelocation}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Relocation
        </Button>
      </div>
      
      {/* Main tabs for different views */}
      <Tabs defaultValue="relocations" value={mainTab} onValueChange={setMainTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="relocations">Relocations</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="work">Work Assignments</TabsTrigger>
          <TabsTrigger value="court-terms">Court Terms</TabsTrigger>
        </TabsList>
        
        {/* Relocations Tab */}
        <TabsContent value="relocations" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Courtroom Relocations</h2>
              <p className="text-sm text-muted-foreground">Manage active and scheduled relocations</p>
            </div>
            <Select value={viewMode} onValueChange={(value: "cards" | "calendar" | "timeline") => setViewMode(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="View Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cards">Card View</SelectItem>
                <SelectItem value="calendar">Calendar View</SelectItem>
                <SelectItem value="timeline">Timeline View</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Tabs defaultValue="active" value={relocationsTab} onValueChange={setRelocationsTab}>
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="all">All Relocations</TabsTrigger>
            </TabsList>
        
        <TabsContent value="active" className="space-y-4">
          {relocations.filter(r => r.status === "active").length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Active Relocations</CardTitle>
                <CardDescription>
                  There are currently no active relocations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Create a new relocation to get started.</p>
              </CardContent>
              <CardFooter>
                <Button onClick={handleCreateRelocation}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Relocation
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {relocations
                .filter(relocation => relocation.status === "active")
                .map(relocation => (
                  <Card key={relocation.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {relocation.original_room?.name || "Unknown Room"}
                          </CardTitle>
                          <CardDescription>
                            Relocated to: {relocation.temporary_room?.name || "Unknown Room"}
                          </CardDescription>
                        </div>
                        {getStatusBadge(relocation.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Start Date:</span>
                          <span>{format(new Date(relocation.start_date), "MMM d, yyyy")}</span>
                        </div>
                        {relocation.end_date && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">End Date:</span>
                            <span>{format(new Date(relocation.end_date), "MMM d, yyyy")}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Reason:</span>
                          <span className="text-right max-w-[200px] truncate">{relocation.reason}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => handleViewDetails(relocation.id)}
                      >
                        View Details
                        <ArrowUpRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
            </div>
          )}
          </TabsContent>
          
          <TabsContent value="all" className="space-y-4">
            {relocations.length === 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>No Relocations Found</CardTitle>
                  <CardDescription>
                    There are no relocations in the system.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Create a new relocation to get started.</p>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleCreateRelocation}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Relocation
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {relocations.map(relocation => (
                  <Card key={relocation.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {relocation.original_room?.name || "Unknown Room"}
                          </CardTitle>
                          <CardDescription>
                            Relocated to: {relocation.temporary_room?.name || "Unknown Room"}
                          </CardDescription>
                        </div>
                        {getStatusBadge(relocation.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Start Date:</span>
                          <span>{format(new Date(relocation.start_date), "MMM d, yyyy")}</span>
                        </div>
                        {relocation.end_date && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">End Date:</span>
                            <span>{format(new Date(relocation.end_date), "MMM d, yyyy")}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Reason:</span>
                          <span className="text-right max-w-[200px] truncate">{relocation.reason}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => handleViewDetails(relocation.id)}
                      >
                        View Details
                        <ArrowUpRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </TabsContent>
      
      {/* Availability Tab */}
      <TabsContent value="availability" className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Courtroom Availability</h2>
            <p className="text-sm text-muted-foreground">Track when courtrooms are available for work</p>
          </div>
          <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="thisWeek">This Week</SelectItem>
              <SelectItem value="nextWeek">Next Week</SelectItem>
              <SelectItem value="all">Next 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {isLoadingAvailability ? (
          <Card>
            <CardHeader>
              <CardTitle>Loading Availability</CardTitle>
              <CardDescription>Please wait while we calculate courtroom availability.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-40 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            </CardContent>
          </Card>
        ) : activeRoomIds.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Active Relocations</CardTitle>
              <CardDescription>
                There are no active relocations to display availability for.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Create and activate a relocation to see courtroom availability.</p>
            </CardContent>
            <CardFooter>
              <Button onClick={handleCreateRelocation}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Relocation
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Showing availability for {activeRoomIds.length} active courtroom relocations.
            </p>
            
            {/* Placeholder for the availability component. We'll implement this separately. */}
            <Card>
              <CardHeader>
                <CardTitle>Availability Calendar</CardTitle>
                <CardDescription>
                  Green slots are available for work, red slots have court sessions, blue slots have scheduled work.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center p-8 border-2 border-dashed rounded-md">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="mt-2 font-semibold">Calendar View Coming Soon</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    The detailed availability calendar will be implemented separately.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </TabsContent>
      
      {/* Work Assignments Tab */}
      <TabsContent value="work" className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Work Assignments</h2>
            <p className="text-sm text-muted-foreground">Manage work crews and assignments for relocations</p>
          </div>
          <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="thisWeek">This Week</SelectItem>
              <SelectItem value="nextWeek">Next Week</SelectItem>
              <SelectItem value="all">All Assignments</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {isLoadingAvailability ? (
          <Card>
            <CardHeader>
              <CardTitle>Loading Work Assignments</CardTitle>
              <CardDescription>Please wait while we load work assignments.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-40 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            </CardContent>
          </Card>
        ) : activeRoomIds.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Active Relocations</CardTitle>
              <CardDescription>
                There are no active relocations to display work assignments for.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Create and activate a relocation to schedule work assignments.</p>
            </CardContent>
            <CardFooter>
              <Button onClick={handleCreateRelocation}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Relocation
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between">
              <p className="text-sm text-muted-foreground">
                Showing work assignments for {activeRoomIds.length} active courtroom relocations.
              </p>
              <Button variant="outline" size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Assignment
              </Button>
            </div>
            
            {/* Placeholder for the work assignments component. We'll implement this separately. */}
            <Card>
              <CardHeader>
                <CardTitle>Work Assignments</CardTitle>
                <CardDescription>
                  Schedule and track work assignments for courtroom relocations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center p-8 border-2 border-dashed rounded-md">
                  <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="mt-2 font-semibold">Work Assignments View Coming Soon</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    The detailed work assignment management will be implemented separately.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </TabsContent>
      
      {/* Court Terms Tab */}
      <TabsContent value="court-terms" className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Court Term Schedule</h2>
            <p className="text-sm text-muted-foreground">View and manage court term assignments</p>
          </div>
          <Button onClick={() => navigate("/court-terms")}>
            <FileText className="mr-2 h-4 w-4" />
            View Full Schedule
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Current Court Term</CardTitle>
            <CardDescription>
              Information about the active court term and room assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm leading-6">
                The court term schedule system allows you to track which judges and court parts are
                assigned to specific rooms during each term period. This information is critical for
                planning relocations and understanding potential conflicts.
              </p>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Room Assignments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">View which rooms are assigned to specific court parts in the current term</p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => navigate("/court-terms")}>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      View Assignments
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Relocation Planning</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Check for conflicts between planned relocations and term assignments</p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => navigate("/court-terms")}>
                      <Calendar className="mr-2 h-4 w-4" />
                      Plan With Term Schedule
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button className="w-full" onClick={() => navigate("/court-terms")}>
              View Term Schedule
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
  );
}

