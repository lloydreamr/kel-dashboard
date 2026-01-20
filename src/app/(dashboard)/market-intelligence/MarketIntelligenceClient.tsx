'use client';

/**
 * MarketIntelligenceClient Component
 *
 * Main client component for the Market Intelligence dashboard.
 * Displays knowledge coverage stats, recent AI insights, and quick navigation.
 */

import {
  BarChart3,
  Building2,
  FileText,
  HelpCircle,
  Lightbulb,
  MessageCircle,
  Package,
  Sparkles,
} from 'lucide-react';

import {
  CommandPalette,
  DashboardGrid,
  DashboardHeader,
  GlobalSearch,
  QuickNavCard,
  RecentOpportunities,
  RecentOpportunitiesSkeleton,
  StatCard,
  StatCardSkeleton,
} from '@/components/market-intelligence';
import { useCommandPalette, useDashboardStats } from '@/hooks/market-intelligence';

export function MarketIntelligenceClient() {
  const { counts, recentOpportunities, lastUpdated, isLoading, error } =
    useDashboardStats();
  const { isOpen, close } = useCommandPalette();

  // Loading state - show skeletons
  if (isLoading) {
    return (
      <main
        data-testid="mi-page-loading"
        className="container mx-auto px-4 py-6 max-w-7xl"
      >
        <div className="space-y-1 mb-8">
          <div className="h-9 w-80 rounded bg-muted animate-pulse" />
          <div className="h-5 w-48 rounded bg-muted animate-pulse" />
        </div>
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentOpportunitiesSkeleton />
            <div className="space-y-3">
              <div className="h-6 w-36 rounded bg-muted animate-pulse" />
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 rounded-lg border-2 bg-muted animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main
        data-testid="mi-page-error"
        className="container mx-auto px-4 py-6 max-w-7xl"
      >
        <DashboardHeader lastUpdated={null} />
        <div className="mt-8 rounded-lg border bg-card p-8 text-center">
          <p className="text-destructive">
            Failed to load dashboard data. Please try again.
          </p>
        </div>
      </main>
    );
  }

  // Check if we have any data at all
  const hasData =
    counts.companies > 0 || counts.products > 0 || counts.research > 0;

  // Empty state
  if (!hasData && recentOpportunities.length === 0) {
    return (
      <main
        data-testid="mi-page"
        className="container mx-auto px-4 py-6 max-w-7xl"
      >
        <DashboardHeader lastUpdated={lastUpdated} />
        <div
          data-testid="mi-empty-state"
          className="mt-8 rounded-lg border bg-card p-8 text-center"
        >
          <Lightbulb className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">No data yet</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Start adding companies, products, and research documents to build
            your market intelligence knowledge base.
          </p>
        </div>
      </main>
    );
  }

  // Main dashboard content
  return (
    <main
      data-testid="mi-page"
      className="container mx-auto px-4 py-6 max-w-7xl"
    >
      {/* Command palette dialog (Cmd/Ctrl+K) */}
      <CommandPalette open={isOpen} onOpenChange={close} />

      <div className="mb-8">
        <DashboardHeader lastUpdated={lastUpdated} />
        <GlobalSearch className="mt-4 max-w-md" />
      </div>

      <DashboardGrid
        statsContent={
          <>
            <StatCard
              title="Companies"
              count={counts.companies}
              icon={Building2}
              href="/market-intelligence/companies"
              description="Competitor profiles"
              testIdSuffix="companies"
            />
            <StatCard
              title="Products"
              count={counts.products}
              icon={Package}
              href="/market-intelligence/products"
              description="Product catalog"
              testIdSuffix="products"
            />
            <StatCard
              title="Research"
              count={counts.research}
              icon={FileText}
              href="/market-intelligence/research"
              description="Research documents"
              testIdSuffix="research"
            />
          </>
        }
        opportunitiesContent={
          <RecentOpportunities opportunities={recentOpportunities} />
        }
        navContent={
          <>
            <QuickNavCard
              title="Browse Companies"
              description="View all competitor profiles"
              icon={Building2}
              href="/market-intelligence/companies"
              testIdSuffix="companies"
            />
            <QuickNavCard
              title="Browse Products"
              description="Explore product catalog"
              icon={Package}
              href="/market-intelligence/products"
              testIdSuffix="products"
            />
            <QuickNavCard
              title="Browse Research"
              description="Access research documents"
              icon={FileText}
              href="/market-intelligence/research"
              testIdSuffix="research"
            />
            <QuickNavCard
              title="AI Opportunities"
              description="View all AI-identified insights"
              icon={Lightbulb}
              href="/market-intelligence/opportunities"
              testIdSuffix="opportunities"
            />
            <QuickNavCard
              title="Ask AI"
              description="Query your knowledge base"
              icon={MessageCircle}
              href="/market-intelligence/ask"
              testIdSuffix="ask"
            />
            <QuickNavCard
              title="Visualization"
              description="Competitor positioning chart"
              icon={BarChart3}
              href="/market-intelligence/visualization"
              testIdSuffix="visualization"
            />
            <QuickNavCard
              title="Questions"
              description="Strategic questions"
              icon={HelpCircle}
              href="/market-intelligence/questions"
              testIdSuffix="questions"
            />
            <QuickNavCard
              title="Pitch Drafts"
              description="AI-powered pitch content"
              icon={Sparkles}
              href="/market-intelligence/pitch"
              testIdSuffix="pitch"
            />
          </>
        }
      />
    </main>
  );
}
