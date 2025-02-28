
import { useRelocationDetails } from "../hooks/useRelocations";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

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

  return (
    <div>
      <div className="flex items-center mb-6">
        <Button asChild variant="outline" className="mr-4">
          <Link to="/relocations">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Relocations
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Relocation Details</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-medium mb-4">Room Information</h2>
            <div className="space-y-3">
              <div>
                <span className="text-gray-500 text-sm">Original Room:</span>
                <p className="font-medium">{relocation.original_room?.name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Temporary Room:</span>
                <p className="font-medium">{relocation.temporary_room?.name || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-medium mb-4">Relocation Details</h2>
            <div className="space-y-3">
              <div>
                <span className="text-gray-500 text-sm">Status:</span>
                <p className="font-medium capitalize">{relocation.status}</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Type:</span>
                <p className="font-medium capitalize">{relocation.relocation_type}</p>
              </div>
              <div>
                <span className="text-gray-500 text-sm">Reason:</span>
                <p className="font-medium">{relocation.reason}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-medium mb-4">Schedule</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-gray-500 text-sm">Start Date:</span>
              <p className="font-medium">{new Date(relocation.start_date).toLocaleDateString()}</p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">End Date:</span>
              <p className="font-medium">{new Date(relocation.end_date).toLocaleDateString()}</p>
            </div>
            {relocation.actual_end_date && (
              <div>
                <span className="text-gray-500 text-sm">Actual End Date:</span>
                <p className="font-medium">{new Date(relocation.actual_end_date).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </div>

        {relocation.notes && (
          <div className="mt-6">
            <h2 className="text-lg font-medium mb-2">Notes</h2>
            <p className="text-gray-700">{relocation.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
