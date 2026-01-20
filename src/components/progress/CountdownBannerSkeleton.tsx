// Banner height constant to keep skeleton and actual banner in sync
const BANNER_HEIGHT = 'h-20';

export function CountdownBannerSkeleton() {
  return (
    <div
      data-testid="wofex-countdown-skeleton"
      className={`bg-muted animate-pulse rounded-lg p-4 ${BANNER_HEIGHT}`}
    >
      <div className="flex flex-col items-center justify-center h-full space-y-2">
        <div className="h-6 w-32 bg-muted-foreground/20 rounded" />
        <div className="h-4 w-24 bg-muted-foreground/20 rounded" />
      </div>
    </div>
  );
}
