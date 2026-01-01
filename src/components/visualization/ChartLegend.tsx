'use client';

import { Circle, Star } from 'lucide-react';

import { cn } from '@/lib/utils';

interface ChartLegendProps {
  hasKelPosition: boolean;
  categories?: string[];
  selectedCategory?: string | null;
  onCategoryClick?: (category: string | null) => void;
  isLoading?: boolean;
}

/**
 * ChartLegend Component
 *
 * Displays legend for scatter chart showing marker types and optional
 * category filters. Positioned below chart with responsive wrapping.
 *
 * AC1: Shows Circle (competitor) and Star (Kel) markers
 * AC2: Shows category labels as text (MVP: no color coding)
 * AC3: Responsive positioning below chart
 * AC4: Optional category selection (UI state only, no chart filtering)
 * AC5: Hidden during loading state
 */
export function ChartLegend({
  hasKelPosition,
  categories,
  selectedCategory,
  onCategoryClick,
  isLoading,
}: ChartLegendProps) {
  // AC5: Hide during loading
  if (isLoading) return null;

  const handleCategoryClick = (category: string) => {
    if (!onCategoryClick) return;

    // Toggle: deselect if already selected, otherwise select
    if (selectedCategory === category) {
      onCategoryClick(null);
    } else {
      onCategoryClick(category);
    }
  };

  return (
    <div
      role="group"
      aria-label="Chart legend"
      data-testid="chart-legend"
      className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 mt-4"
    >
      {/* AC1: Competitor marker - always visible */}
      <div data-testid="legend-competitor-marker" className="flex items-center gap-2 text-sm">
        <Circle className="h-4 w-4 fill-muted-foreground text-muted-foreground" />
        <span className="text-muted-foreground">Competitor</span>
      </div>

      {/* AC1: Kel marker - conditional */}
      {hasKelPosition && (
        <div data-testid="legend-kel-marker" className="flex items-center gap-2 text-sm">
          <Star className="h-4 w-4 fill-primary text-primary" />
          <span className="text-foreground">Kel Target Position</span>
        </div>
      )}

      {/* AC2 & AC4: Category filters - optional, UI state only
          NOTE: Requires both `categories` AND `onCategoryClick` to render.
          This is intentional - categories without a click handler are meaningless. */}
      {categories && categories.length > 0 && onCategoryClick && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Categories:</span>
          {categories.map((category) => {
            const isSelected = selectedCategory === category;
            return (
              <button
                key={category}
                data-testid="legend-category-filter"
                onClick={() => handleCategoryClick(category)}
                className={cn(
                  'min-h-[48px] px-3 py-2 rounded-md text-sm transition-colors',
                  'border border-border',
                  isSelected
                    ? 'bg-primary/10 text-primary font-medium border-primary'
                    : 'bg-background text-foreground hover:bg-muted'
                )}
                aria-pressed={isSelected}
              >
                {category}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
