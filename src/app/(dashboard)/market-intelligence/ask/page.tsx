/**
 * Ask AI Page - Server Component Wrapper
 *
 * Route: /market-intelligence/ask
 * Renders the chat interface for asking questions about market intelligence.
 *
 * Story 15.3: Ask AI Chat Interface
 */

import { AskPageClient } from './AskPageClient';

export const metadata = {
  title: 'Ask AI | Market Intelligence',
  description: 'Ask questions about market intelligence using AI',
};

export default function AskPage() {
  return <AskPageClient />;
}
