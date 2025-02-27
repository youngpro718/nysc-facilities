import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RelocationsDashboard } from "@/components/relocations/dashboard/RelocationsDashboard";
export function Relocations() {
  return <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Relocations Dashboard</h1>
      <ErrorBoundary>
        <RelocationsDashboard />
      </ErrorBoundary>
    </div>;
}
export default Relocations;