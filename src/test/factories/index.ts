/**
 * Test Factories
 *
 * Centralized mock data factories for testing.
 * Import from '@/test/factories' for consistent test data.
 *
 * @example
 * import { createMockQuestion, createMockDecision } from '@/test/factories';
 */

export {
  createMockDecision,
  createMockDecisionWithConstraints,
} from './decision';

export {
  createMockQuestion,
  createMockQuestionReadyForKel,
  createMockStaleQuestion,
} from './question';

export { createMockEvidence, createMockEvidenceWithDetails } from './evidence';
