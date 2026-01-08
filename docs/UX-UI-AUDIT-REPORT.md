# Kel Dashboard UX/UI Audit Report

**Date:** January 5, 2026
**Audit Type:** Comprehensive UX/UI Review with User Flow Testing
**Testing Method:** Playwright browser automation simulating real user behavior
**Auditors:** Multi-agent team (UX Designer, Product Manager, Business Analyst, Architect, Test Architect)

---

## Executive Summary

The Kel Dashboard has **solid core functionality** with well-designed user flows, clear feedback patterns, and thoughtful decision workflows. However, **critical gaps in navigation and basic CRUD operations** prevent the app from being realistically usable in production.

### Key Metrics
- **Pages Tested:** 5 (Dashboard, Questions, Question Detail, Visualization, Progress)
- **User Flows Tested:** Question creation, recommendation, send-to-Kel, decision UI
- **Critical Issues Found:** 3 (3 resolved)
- **High Priority Issues:** 2 (2 resolved)
- **Medium Priority Issues:** 3 (1 resolved)

### Verdict
**All P0 and P1 issues resolved.** P2 issues (status filters, loading states, category defaults) are polish items for future improvement.

---

## Table of Contents

1. [Critical Issues (P0)](#critical-issues-p0)
2. [High Priority Issues (P1)](#high-priority-issues-p1)
3. [Medium Priority Issues (P2)](#medium-priority-issues-p2)
4. [Low Priority Issues (P3)](#low-priority-issues-p3)
5. [What's Working Well](#whats-working-well)
6. [Suggested Epic Structure](#suggested-epic-structure)
7. [Appendix: Screenshots](#appendix-screenshots)

---

## Critical Issues (P0)

### P0-1: No Navigation System ✅ RESOLVED

**Problem Statement:**
The dashboard has no navigation whatsoever. Users cannot discover or switch between the 5 main pages without manually typing URLs.

**Current Behavior:**
- Landing on `/` shows decision queue
- No sidebar, header nav, or any navigation UI
- Users must know URLs exist: `/questions`, `/visualization`, `/progress`
- The Progress page (with WOFEX countdown) is completely undiscoverable

**Technical Root Cause:**
File: `src/app/(dashboard)/layout.tsx`
```tsx
export default function DashboardLayout({ children }) {
  return <>{children}</>;  // Empty wrapper - no navigation implemented
}
```
The layout has a comment noting it "can be extended with shared UI elements (navigation, sidebar, etc.) as the app grows" - but this was never implemented.

**User Impact:**
- Users will never discover most features
- No way to switch contexts without URL manipulation
- Progress tracking page (arguably the most useful for WOFEX planning) is hidden

**Suggested Story:**

> **As a** user of Kel Dashboard
> **I want** persistent navigation visible on all pages
> **So that** I can discover and switch between all features without typing URLs

**Acceptance Criteria:**
- [x] Navigation sidebar or header is visible on all authenticated pages
- [x] Navigation includes links to: Dashboard (/), Questions (/questions), Visualization (/visualization), Progress (/progress)
- [x] Current page is visually indicated (active state)
- [x] Navigation is responsive (mobile-friendly)
- [x] Navigation persists across page transitions

**Design Considerations:**
- Sidebar recommended for desktop (more room for future features)
- Consider collapsible sidebar for focus mode
- Mobile: hamburger menu or bottom navigation
- Include user profile/logout in navigation

**Effort Estimate:** Medium (2-3 days)

**Resolution (2026-01-08):**
Feature was already implemented with comprehensive navigation system:
- `nav-links.ts` - Single source of truth for all 4 navigation links with icons
- `Sidebar.tsx` - Desktop sidebar with active state highlighting (bg-accent class)
- `MobileNav.tsx` + `MobileNavDrawer.tsx` - Mobile hamburger menu with drawer
- `layout.tsx` - Responsive layout with `hidden md:flex` / `flex md:hidden` pattern
- User section with avatar, email, and logout button in both viewports
- `DashboardSyncIndicator` for offline status
- Comprehensive E2E tests in `e2e/navigation/navigation-flow.spec.ts` covering:
  - Desktop sidebar navigation and active states
  - Mobile hamburger menu, drawer open/close
  - Navigation link clicks and URL verification
  - User section visibility in both viewports

---

### P0-2: No Way to Edit Question Title/Description ✅ RESOLVED

**Problem Statement:**
Once a question is created, users cannot edit the title or description. The only editable element is the recommendation.

**Current Behavior:**
- Question detail page shows title and description as read-only
- Edit button only appears for Recommendation section
- No edit icon, menu, or inline editing for question itself
- User must delete and recreate question to fix a typo

**User Impact:**
- Typos require question recreation
- Cannot refine question wording after initial creation
- Frustrating for iterative refinement workflow

**Suggested Story:**

> **As a** Maho (researcher)
> **I want** to edit a question's title and description after creation
> **So that** I can refine questions without recreating them

**Acceptance Criteria:**
- [x] Edit button/icon visible on question detail page header
- [x] Clicking edit opens inline form or modal with current title/description
- [x] Can save changes or cancel
- [x] Toast notification confirms "Question updated"
- [x] Changes persist and reflect in questions list
- [x] Only Maho can edit (same as create permission)

**Effort Estimate:** Low (1 day)

**Resolution (2026-01-08):**
Feature was already implemented in QuestionDetailClient.tsx with QuestionEditForm component:
- Pencil icon edit button in question header (Maho only, non-archived)
- Inline form with react-hook-form + Zod validation
- Escape key or Cancel button to close
- Toast notification on successful save via updateQuestion mutation
- Role-based visibility (Maho only)
- URL param support (?edit=true) for direct edit mode
- Added 6 integration tests to verify end-to-end functionality

---

### P0-3: Misleading Empty State on Visualization Page ✅ RESOLVED

**Problem Statement:**
The visualization page shows "Add competitors to see the positioning chart" to ALL users, but the Add Competitor button only appears for Maho role. Kel users see the message but cannot act on it.

**Current Behavior:**
- Empty state text: "No competitor data yet" / "Add competitors to see the positioning chart"
- Add Competitor button conditionally rendered: `{isMaho && <AddCompetitorButton />}`
- Kel users see misleading CTA they cannot fulfill

**Technical Location:**
File: `src/app/(dashboard)/visualization/page.tsx`, lines 93-101

**User Impact:**
- Kel users confused by messaging
- Creates perception of broken feature
- Poor role-aware UX

**Suggested Story:**

> **As a** Kel (decision-maker) viewing an empty visualization page
> **I want** to see messaging appropriate to my role
> **So that** I understand why the page is empty and what to expect

**Acceptance Criteria:**
- [x] Maho sees: "No competitor data yet. Add your first competitor to see the positioning chart." (with Add button)
- [x] Kel sees: "No competitor data yet. Maho will add competitors for positioning analysis."
- [x] Both states are visually consistent (same empty state component, different text)

**Effort Estimate:** Low (0.5 days)

**Resolution (2026-01-08):**
Feature was already implemented in ScatterChart.tsx (lines 142-171):
- Role-aware messaging via `isMaho` prop
- Maho: "Add your first competitor..." + Add Competitor button
- Kel: "Maho will add competitors for positioning analysis."
- Consistent styling with dashed border, muted background
- 6 tests already exist verifying role-specific behavior

---

## High Priority Issues (P1)

### P1-1: No Archive/Delete Actions on Questions List ✅ RESOLVED

**Problem Statement:**
The questions list page shows an "Archived" button to view archived questions, but provides no way to archive or delete questions from the list view. Users must navigate into each question to manage it.

**Current Behavior:**
- Questions list shows question cards
- No hover actions, dropdown menus, or bulk actions
- Must click into question detail → find archive/delete option

**User Impact:**
- Inefficient for managing multiple questions
- Extra clicks for common operations
- No batch/bulk actions possible

**Suggested Story:**

> **As a** Maho managing multiple questions
> **I want** quick actions available on the questions list
> **So that** I can archive or delete questions without navigating into each one

**Acceptance Criteria:**
- [x] Each question card has a "..." or kebab menu icon
- [x] Menu includes: Edit, Archive, Delete options
- [x] Archive moves question to archived list
- [x] Delete shows confirmation dialog before removing
- [x] Actions only visible to Maho (role-appropriate)

**Effort Estimate:** Medium (1-2 days)

**Resolution (2026-01-08):**
Feature was already implemented in QuestionCardActions.tsx:
- `MoreVertical` kebab icon trigger with dropdown menu
- Edit: Navigates to `/questions/{id}?edit=true`
- Archive: Confirmation dialog → `useArchiveQuestion` hook
- Delete: Confirmation dialog with "cannot be undone" warning → `useDeleteQuestion` hook
- Role-gated in QuestionCard.tsx: `{isMaho && <QuestionCardActions>}`
- 17 unit tests in QuestionCardActions.test.tsx
- E2E coverage in navigation-flow.spec.ts (AC5: Quick Actions Tests)

---

### P1-2: Disabled Button Contrast Issue ✅ RESOLVED

**Problem Statement:**
Disabled buttons have insufficient visual contrast from enabled buttons, making it difficult to distinguish clickable vs. non-clickable states.

**Current Behavior:**
- Disabled "Create Question" button: gray background
- Enabled "Create Question" button: slightly different gray/black
- Difference is subtle, especially in bright environments

**Affected Components:**
- Create Question button (in modal)
- Add Recommendation button
- Send to Kel button (when disabled)

**User Impact:**
- Users may click disabled buttons expecting action
- Accessibility concern (WCAG contrast requirements)
- Unclear when form requirements are met

**Suggested Story:**

> **As a** user filling out forms
> **I want** clear visual distinction between disabled and enabled buttons
> **So that** I know when I can submit

**Acceptance Criteria:**
- [x] Disabled buttons have obviously reduced opacity (e.g., 50%)
- [x] Disabled buttons show "not-allowed" cursor on hover
- [x] Enabled buttons have clear visual prominence (darker, bolder)
- [x] Contrast meets WCAG AA standards
- [x] Consistent across all form buttons in the app

**Effort Estimate:** Low (0.5 days)

**Resolution (2026-01-08):**
Fixed button disabled styling in `button.tsx`:
- Removed `disabled:pointer-events-none` to allow cursor feedback (was blocking `cursor-not-allowed`)
- Removed double-stacking opacity (`disabled:bg-primary/30` + `disabled:opacity-50` = too faint)
- Added `hover:disabled:bg-*` to prevent hover state color changes on disabled buttons
- Consistent 50% opacity across all variants via `disabled:opacity-50`
- `disabled:cursor-not-allowed` now works properly for accessibility feedback
- 12 unit tests updated to verify new behavior

---

## Medium Priority Issues (P2)

### P2-1: Category Default Selection Bias

**Problem Statement:**
When creating a new question, "Product" is pre-selected as the default category. This may cause accidental miscategorization or bias users toward one category.

**Current Behavior:**
- Category dropdown defaults to "Product" selected
- Options: Market, Product, Distribution

**Considerations:**
- Most questions for Kel project may be Market-related
- Pre-selection speeds up form completion
- But may cause errors if user doesn't consciously choose

**Suggested Story:**

> **As a** Maho creating questions
> **I want** to consciously choose a category
> **So that** questions are correctly categorized from the start

**Acceptance Criteria:**
- [ ] Category dropdown shows placeholder "Select category..." by default
- [ ] Form cannot be submitted without selecting a category
- [ ] Error state shown if user tries to submit without category

**Alternative Acceptance Criteria (if default preferred):**
- [ ] Default changed to "Market" (most common for this project)
- [ ] Visual highlight reminds user to verify category selection

**Effort Estimate:** Low (0.5 days)

---

### P2-2: No Question Status Filter on List ✅ RESOLVED

**Problem Statement:**
The questions list shows all questions but has no filtering by status (Draft, Sent to Kel, Approved, etc.).

**Current Behavior:**
- All active questions shown in single list
- Only filter available is "Archived" toggle
- No way to see "only drafts" or "only waiting for decision"

**User Impact:**
- Hard to focus on questions at specific stage
- Cluttered view as question count grows
- No prioritization support

**Suggested Story:**

> **As a** Maho managing questions
> **I want** to filter questions by status
> **So that** I can focus on questions at a specific stage

**Acceptance Criteria:**
- [x] Filter dropdown or tabs for status filtering
- [x] Filter options: All, Draft, Sent to Kel, Decided
- [x] Filter persists during session
- [x] Count shown per filter option
- [x] Works in combination with category filter (if added)

**Effort Estimate:** Medium (1-2 days)

**Resolution (2026-01-08):**
Feature was already implemented with comprehensive status filtering:
- `StatusFilter.tsx` - Tabs-based UI with shadcn Tabs component
- Filter options: All, Draft, Sent to Kel, Decided with counts
- URL persistence via `?status=draft` query params
- Responsive labels (full + abbreviated for mobile)
- `useFilteredQuestions` hook supports status + category + search combination
- 7 unit tests in `StatusFilter.test.tsx`
- Integration in `QuestionsPageClient.tsx` with URL-based state management

---

### P2-3: No Loading States on Initial Data Fetch

**Problem Statement:**
Some pages show brief content flash or empty state before data loads, rather than proper skeleton loading states.

**Current Behavior:**
- Visualization page has skeleton loader (good)
- Questions list may flash "No questions yet" before loading
- Dashboard may show "0 items" briefly

**User Impact:**
- Perceived performance issues
- Confusing flash of incorrect content
- Inconsistent loading experience

**Suggested Story:**

> **As a** user navigating the dashboard
> **I want** consistent loading indicators
> **So that** I know data is being fetched vs. actually empty

**Acceptance Criteria:**
- [ ] All list pages show skeleton loaders during fetch
- [ ] Skeleton matches eventual content layout
- [ ] No flash of "empty state" before data loads
- [ ] Loading state clears within reasonable time or shows error

**Effort Estimate:** Low-Medium (1 day)

---

## Low Priority Issues (P3)

### P3-1: No Keyboard Shortcuts

**Problem Statement:**
Power users cannot navigate or take actions via keyboard shortcuts.

**Potential Shortcuts:**
- `N` - New question
- `?` - Help/shortcuts overlay
- `1/2/3/4` - Navigate to main sections
- `Esc` - Close modals

**Effort Estimate:** Medium (2 days)

---

### P3-2: No Search Functionality ✅ RESOLVED

**Problem Statement:**
As question count grows, no way to search questions by title or content.

**Effort Estimate:** Medium (1-2 days)

**Resolution (2026-01-08):**
Implemented SearchInput component with debounced real-time filtering:
- Search bar at top of questions list page
- Searches title and description (case-insensitive)
- 300ms debounce for performance
- Clear button and accessible design
- Integrates with existing status/category filters
- Contextual empty state messaging for search results

---

### P3-3: Evidence Section Not Actionable

**Problem Statement:**
The "Supporting Evidence" section shows "No supporting evidence provided" but clicking it does nothing. Should there be an "Add Evidence" flow?

**Note:** This may be intentional/planned for future. Needs product clarification.

**Effort Estimate:** TBD based on requirements

---

## What's Working Well

Document these as examples of good patterns to maintain:

### Toast Notifications
- Every action provides clear feedback
- Consistent positioning and styling
- Auto-dismiss with manual close option

### Form Validation
- Required fields clearly marked with asterisk
- Submit buttons disabled until valid
- Inline validation messaging

### Decision Workflow UI
- Progressive disclosure (card expands on click)
- Three-option decision model (Approve, Approve with Constraint, Explore Alternatives)
- Clear status progression (Draft → Sent → Decided)

### Empty States
- Helpful messaging guides users (except role-awareness issue noted above)
- Dashed borders invite action
- Consistent visual pattern

### Confirmation Dialogs
- Destructive actions require confirmation
- Clear messaging ("He will see this in his decision queue")
- Cancel option always available

### Progress Page
- WOFEX countdown is motivating
- Category-based progress tracking
- Notes section per category

### Recommendation Flow
- "Rationale (encouraged)" - soft nudge microcopy
- Edit capability for recommendations
- Clear visual hierarchy

---

## Suggested Epic Structure

### Epic 1: Navigation & Information Architecture
**Goal:** Users can discover and navigate to all features

| Story | Priority | Estimate |
|-------|----------|----------|
| ~~Add navigation sidebar to dashboard layout~~ | P0 | ✅ Done |
| ~~Add responsive navigation for mobile~~ | P0 | ✅ Done |
| ~~Add user profile/logout to navigation~~ | P2 | ✅ Done |

### Epic 2: Question Management Enhancements
**Goal:** Complete CRUD operations for questions

| Story | Priority | Estimate |
|-------|----------|----------|
| ~~Add edit capability for question title/description~~ | P0 | ✅ Done |
| ~~Add quick actions menu on questions list~~ | P1 | ✅ Done |
| ~~Add status filtering on questions list~~ | P2 | ✅ Done |
| ~~Add search functionality for questions~~ | P3 | ✅ Done |

### Epic 3: Role-Aware UX Polish
**Goal:** UI messaging and features appropriate to user role

| Story | Priority | Estimate |
|-------|----------|----------|
| ~~Role-specific empty state on visualization page~~ | P0 | ✅ Done |
| Role-appropriate action visibility throughout app | P2 | 1 day |

### Epic 4: Visual Polish & Accessibility
**Goal:** Consistent, accessible visual design

| Story | Priority | Estimate |
|-------|----------|----------|
| ~~Improve disabled button contrast~~ | P1 | ✅ Done |
| Add consistent loading skeletons | P2 | 1 day |
| Review form default values | P2 | 0.5 days |

---

## Appendix: Screenshots

Screenshots captured during audit are available at:
```
kel-dashboard/.playwright-mcp/
├── audit-01-landing-page.png
├── audit-02-questions-page.png
├── audit-03-visualization-page.png
├── audit-04-progress-page.png
├── audit-05-create-question-modal.png
├── audit-06-question-detail-page.png
├── audit-07-add-recommendation-form.png
├── audit-08-recommendation-added.png
├── audit-09-send-to-kel-confirmation.png
├── audit-10-sent-to-kel-status.png
├── audit-11-dashboard-with-item.png
├── audit-12-decision-ui-expanded.png
├── audit-13-visualization-empty.png
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-05 | Multi-Agent Audit Team | Initial comprehensive audit |
| 1.1 | 2026-01-08 | Claude | P3-2 Search Functionality resolved |
| 1.2 | 2026-01-08 | Claude | P0-2 Edit Question Title/Description resolved (was already implemented) |
| 1.3 | 2026-01-08 | Claude | P0-3 Visualization Empty State resolved (was already implemented) |
| 1.4 | 2026-01-08 | Claude | P0-1 Navigation System resolved (was already implemented) - All P0 issues now resolved |
| 1.5 | 2026-01-08 | Claude | P1-1 Quick Actions Menu resolved (was already implemented) |
| 1.6 | 2026-01-08 | Claude | P1-2 Disabled Button Contrast resolved (fixed button.tsx disabled styles) - All P0 and P1 issues now resolved |
| 1.7 | 2026-01-08 | Claude | P2-2 Status Filtering resolved (was already implemented) |

---

*This document is ready for handoff to Product Manager or Scrum Master for epic/story creation.*
