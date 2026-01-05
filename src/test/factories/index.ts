/**
 * Test Factories
 *
 * Centralized mock data factories for testing.
 * Import from '@/test/factories' for consistent test data.
 *
 * @example
 * import { createMockQuestion, createMockDecision, createMockCompetitor } from '@/test/factories';
 */

// Decision factories
export { createMockDecision, createMockDecisionWithConstraints } from './decision';

// Question factories
export {
  createMockQuestion,
  createMockQuestionReadyForKel,
  createMockStaleQuestion,
} from './question';

// Evidence factories
export { createMockEvidence, createMockEvidenceWithDetails } from './evidence';

// Competitor factories
export {
  createMockCompetitor,
  createMockKelPosition,
  createMockCompetitorList,
} from './competitor';

// Milestone factories
export {
  createMockMilestone,
  createMockMilestoneInProgress,
  createMockMilestoneComplete,
  createMockMilestoneNote,
} from './milestone';

// Profile factories
export {
  createMockProfile,
  createMockMahoProfile,
  createMockKelProfile,
} from './profile';
