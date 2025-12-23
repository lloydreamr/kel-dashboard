/**
 * Empty State Components
 *
 * Components shown when a list or view has no data.
 * Every list should have a corresponding empty state.
 *
 * @example
 * import { EmptyQueue } from '@/components/empty-states';
 * {items.length === 0 ? <EmptyQueue /> : <ItemList items={items} />}
 */

/** Base props for all empty state components */
export type EmptyStateProps = {
  /** Title text */
  title?: string;
  /** Description text */
  description?: string;
  /** Optional action button */
  action?: React.ReactNode;
};

// Empty state components will be added here as features are implemented
// Example: export { EmptyQueue } from './EmptyQueue';
