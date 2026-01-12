// src/app/(dashboard)/market-intelligence/MarketIntelligenceClient.tsx
'use client';

export function MarketIntelligenceClient() {
  return (
    <main
      data-testid="market-intelligence-page"
      className="container mx-auto px-4 py-6 max-w-7xl"
      aria-labelledby="mi-page-title"
    >
      <header data-testid="mi-page-header" className="mb-8">
        <h1
          id="mi-page-title"
          className="text-3xl font-semibold tracking-tight"
        >
          Market Intelligence Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Philippine snack market research and competitive analysis
        </p>
      </header>

      <div
        data-testid="mi-content-area"
        className="rounded-lg border bg-card p-8 text-center"
        aria-label="Market intelligence content"
      >
        <p className="text-muted-foreground">
          Market research data, competitor analysis, and consumer insights coming soon.
        </p>
      </div>
    </main>
  );
}
