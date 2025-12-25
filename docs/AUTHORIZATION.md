# Authorization Architecture

**Author:** Winston (System Architect)
**Date:** 2025-12-23
**Status:** Active
**Epic:** Pre-Epic 3 Design Document

---

## Overview

This document defines the authorization model for the Kel Dashboard, clarifying responsibilities between database-level security (Supabase RLS) and frontend role detection. It was created to address the authorization model gap identified in the Epic 2 retrospective.

---

## Two-Layer Authorization Model

The Kel Dashboard uses a **two-layer authorization model**:

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND LAYER                          │
│  • Role-based UI rendering (what users SEE)                  │
│  • Feature gating (what buttons/actions appear)              │
│  • Implemented via: useProfile() hook                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATABASE LAYER (RLS)                     │
│  • Row-level security (what users CAN ACCESS)                │
│  • Data isolation and access control                         │
│  • Enforced by: Supabase RLS policies                        │
└─────────────────────────────────────────────────────────────┘
```

### Principle: Defense in Depth

- **RLS is the source of truth** for what data a user can access
- **Frontend role checks are UX optimizations** - hiding UI that would fail anyway
- **Never trust frontend-only checks** for security-critical operations

---

## Database Layer: RLS Policies

### Profiles Table

| Policy | Effect | Description |
|--------|--------|-------------|
| `profiles_select_own` | SELECT | Users can only read their own profile |
| `profiles_update_own` | UPDATE | Users can only update their own profile |

**Result:** `profilesRepo.getCurrent()` returns only the current user's profile.

### Questions Table

| Policy | Effect | Description |
|--------|--------|-------------|
| `questions_select_all` | SELECT | Both Maho and Kel can read all questions |
| `questions_insert_maho` | INSERT | Only Maho can create questions |
| `questions_update_all` | UPDATE | Both Maho and Kel can update questions |
| `questions_delete_none` | DELETE | No hard deletes (use archive status) |

**Result:** Both users see all questions, but only Maho can create new ones.

### Future: Evidence Table (Epic 3)

| Policy | Effect | Description |
|--------|--------|-------------|
| `evidence_select_all` | SELECT | Both users can read all evidence |
| `evidence_insert_maho` | INSERT | Only Maho can attach evidence |
| `evidence_update_maho` | UPDATE | Only Maho can edit evidence |
| `evidence_delete_maho` | DELETE | Only Maho can remove evidence |

---

## Frontend Layer: Role Detection

### The useProfile Hook

```typescript
// src/hooks/auth/useProfile.ts
export function useProfile() {
  return useQuery<Profile | null, Error>({
    queryKey: profileQueryKey,
    queryFn: () => profilesRepo.getCurrent(),
    staleTime: 1000 * 60 * 5, // 5 minute cache
  });
}
```

### Standard Usage Pattern

```typescript
// In any component needing role-based UI
const { data: profile } = useProfile();

const isKel = profile?.role === 'kel';
const isMaho = profile?.role === 'maho';

// Conditionally render UI
{isMaho && <CreateButton />}
{isKel && <ApproveButton />}
```

### When to Use Role Checks

| Scenario | Use Role Check? | Why |
|----------|-----------------|-----|
| Hide "Create Question" button from Kel | Yes | UX - don't show unusable UI |
| Hide "Archive" button from Kel | Yes | UX - only Maho manages lifecycle |
| Show "Kel Viewed" indicator | Yes | UX - only relevant to Maho |
| Prevent Kel from creating questions | No* | RLS handles this |
| Validate user owns a resource | No | RLS handles this |

*Frontend check is optional UX improvement; RLS is the enforcer.

---

## The userId Question: When to Pass, When to Fetch

### Decision Matrix

| Context | Approach | Rationale |
|---------|----------|-----------|
| **Creating a resource** | Pass `userId` as prop | Needed for `created_by` field |
| **Reading/updating resources** | Use `useProfile()` hook | RLS handles access; hook provides role |
| **Displaying user info** | Use `useProfile()` hook | Data already available in cache |

### Current Implementation Status

| Component | Current | Recommended | Action |
|-----------|---------|-------------|--------|
| `QuestionForm` | `userId` prop | Keep | Needed for `created_by` |
| `QuestionsPageClient` | `userId` prop | Remove | Not used after form refactor |
| `QuestionDetailClient` | None (fixed) | Correct | Uses `useProfile()` |

### The Pattern Going Forward

```typescript
// GOOD: Creating a resource - pass userId
interface CreateFormProps {
  userId: string; // Required for created_by field
}

// GOOD: Viewing/managing - use hook
function DetailClient({ resourceId }: { resourceId: string }) {
  const { data: profile } = useProfile();
  const isMaho = profile?.role === 'maho';
  // ...
}

// BAD: Passing userId when only role is needed
interface BadDetailProps {
  resourceId: string;
  userId: string; // Unused - remove this
}
```

---

## Authorization Flows

### Question Creation (Maho Only)

```
1. QuestionsPageClient renders "New Question" button (isMaho check)
2. User clicks → QuestionForm renders
3. QuestionForm receives userId prop from parent
4. Form submits with created_by: userId
5. RLS policy questions_insert_maho validates:
   - User is authenticated
   - User's profile.role === 'maho'
6. Question created
```

### Question Viewing (Both Users)

```
1. User navigates to /questions/[id]
2. QuestionDetailClient fetches question via useQuestion(id)
3. RLS policy questions_select_all allows access
4. useProfile() determines role for UI rendering
5. Role-specific UI elements shown/hidden
```

### Kel Views Question (Status Update)

```
1. Kel navigates to question detail
2. useProfile() returns role: 'kel'
3. useEffect triggers markViewed(questionId)
4. RLS allows update (questions_update_all)
5. viewed_by_kel_at timestamp set
6. Maho later sees KelViewedIndicator
```

---

## Epic 3 Considerations: Evidence

### New Authorization Requirements

Evidence will introduce these patterns:

| Operation | Who Can | RLS Policy | Frontend Check |
|-----------|---------|------------|----------------|
| Attach evidence | Maho | evidence_insert_maho | `isMaho && <AttachButton />` |
| View evidence | Both | evidence_select_all | Always show |
| Edit evidence | Maho | evidence_update_maho | `isMaho && <EditButton />` |
| Remove evidence | Maho | evidence_delete_maho | `isMaho && <DeleteButton />` |

### Evidence Creation Pattern

```typescript
// EvidenceForm will need userId for created_by
interface EvidenceFormProps {
  questionId: string;
  userId: string; // For created_by field
  onSuccess: () => void;
}
```

### Evidence Repository Pattern

```typescript
// Follow questions repository pattern
export const evidenceRepo = {
  create: async (input: CreateEvidenceInput): Promise<Evidence> => {
    // input.created_by required
    // RLS enforces Maho-only insert
  },

  getByQuestion: async (questionId: string): Promise<Evidence[]> => {
    // RLS allows both users to read
  },
};
```

---

## Security Checklist

### For New Features

- [ ] Define RLS policies FIRST
- [ ] Test RLS policies in Supabase dashboard
- [ ] Implement repository methods
- [ ] Add frontend role checks for UX
- [ ] Document in this file

### Never Do

- [ ] Rely solely on frontend checks for security
- [ ] Pass userId when only role detection is needed
- [ ] Skip RLS policies "because frontend checks handle it"
- [ ] Hard-code user IDs in frontend code

---

## Testing Authorization

### Unit Tests

```typescript
// Test role-based UI rendering
it('shows create button for Maho', () => {
  mockUseProfile.mockReturnValue({ data: { role: 'maho' } });
  render(<Component />);
  expect(screen.getByTestId('create-button')).toBeVisible();
});

it('hides create button for Kel', () => {
  mockUseProfile.mockReturnValue({ data: { role: 'kel' } });
  render(<Component />);
  expect(screen.queryByTestId('create-button')).not.toBeInTheDocument();
});
```

### E2E Tests

```typescript
// Multi-user context pattern from Story 2-9
const mahoContext = await browser.newContext({
  storageState: 'e2e/.auth/maho.json',
});
const kelContext = await browser.newContext({
  storageState: 'e2e/.auth/kel.json',
});

// Test Maho can create
await mahoPage.getByTestId('create-button').click();
// ...

// Test Kel cannot see create button
await kelPage.goto('/questions');
await expect(kelPage.getByTestId('create-button')).not.toBeVisible();
```

---

## Quick Reference

### Role Detection

```typescript
const { data: profile } = useProfile();
const isKel = profile?.role === 'kel';
const isMaho = profile?.role === 'maho';
```

### Conditional Rendering

```typescript
// Show only to Maho
{isMaho && <MahoOnlyComponent />}

// Show only to Kel
{isKel && <KelOnlyComponent />}

// Show to both, different content
{isMaho ? <MahoView /> : <KelView />}
```

### Pass userId When

- Creating a new resource (for `created_by` field)
- Parent component already has it from auth context

### Use useProfile When

- Determining what UI to show
- Checking user role for conditional logic
- Any read/update operation (let RLS handle access)

---

## Appendix: RLS Policy SQL

### Profiles Table

```sql
-- Users can only select their own profile
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

### Questions Table

```sql
-- Both users can read all questions
CREATE POLICY "questions_select_all" ON questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Only Maho can insert questions
CREATE POLICY "questions_insert_maho" ON questions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'maho'
    )
  );

-- Both users can update questions
CREATE POLICY "questions_update_all" ON questions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );
```

### Evidence Table (Epic 3)

```sql
-- Both users can read all evidence
CREATE POLICY "evidence_select_all" ON evidence
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );

-- Only Maho can insert evidence
CREATE POLICY "evidence_insert_maho" ON evidence
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'maho'
    )
  );

-- Only Maho can update evidence
CREATE POLICY "evidence_update_maho" ON evidence
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'maho'
    )
  );

-- Only Maho can delete evidence
CREATE POLICY "evidence_delete_maho" ON evidence
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'maho'
    )
  );
```

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-12-23 | Winston | Initial document created |
