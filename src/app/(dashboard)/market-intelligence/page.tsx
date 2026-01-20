// src/app/(dashboard)/market-intelligence/page.tsx
// Note: page.tsx requires export default per Next.js convention
// This is the exception to the "named exports only" rule
import { MarketIntelligenceClient } from './MarketIntelligenceClient';

export const metadata = {
  title: 'Market Intelligence | Kel Dashboard',
  description: 'Philippine snack market research and competitive analysis',
  openGraph: {
    title: 'Market Intelligence | Kel Dashboard',
    description: 'Philippine snack market research and competitive analysis',
  },
};

export default function MarketIntelligencePage() {
  return <MarketIntelligenceClient />;
}
