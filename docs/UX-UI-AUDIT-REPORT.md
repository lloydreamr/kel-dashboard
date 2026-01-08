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
- **Critical Issues Found:** 3 (1 resolved)
- **High Priority Issues:** 2
- **Medium Priority Issues:** 3

### Verdict
**Not production-ready** until P0 issues are resolved. P1 issues should follow immediately after.

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

### P0-1: No Navigation System

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
- [ ] Navigation sidebar or header is visible on all authenticated pages
- [ ] Navigation includes links to: Dashboard (/), Questions (/questions), Visualization (/visualization), Progress (/progress)
- [ ] Current page is visually indicated (active state)
- [ ] Navigation is responsive (mobile-friendly)
- [ ] Navigation persists across page transitions

**Design Considerations:**
- Sidebar recommended for desktop (more room for future features)
- Consider collapsible sidebar for focus mode
- Mobile: hamburger menu or bottom navigation
- Include user profile/logout in navigation

**Effort Estimate:** Medium (2-3 days)

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

### P0-3: Misleading Empty State on Visualization Page

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
- [ ] Maho sees: "No competitor data yet. Add your first competitor to see the positioning chart." (with Add button)
- [ ] Kel sees: "No competitor data yet. Maho will add competitors for positioning analysis."
- [ ] Both states are visually consistent (same empty state component, different text)

**Effort Estimate:** Low (0.5 days)

---

## High Priority Issues (P1)

### P1-1: No Archive/Delete Actions on Questions List

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
- [ ] Each question card has a "..." or kebab menu icon
- [ ] Menu includes: Edit, Archive, Delete options
- [ ] Archive moves question to archived list
- [ ] Delete shows confirmation dialog before removing
- [ ] Actions only visible to Maho (role-appropriate)

**Effort Estimate:** Medium (1-2 days)

---

### P1-2: Disabled Button Contrast Issue

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
- [ ] Disabled buttons have obviously reduced opacity (e.g., 50%)
- [ ] Disabled buttons show "not-allowed" cursor on hover
- [ ] Enabled buttons have clear visual prominence (darker, bolder)
- [ ] Contrast meets WCAG AA standards
- [ ] Consistent across all form buttons in the app

**Effort Estimate:** Low (0.5 days)

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

### P2-2: No Question Status Filter on List

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
- [ ] Filter dropdown or tabs for status filtering
- [ ] Filter options: All, Draft, Sent to Kel, Decided
- [ ] Filter persists during session
- [ ] Count shown per filter option
- [ ] Works in combination with category filter (if added)

**Effort Estimate:** Medium (1-2 days)

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
| Add navigation sidebar to dashboard layout | P0 | 2-3 days |
| Add responsive navigation for mobile | P0 | 1 day |
| Add user profile/logout to navigation | P2 | 0.5 days |

### Epic 2: Question Management Enhancements
**Goal:** Complete CRUD operations for questions

| Story | Priority | Estimate |
|-------|----------|----------|
| ~~Add edit capability for question title/description~~ | P0 | ✅ Done |
| Add quick actions menu on questions list | P1 | 1-2 days |
| Add status filtering on questions list | P2 | 1-2 days |
| ~~Add search functionality for questions~~ | P3 | ✅ Done |

### Epic 3: Role-Aware UX Polish
**Goal:** UI messaging and features appropriate to user role

| Story | Priority | Estimate |
|-------|----------|----------|
| Role-specific empty state on visualization page | P0 | 0.5 days |
| Role-appropriate action visibility throughout app | P2 | 1 day |

### Epic 4: Visual Polish & Accessibility
**Goal:** Consistent, accessible visual design

| Story | Priority | Estimate |
|-------|----------|----------|
| Improve disabled button contrast | P1 | 0.5 days |
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

---

*This document is ready for handoff to Product Manager or Scrum Master for epic/story creation.*
