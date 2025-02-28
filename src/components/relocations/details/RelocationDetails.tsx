
import { useRelocationDetails } from "../hooks/useRelocations";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, AlertTriangle, Clock, CheckCircle, Building } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface RelocationDetailsProps {
  id: string;
}

export function RelocationDetails({ id }: RelocationDetailsProps) {
  const { relocation, isLoading, isError } = useRelocationDetails(id);

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading relocation details...</div>;
  }

  if (isError || !relocation) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mt-4">
        <h3 className="text-lg font-medium">Error Loading Relocation</h3>
        <p>Unable to load the relocation details. The ID may be invalid or the relocation may not exist.</p>
        <Button asChild className="mt-4" variant="outline">
          <Link to="/relocations">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Relocations
          </Link>
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" /> Scheduled</Badge>;
      case 'active':
        return <Badge className="bg-blue-500 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Active</Badge>;
      case 'completed':
        return <Badge className="bg-green-500 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link to="/relocations">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Relocations
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Relocation Details</h1>
        </div>
        <div>
          {getStatusBadge(relocation.status)}
        </div>
      </div>

      <Card className="bg-card shadow-md">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Original Room Card */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-medium">
                <Building className="h-5 w-5 text-muted-foreground" />
                <h2>Original Room</h2>
              </div>
              <Card className="bg-muted/30 border-muted">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <p className="text-lg font-medium">{relocation.original_room?.name || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">
                      {relocation.original_room?.floors?.buildings?.name}, {relocation.original_room?.floors?.name}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Temporary Room Card */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-medium">
                <Building className="h-5 w-5 text-muted-foreground" />
                <h2>Temporary Room</h2>
              </div>
              <Card className="bg-muted/30 border-muted">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <p className="text-lg font-medium">{relocation.temporary_room?.name || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">
                      {relocation.temporary_room?.floors?.buildings?.name}, {relocation.temporary_room?.floors?.name}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Relocation Details */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium">Relocation Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{relocation.relocation_type}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Created At</p>
                  <p className="font-medium">{formatDate(relocation.created_at)}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Reason</p>
                <p className="font-medium">{relocation.reason || 'No reason provided'}</p>
              </div>
            </div>

            {/* Schedule */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                Schedule
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">{formatDate(relocation.start_date)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-medium">{formatDate(relocation.end_date)}</p>
                </div>
                {relocation.actual_end_date && (
                  <div className="space-y-1 col-span-2">
                    <p className="text-sm text-muted-foreground">Actual End Date</p>
                    <p className="font-medium">{formatDate(relocation.actual_end_date)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {relocation.notes && (
            <>
              <Separator className="my-6" />
              <div className="space-y-2">
                <h2 className="text-lg font-medium">Notes</h2>
                <div className="bg-muted/30 p-4 rounded-md text-muted-foreground">
                  {relocation.notes}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
