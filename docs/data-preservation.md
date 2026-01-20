# Data Preservation Architecture

Documentation of the Kel Dashboard's data preservation strategy, ensuring zero data loss for critical alignment decisions.

**Last Verified:** 2026-01-01
**Story Reference:** 7.5: Data Preservation & Backup Verification

---

## NFR Compliance Summary

| NFR | Requirement | Implementation | Status |
|-----|-------------|----------------|--------|
| NFR12 | Zero data loss for decisions | Supabase PostgreSQL + RLS | ✅ Compliant |
| NFR13 | Auto-save < 5 seconds | 2000ms debounce (2s) | ✅ Compliant |
| NFR14 | Daily backups, 14-day retention | Daily backups, 7-day retention (Free tier) | ⚠️ Partial |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Next.js)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │   Zustand Store   │    │  TanStack Query  │                   │
│  │  (Session Draft)  │    │  (Server Cache)  │                   │
│  │                   │    │                   │                   │
│  │  - DraftResponse  │    │  - Questions      │                   │
│  │  - Not persisted  │    │  - Decisions      │                   │
│  │  - Cleared on     │    │  - Evidence       │                   │
│  │    refresh        │    │  - Cached from DB │                   │
│  └────────┬─────────┘    └────────┬─────────┘                   │
│           │                       │                               │
│           ▼                       ▼                               │
│  ┌────────────────────────────────────────────┐                  │
│  │            Repository Layer                 │                  │
│  │  decisionsRepo | questionsRepo | evidenceRepo                 │
│  └────────────────────────────────────────────┘                  │
│                          │                                        │
└──────────────────────────┼────────────────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Supabase Platform                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                PostgreSQL Database                       │    │
│  │  - questions, decisions, evidence tables                 │    │
│  │  - Row Level Security (RLS) policies                    │    │
│  │  - Foreign key constraints                               │    │
│  │  - Check constraints for validation                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                          │                                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Automated Backups                           │    │
│  │  - Daily schedule                                        │    │
│  │  - 7-day retention (Free) / 14-day (Pro)                │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Decision Submission

When Kel makes a decision (approve, approve with constraints, explore alternatives):

1. **User Action** → Click approve/constraint button
2. **Optimistic Update** → TanStack Query updates UI immediately
3. **Undo Window** → 5-second window with progress bar toast
4. **Server Persist** → After undo window expires:
   - `decisionsRepo.create()` called
   - Data written to PostgreSQL
   - RLS validates user has permission
5. **Cache Invalidation** → Query cache refreshed
6. **Confirmation** → Toast dismissed, card removed

### Failure Handling

If server persist fails:
- Toast shows error with retry action
- Card returns to queue (optimistic rollback)
- User can retry the action
- Data is NOT lost - it stays in the queue

---

## Auto-Save Implementation

### Debounce Strategy

```typescript
// src/hooks/ui/useDebouncedCallback.ts
const DEFAULT_DELAY = 2000; // 2 seconds

// Usage in ConstraintPanel and ExploreAlternativesPanel:
const { debouncedFn } = useDebouncedCallback((data) => {
  setDraftResponse(questionId, data);
}, 2000);
```

### NFR13 Compliance

| Metric | NFR13 Requirement | Actual |
|--------|-------------------|--------|
| Max delay after input pause | 5000ms | 2000ms |
| Compliance margin | - | 60% faster |

### Draft Storage (Session-Only)

The Zustand store (`src/stores/queue.ts`) holds drafts **in memory only**:

```typescript
interface QueueState {
  draftResponses: Record<string, DraftResponse>;
  // ...
}
```

**Important:** Drafts are intentionally NOT persisted across page refresh because:
1. Server is the source of truth once submitted
2. Prevents stale draft conflicts
3. Avoids sync complexity for MVP

This is documented behavior, not a bug.

---

## Database Integrity

### Schema Constraints

```sql
-- Foreign key: Decision must reference valid question
ALTER TABLE decisions
ADD CONSTRAINT decisions_question_id_fkey
FOREIGN KEY (question_id) REFERENCES questions(id);

-- Check constraint: Valid decision types only
ALTER TABLE decisions
ADD CONSTRAINT decisions_decision_type_check
CHECK (decision_type IN ('approved', 'approved_with_constraint', 'explore_alternatives'));
```

### Row Level Security (RLS)

All tables have RLS enabled:
- `questions`: Maho and Kel can view/edit
- `decisions`: Created by Kel, viewable by both
- `evidence`: Created by Maho, viewable by both

### Data Integrity Tests

Unit tests verify:
- All fields preserved after creation
- Constraints array structure preserved
- Updates don't corrupt other fields
- Evidence links survive question updates
- Null values explicitly preserved

Location: `src/lib/repositories/__tests__/data-integrity.test.ts`

---

## Backup & Recovery

### Current Configuration

See `docs/backup-verification.md` for full details.

| Setting | Value |
|---------|-------|
| Backup Schedule | Daily (automatic) |
| Retention | 7 days (Free tier) |
| PITR | Not available |

### Recovery Procedure

1. Log into Supabase Dashboard
2. Navigate to Project Settings → Database → Backups
3. Select backup point (within 7 days)
4. Initiate restore
5. Verify data integrity after restore

### Upgrade Path for NFR14

To achieve full NFR14 compliance (14-day retention):
1. Upgrade to Supabase Pro tier ($25/month)
2. Enables 14-day retention + PITR

---

## Testing Strategy

### Unit Tests (Repository Layer)

- Data integrity verification
- Field preservation on CRUD
- Null value handling
- Constraint array persistence

### E2E Tests (Playwright)

- Decision persists after page refresh
- Constraint data persists correctly
- Edited constraints persist

Location: `e2e/decisions/decision-flow.spec.ts` → "Data Persistence Verification" suite

### NFR Compliance Tests

- Auto-save timing (NFR13)
- Debounce behavior

Location: `src/hooks/ui/useDebouncedCallback.test.ts` → "NFR Compliance" suite

---

## Monitoring Recommendations

### Production Checklist

1. **Supabase Dashboard Monitoring**
   - Daily backup status check
   - Connection pool utilization
   - Query performance metrics

2. **Error Tracking**
   - Repository error rates
   - Failed decision submissions
   - RLS violation alerts

3. **Data Integrity Audits**
   - Periodic orphan record checks
   - Foreign key integrity verification
   - Backup restore testing (quarterly)

### Alerting Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Backup age | > 24h | > 48h |
| Decision save failures | > 1% | > 5% |
| Repository errors | > 10/hour | > 50/hour |

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/lib/repositories/decisions.ts` | Decision CRUD operations |
| `src/lib/repositories/questions.ts` | Question CRUD operations |
| `src/lib/repositories/evidence.ts` | Evidence CRUD operations |
| `src/lib/repositories/base.ts` | Error handling utilities |
| `src/hooks/ui/useDebouncedCallback.ts` | Auto-save debounce logic |
| `src/stores/queue.ts` | Draft state (session-only) |
| `docs/backup-verification.md` | Backup configuration details |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-01 | Initial documentation (Story 7.5) |
