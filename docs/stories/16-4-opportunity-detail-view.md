# Story 16-4: Opportunity Detail View

## Story

**As a** user viewing an AI-generated opportunity,
**I want to** see the full details including supporting evidence with links to source entities,
**So that I** can evaluate the opportunity and take action on promising ones.

## Status

**Status:** done
**Assigned:** Dev Agent
**Sprint:** Current
**Code Review:** Passed (2026-01-14) - 5 issues found and fixed
**Completed:** 2026-01-14

## Acceptance Criteria

1. **Detail page route** - `/market-intelligence/opportunities/[id]` renders opportunity details
2. **Header with metadata** - Shows title, category badge, and back navigation
3. **Description section** - Displays full opportunity description
4. **Confidence display** - Shows confidence score with level indicator (high/medium/low)
5. **Supporting evidence** - Lists evidence cards with entity type, relevance score, excerpt
6. **Entity links** - Evidence cards link to respective entity pages (companies, products, research)
7. **Action button** - "Mark as Actionable" button updates status and sets reviewed timestamp

## Implementation

### Files Created/Modified

#### Hooks
- `src/hooks/opportunities/useOpportunity.ts` - Fetches single opportunity by ID
- `src/hooks/opportunities/useUpdateOpportunityStatus.ts` - Mutation for status updates with markReviewed
- `src/hooks/opportunities/index.ts` - Re-exports hooks

#### Components
- `src/components/opportunities/SupportingEvidenceSection.tsx` - Evidence display with entity links
- `src/components/opportunities/OpportunityActions.tsx` - Action buttons (Mark as Actionable)
- `src/components/opportunities/index.ts` - Re-exports components

#### Pages
- `src/app/(dashboard)/market-intelligence/opportunities/[id]/page.tsx` - Server component with Suspense
- `src/app/(dashboard)/market-intelligence/opportunities/[id]/OpportunityDetailClient.tsx` - Client component with data fetching

### Test Files Created
- `src/hooks/opportunities/useOpportunity.test.tsx` (3 tests)
- `src/hooks/opportunities/useUpdateOpportunityStatus.test.tsx` (8 tests)
- `src/components/opportunities/SupportingEvidenceSection.test.tsx` (10 tests)
- `src/components/opportunities/OpportunityActions.test.tsx` (6 tests)
- `src/app/(dashboard)/market-intelligence/opportunities/[id]/OpportunityDetailClient.test.tsx` (23 tests)

## Technical Notes

### Pattern Decisions
- **JSONB parsing**: SupportingEvidenceSection receives raw `Json` type from database and validates/parses internally
- **Type guard pattern**: Uses `isValidEvidence()` function for runtime validation of JSONB data
- **Touch targets**: All interactive elements have 48px minimum height for mobile accessibility
- **Responsive detail sections**: Uses DetailSection component which renders both mobile accordion and desktop expanded views

### Entity URL Mapping
```typescript
const routes = {
  company: '/market-intelligence/companies',
  product: '/market-intelligence/products',
  research: '/market-intelligence/research',
  consumer: '/market-intelligence/research',  // maps to research
  trend: '/market-intelligence/research',     // maps to research
};
```

### Status Update Flow
1. User clicks "Mark as Actionable"
2. `updateStatus` mutation updates opportunity status to 'actionable'
3. If status is 'actionable', automatically calls `markReviewed` to set timestamp
4. Both opportunity list and detail queries are invalidated

---

## Validation Report

### Test Results

| Category | Tests | Status |
|----------|-------|--------|
| useOpportunity hook | 3 | ✅ Pass |
| useUpdateOpportunityStatus hook | 8 | ✅ Pass |
| SupportingEvidenceSection component | 10 | ✅ Pass |
| OpportunityActions component | 6 | ✅ Pass |
| OpportunityDetailClient integration | 23 | ✅ Pass |
| **Story Total** | **50** | ✅ Pass |

### TypeScript Validation
- ✅ No type errors in opportunity-related files
- ✅ Proper JSONB type handling with type guards

### ESLint Validation
- ✅ No lint errors in new files
- ✅ Import order follows project conventions

### Acceptance Criteria Verification

| # | Criterion | Status | Verification |
|---|-----------|--------|--------------|
| 1 | Detail page route | ✅ | Route at `/market-intelligence/opportunities/[id]` |
| 2 | Header with metadata | ✅ | DetailPageHeader with title, category badge, back nav |
| 3 | Description section | ✅ | DetailSection with full description |
| 4 | Confidence display | ✅ | getConfidenceLevel + CONFIDENCE_COLORS styling |
| 5 | Supporting evidence | ✅ | SupportingEvidenceSection with cards |
| 6 | Entity links | ✅ | Links to companies/products/research routes |
| 7 | Action button | ✅ | OpportunityActions with status mutation |

### Build Verification
- ✅ TypeScript compilation passes
- ✅ All tests pass (107 opportunity-related tests)
- ✅ No regressions in existing functionality

---

## Code Review Fixes (2026-01-14)

Issues identified and fixed during code review:

| # | Severity | Issue | Fix Applied |
|---|----------|-------|-------------|
| M1 | Medium | Missing loading state test in OpportunityActions | Added test for isPending state |
| M2 | Medium | No toast error feedback on mutation failure | Added onError toast in useUpdateOpportunityStatus |
| M3 | Medium | Data integrity risk if markReviewed fails | Wrapped in try-catch, log but don't fail |
| M4 | Medium | No integration test for OpportunityDetailClient | Created 23-test integration suite |
| L1 | Low | Import order violation in SupportingEvidenceSection | Fixed import order (shared before ui) |

---

## Definition of Done

- [x] All acceptance criteria implemented
- [x] Unit tests written and passing (50 tests)
- [x] TypeScript types correct
- [x] ESLint passing
- [x] Code follows project patterns
- [x] Validation report generated
- [x] Code review passed (5 issues fixed)

**Ready for Review:** 2026-01-14
**Code Review Passed:** 2026-01-14
