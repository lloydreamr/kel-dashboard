export function ScatterChartSkeleton() {
  return (
    <div
      data-testid="chart-loading-skeleton"
      className="w-full h-[400px] relative animate-pulse"
    >
      {/* Main chart area */}
      <div className="w-full h-full bg-muted rounded-lg" />
      {/* X-axis hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-48 h-4 bg-muted-foreground/20 rounded" />
      {/* Y-axis hint */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-48 bg-muted-foreground/20 rounded" />
    </div>
  );
}
