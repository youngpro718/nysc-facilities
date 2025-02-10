
// This component doesn't need props as it's static
export function DashboardHeader() {
  return (
    <div className="space-y-1">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      <p className="text-muted-foreground">
        Welcome to the Courthouse Facility Management System
      </p>
    </div>
  );
}
