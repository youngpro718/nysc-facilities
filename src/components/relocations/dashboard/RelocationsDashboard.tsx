import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useRelocations } from "../hooks/useRelocations";
import { format } from "date-fns";
import { PlusCircle, ArrowUpRight, Calendar } from "lucide-react";

export function RelocationsDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("active");
  const { relocations, isLoading, isError } = useRelocations({
    status: activeTab === "all" ? undefined : activeTab === "active" ? "active" : undefined
  });

  // Handle view details click
  const handleViewDetails = (id: string) => {
    navigate(`/relocations/${id}`);
  };

  // Handle create relocation click
  const handleCreateRelocation = () => {
    navigate("/relocations/create");
  };

  // Handle navigate to terms
  const handleGoToTerms = () => {
    navigate("/terms");
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
        <h1 className="text-2xl font-bold">Temporary Relocations</h1>
        <div className="flex gap-2">
          <Button onClick={handleGoToTerms} variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Court Terms
          </Button>
          <Button onClick={handleCreateRelocation}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Relocation
          </Button>
        </div>
      </div>

      <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
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
                            {relocation.original_room_name || "Unknown Room"}
                          </CardTitle>
                          <CardDescription>
                            Relocated to: {relocation.temporary_room_name || "Unknown Room"}
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
                          {relocation.original_room_name || "Unknown Room"}
                        </CardTitle>
                        <CardDescription>
                          Relocated to: {relocation.temporary_room_name || "Unknown Room"}
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
    </div>
  );
}
