/**
 * Empty State Components
 *
 * Components shown when a list or view has no data.
 * Every list should have a corresponding empty state.
 *
 * @example
 * import { EmptyState } from '@/components/empty-states';
 * import { FileText } from 'lucide-react';
 *
 * {items.length === 0 ? (
 *   <EmptyState
 *     icon={FileText}
 *     message="No items found"
 *     testId="items-empty-state"
 *   />
 * ) : (
 *   <ItemList items={items} />
 * )}
 */

export { EmptyState } from './EmptyState';
