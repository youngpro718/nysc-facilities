export function FixtureSkeleton() {
  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="animate-pulse space-y-4">
        <div className="h-4 w-1/3 bg-muted rounded" />
        <div className="h-6 w-2/3 bg-muted rounded" />
        <div className="flex gap-2">
          <div className="h-4 w-16 bg-muted rounded" />
          <div className="h-4 w-20 bg-muted rounded" />
        </div>
        <div className="h-24 w-full bg-muted rounded" />
        <div className="flex justify-end gap-2">
          <div className="h-8 w-20 bg-muted rounded" />
          <div className="h-8 w-24 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}
