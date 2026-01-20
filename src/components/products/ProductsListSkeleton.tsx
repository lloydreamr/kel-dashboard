/**
 * ProductsListSkeleton Component
 *
 * Loading skeleton for products list.
 * Shows 6 skeleton cards with shimmer animation.
 */

function ProductCardSkeleton() {
  return (
    <div className="border border-border rounded-lg p-4 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          {/* Product name */}
          <div className="h-5 w-3/4 rounded bg-muted" />
          {/* Company name */}
          <div className="h-4 w-1/3 rounded bg-muted" />
          {/* Price */}
          <div className="h-3 w-16 rounded bg-muted" />
        </div>
        <div className="flex flex-col gap-1 items-end">
          {/* Category badge */}
          <div className="h-5 w-16 rounded-full bg-muted" />
          {/* Price tier badge */}
          <div className="h-5 w-20 rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}

export function ProductsListSkeleton() {
  return (
    <div
      data-testid="products-list-skeleton"
      role="status"
      aria-busy="true"
      aria-label="Loading products"
      className="space-y-3"
    >
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
