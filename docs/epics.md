---
stepsCompleted: [1, 2, 3, 4]
lastStep: 4
workflowStatus: complete
completedAt: 2026-01-10
inputDocuments:
  - docs/market-intelligence-prd.md
project_name: 'Market Intelligence Dashboard'
scope: 'MVP'
total_epics: 5
total_stories: 36
total_frs_covered: 43
---

# Market Intelligence Dashboard - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Market Intelligence Dashboard, decomposing the requirements from the PRD into implementable stories. Focus is on **MVP scope only** for WOFEX 2026 timeline.

## Requirements Inventory

### Functional Requirements

**Market Research Navigation**
- FR1: Users can view the 8 research categories (companies, products, distribution, consumers, trends, supply-chain, stakeholders, regulatory) in a navigation structure
- FR2: Users can navigate between research categories with a single click/tap
- FR3: Users can see breadcrumb navigation showing current location within research hierarchy
- FR4: Users can access a high-level overview dashboard with key market statistics

**Competitor Analysis**
- FR5: Users can view a scatter chart positioning competitors by price and quality scores
- FR6: Users can click on a competitor data point to view detailed profile information
- FR7: Users can view the complete company profile for each of the 14 competitors
- FR8: Users can search competitor profiles by company name
- FR9: Users can filter competitors by category (manufacturer type, market segment, etc.)
- FR10: Users can view competitor financials (revenue, market share) when available
- FR11: Users can view competitor strengths and weaknesses analysis
- FR12: Users can see source citations for competitor data

**Product Landscape**
- FR13: Users can view products organized by category (puffs, chips, crackers, etc.)
- FR14: Users can view products organized by price tier (value, mid-market, premium)
- FR15: Users can view products organized by flavor category
- FR16: Users can filter product views by multiple dimensions simultaneously
- FR17: Users can see product count and distribution within each category/tier/flavor

**Market Opportunity**
- FR18: Users can view a summary of identified market gaps and opportunities
- FR19: Users can see which market segments are underserved
- FR20: Users can view opportunity rationale with supporting research references
- FR21: Users can see Kel's target position highlighted relative to competitors

**Data Management (Admin Only)**
- FR22: Admin users can add new competitor data points to the scatter chart
- FR23: Admin users can edit existing competitor information
- FR24: Admin users can delete competitor data points
- FR25: Admin users can mark a position as "Kel's Target Position" (star marker)
- FR26: Admin users can add research findings to the appropriate category
- FR27: Admin users can edit existing research content
- FR28: Admin users see immediate feedback when data changes (optimistic updates)
- FR29: Admin users receive confirmation notifications after successful CRUD operations

**User Access & Roles**
- FR30: Users must authenticate to access the Market Intelligence Dashboard
- FR31: The system distinguishes between Admin users (Maho) and Viewer users (Kel)
- FR32: Viewer users see the same data visualizations as Admin users
- FR33: Viewer users do not see CRUD controls (Add, Edit, Delete buttons)
- FR34: Admin users see CRUD controls only when they have admin role

**Mobile & Responsive Experience**
- FR35: Users can access all visualizations on mobile devices (iPhone SE minimum)
- FR36: Users can navigate research categories on mobile with touch gestures
- FR37: Users can view scatter chart on mobile with pinch-to-zoom capability
- FR38: Users see mobile-optimized layouts (bottom sheets instead of dialogs)
- FR39: Users can take screenshots of visualizations for sharing

**Data Integrity & Traceability**
- FR40: Users can see source URLs/citations for research data
- FR41: Users can trace insights back to original research documents
- FR42: System validates required fields before saving data
- FR43: System prevents duplicate competitor entries (by name)

### Non-Functional Requirements

**Performance**
- NFR1: Chart visualizations render < 1 second
- NFR2: Initial page load (FCP) < 1.5 seconds
- NFR3: Largest Contentful Paint < 2.5 seconds
- NFR4: Time to Interactive < 3.5 seconds
- NFR5: Data fetch (cached) < 100ms
- NFR6: Data fetch (network) < 2 seconds
- NFR7: CRUD operation feedback < 500ms (optimistic updates)

**Accessibility**
- NFR8: Color contrast for text 4.5:1 minimum (WCAG 2.1 AA)
- NFR9: Color contrast for UI components 3:1 minimum
- NFR10: Keyboard navigation for 100% of interactive elements
- NFR11: Screen reader compatibility with text alternatives
- NFR12: Visible focus indicators on all interactive elements
- NFR13: Respect prefers-reduced-motion
- NFR14: Scatter chart data points include aria-label
- NFR15: Data tables as accessible alternative to charts
- NFR16: Filter controls keyboard navigable
- NFR17: Modal focus trapped while open

**Security**
- NFR18: Authentication required for all dashboard routes
- NFR19: Role-based access control via RLS policies
- NFR20: Data authorization by user role
- NFR21: Sessions expire after 7 days of inactivity
- NFR22: HTTPS enforcement

**Integration**
- NFR23: Reuse existing Supabase Auth
- NFR24: Use existing Supabase PostgreSQL instance
- NFR25: Reuse existing TanStack Query configuration
- NFR26: Reuse existing shadcn/ui component library
- NFR27: Integrate within existing Next.js 14 App Router
- NFR28: Deploy via existing Vercel project
- NFR29: New routes must not break existing functionality
- NFR30: Shared components maintain backward compatibility

**Reliability**
- NFR31: 99% uptime
- NFR32: Supabase managed backups (daily)
- NFR33: Graceful error states with retry options
- NFR34: Display cached data when offline

### Additional Requirements

**Brownfield Context:**
- This is an extension of existing kel-dashboard, not a greenfield project
- No starter template required - reuse existing codebase patterns
- Authentication, layout, and component library already established
- Competitor scatter chart visualization already exists at /visualization

**MVP Scope Constraints:**
- Focus on 4 core features: Competitor Landscape (exists), Company Profiles Browser, Product Category Matrix, Market Gaps Dashboard
- WOFEX 2026 deadline (July 29, 2026)
- Solo developer (Maho)
- Must support pitch preparation workflow

**Existing Patterns to Reuse:**
- /visualization page scatter chart component
- Supabase RLS policies for role-based access
- TanStack Query with HydrationBoundary pattern
- Bottom sheet modals for mobile
- Toast notifications for CRUD feedback

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 1 | View 8 research categories |
| FR2 | Epic 1 | Navigate between categories |
| FR3 | Epic 1 | Breadcrumb navigation |
| FR4 | Epic 1 | High-level overview dashboard |
| FR5 | Epic 2 | Scatter chart visualization |
| FR6 | Epic 2 | Click data point for details |
| FR7 | Epic 3 | View complete company profiles |
| FR8 | Epic 3 | Search profiles by name |
| FR9 | Epic 3 | Filter by category |
| FR10 | Epic 3 | View competitor financials |
| FR11 | Epic 3 | View strengths/weaknesses |
| FR12 | Epic 3 | Source citations for competitors |
| FR13 | Epic 4 | Products by category |
| FR14 | Epic 4 | Products by price tier |
| FR15 | Epic 4 | Products by flavor |
| FR16 | Epic 4 | Multi-dimensional filtering |
| FR17 | Epic 4 | Product count/distribution |
| FR18 | Epic 5 | Market gaps summary |
| FR19 | Epic 5 | Underserved segments |
| FR20 | Epic 5 | Opportunity rationale |
| FR21 | Epic 2 | Kel's target position marker |
| FR22 | Epic 2 | Admin add competitor |
| FR23 | Epic 2 | Admin edit competitor |
| FR24 | Epic 2 | Admin delete competitor |
| FR25 | Epic 2 | Mark Kel's target position |
| FR26 | Epic 5 | Admin add research |
| FR27 | Epic 5 | Admin edit research |
| FR28 | Epic 2 | Optimistic updates |
| FR29 | Epic 2 | Confirmation notifications |
| FR30 | Epic 1 | Authentication required |
| FR31 | Epic 1 | Admin vs Viewer distinction |
| FR32 | Epic 1 | Viewer sees same data |
| FR33 | Epic 1 | Viewer no CRUD controls |
| FR34 | Epic 1 | Admin sees CRUD controls |
| FR35 | Epic 5 | Mobile access |
| FR36 | Epic 5 | Mobile touch navigation |
| FR37 | Epic 5 | Mobile pinch-to-zoom |
| FR38 | Epic 5 | Bottom sheets on mobile |
| FR39 | Epic 5 | Screenshot capability |
| FR40 | Epic 3 | Source URLs visible |
| FR41 | Epic 3 | Trace to research docs |
| FR42 | Epic 5 | Required field validation |
| FR43 | Epic 5 | Duplicate prevention |

## Epic List

### Epic 1: Dashboard Foundation & Navigation
Users can access the Market Intelligence Dashboard and navigate between the 8 research categories. Establishes the container for all market intelligence features with proper authentication and role-based access.

**FRs covered:** FR1, FR2, FR3, FR4, FR30, FR31, FR32, FR33, FR34

### Epic 2: Competitor Landscape Visualization
Users can understand competitive positioning through an enhanced scatter chart with CRUD capabilities. Admins can manage competitor data including marking Kel's target position.

**FRs covered:** FR5, FR6, FR21, FR22, FR23, FR24, FR25, FR28, FR29

### Epic 3: Company Profiles Browser
Users can browse, search, and view detailed competitor company profiles with source traceability. Quick access to any of the 14 competitor profiles with verification through citations.

**FRs covered:** FR7, FR8, FR9, FR10, FR11, FR12, FR40, FR41

### Epic 4: Product Category Matrix
Users can explore the product landscape by category, price tier, and flavor. Visualize product distribution and identify whitespace in the market.

**FRs covered:** FR13, FR14, FR15, FR16, FR17

### Epic 5: Market Gaps Dashboard & Mobile Experience
Users can identify market opportunities with supporting research. Admins can manage research content. All features accessible on mobile devices.

**FRs covered:** FR18, FR19, FR20, FR26, FR27, FR35, FR36, FR37, FR38, FR39, FR42, FR43

---

## Epic 1: Dashboard Foundation & Navigation

**Goal:** Users can access the Market Intelligence Dashboard and navigate between the 8 research categories. Establishes the container for all market intelligence features with proper authentication and role-based access.

**FRs covered:** FR1, FR2, FR3, FR4, FR30, FR31, FR32, FR33, FR34

**NFRs relevant:** NFR18 (auth required), NFR23-27 (integration), NFR29 (no breaking changes)

### Story 1.1: Market Intelligence Route with Auth Protection

As a user,
I want the Market Intelligence Dashboard to require authentication,
So that only authorized users can access sensitive market research data.

**Acceptance Criteria:**

**Given** I am not logged in
**When** I navigate to /market-intelligence
**Then** I am redirected to the login page
**And** after successful login, I am returned to /market-intelligence

**Given** I am logged in as any user (Admin or Viewer)
**When** I navigate to /market-intelligence
**Then** I see the Market Intelligence Dashboard landing page
**And** my session remains valid for 7 days of inactivity (NFR21)

**Technical Notes:**
- Reuse existing Supabase Auth middleware pattern
- Create route at app/market-intelligence/page.tsx
- Apply existing auth protection pattern from other protected routes

---

### Story 1.2: Research Category Navigation Structure

As a user,
I want to see the 8 research categories in a clear navigation structure,
So that I can quickly find and explore market intelligence data.

**Acceptance Criteria:**

**Given** I am on the Market Intelligence Dashboard
**When** the page loads
**Then** I see navigation for all 8 categories: Companies, Products, Distribution, Consumers, Trends, Supply Chain, Stakeholders, Regulatory
**And** each category shows an icon or visual identifier
**And** each category is clearly clickable/tappable

**Given** I am using a mobile device (FR35)
**When** I view the navigation
**Then** navigation adapts to mobile-friendly layout (sidebar collapses or bottom nav)
**And** touch targets are at least 44x44 pixels

**Technical Notes:**
- Create MarketIntelligenceNav component
- Use existing shadcn/ui navigation patterns
- Categories correspond to /market-intelligence folder structure

---

### Story 1.3: Single-Click Category Navigation

As a user,
I want to navigate between research categories with a single click,
So that I can efficiently explore different market intelligence areas.

**Acceptance Criteria:**

**Given** I am on the Market Intelligence Dashboard
**When** I click on a category (e.g., "Companies")
**Then** I navigate to /market-intelligence/companies within 500ms
**And** the URL updates to reflect the selected category
**And** the navigation highlights the active category

**Given** I am on any category page
**When** I click a different category
**Then** I navigate to that category without returning to the landing page
**And** the transition is smooth without full page reload

**Technical Notes:**
- Use Next.js Link component for client-side navigation
- Implement active state styling for current category

---

### Story 1.4: Breadcrumb Navigation

As a user,
I want to see breadcrumb navigation showing my current location,
So that I understand where I am within the research hierarchy and can navigate back.

**Acceptance Criteria:**

**Given** I am on the Market Intelligence landing page
**When** I view the breadcrumb
**Then** I see "Market Intelligence" as the current location

**Given** I am viewing a specific category (e.g., Companies)
**When** I view the breadcrumb
**Then** I see "Market Intelligence > Companies"
**And** "Market Intelligence" is clickable to return to landing

**Given** I am viewing a specific item (e.g., URC company profile)
**When** I view the breadcrumb
**Then** I see "Market Intelligence > Companies > URC"
**And** each parent level is clickable

**Given** I am on mobile
**When** I view breadcrumbs with long paths
**Then** breadcrumbs truncate gracefully (e.g., "... > Companies > URC")

**Technical Notes:**
- Create Breadcrumb component using existing shadcn/ui patterns
- Pass breadcrumb data via layout or context

---

### Story 1.5: Overview Dashboard with Key Statistics

As a user,
I want to see a high-level overview dashboard with key market statistics,
So that I can quickly grasp the market landscape before diving into details.

**Acceptance Criteria:**

**Given** I am on the Market Intelligence landing page
**When** the page loads
**Then** I see summary statistics including:
  - Total competitors tracked (count from Companies)
  - Product categories mapped (count from Products)
  - Market trends identified (count from Trends)
  - Research coverage (document count across all categories)

**Given** I click on any statistic card
**When** the navigation occurs
**Then** I go to the corresponding category page

**Given** the data is loading
**When** I view the dashboard
**Then** I see loading skeletons (not blank space)
**And** the page becomes interactive in < 3.5 seconds (NFR4)

**Technical Notes:**
- Create OverviewDashboard component
- Use TanStack Query for data fetching with existing patterns
- Statistics derived from Supabase counts

---

### Story 1.6: User Role Detection

As the system,
I want to distinguish between Admin users (Maho) and Viewer users (Kel),
So that I can show or hide functionality appropriately.

**Acceptance Criteria:**

**Given** a user logs in with admin credentials (Maho)
**When** the app fetches their profile
**Then** the system identifies them as role="admin"
**And** this role is available in the user context

**Given** a user logs in with viewer credentials (Kel)
**When** the app fetches their profile
**Then** the system identifies them as role="viewer"
**And** this role is available in the user context

**Technical Notes:**
- Reuse existing user profile query pattern
- Role stored in user_profiles table or equivalent
- Use existing useUser hook or create useUserRole hook

---

### Story 1.7: Role-Based CRUD Control Visibility

As a Viewer user (Kel),
I want to see the same data visualizations as Admin users,
So that I have full read access to market intelligence without confusion from edit controls.

As an Admin user (Maho),
I want to see CRUD controls (Add, Edit, Delete buttons),
So that I can manage market intelligence data.

**Acceptance Criteria:**

**Given** I am logged in as Viewer (role="viewer")
**When** I view any data visualization or list
**Then** I see all the same data as Admin users
**And** I do NOT see Add, Edit, or Delete buttons
**And** I cannot access admin-only actions via URL manipulation (RLS enforced)

**Given** I am logged in as Admin (role="admin")
**When** I view data visualizations or lists
**Then** I see Add, Edit, Delete buttons where appropriate
**And** the buttons are clearly styled and accessible

**Technical Notes:**
- Create AdminOnly component wrapper
- Apply pattern consistently across all epic implementations
- Server-side RLS provides security; UI visibility is UX only

---

## Epic 2: Competitor Landscape Visualization

**Goal:** Users can understand competitive positioning through an enhanced scatter chart with CRUD capabilities. Admins can manage competitor data including marking Kel's target position.

**FRs covered:** FR5, FR6, FR21, FR22, FR23, FR24, FR25, FR28, FR29

**NFRs relevant:** NFR1 (chart render < 1s), NFR7 (CRUD feedback < 500ms), NFR8-17 (accessibility)

**Brownfield Context:** Scatter chart visualization already exists at /visualization with full CRUD functionality. This epic integrates and enhances it within the Market Intelligence structure.

### Story 2.1: Embed Competitor Scatter Chart in Market Intelligence

As a user,
I want to view the competitor landscape scatter chart within Market Intelligence,
So that I can understand competitive positioning as part of the overall market research.

**Acceptance Criteria:**

**Given** I navigate to /market-intelligence/companies (or dedicated competitor landscape route)
**When** the page loads
**Then** I see the scatter chart positioning competitors by price (X) and quality (Y) scores
**And** the chart renders in < 1 second (NFR1)
**And** data points are visible and distinguishable

**Given** the existing /visualization page
**When** integrated into Market Intelligence
**Then** the chart component is reusable without duplication
**And** existing functionality is preserved

**Technical Notes:**
- Extract chart component from /visualization for reuse
- Create route at app/market-intelligence/companies/page.tsx
- Use existing competitor_data table and queries

---

### Story 2.2: Click Data Point for Competitor Details

As a user,
I want to click on a competitor data point to view their detailed profile,
So that I can quickly access competitor information from the visualization.

**Acceptance Criteria:**

**Given** I am viewing the scatter chart
**When** I click on a competitor data point
**Then** a detail panel/popover appears showing:
  - Company name
  - Price score and Quality score
  - Quick summary (if available)
  - Link to full company profile (Epic 3)

**Given** I am on mobile
**When** I tap a data point
**Then** the detail appears as a bottom sheet (FR38)
**And** I can dismiss it with a swipe or tap outside

**Given** I am using keyboard navigation (NFR10)
**When** I focus on a data point and press Enter
**Then** the detail panel opens
**And** focus moves to the panel content

**Technical Notes:**
- Reuse existing click handler pattern from /visualization
- Implement popover for desktop, bottom sheet for mobile
- Add aria-label to data points (NFR14)

---

### Story 2.3: Kel's Target Position Display

As a user,
I want to see Kel's target market position highlighted on the scatter chart,
So that I can understand our strategic positioning relative to competitors.

**Acceptance Criteria:**

**Given** a competitor data point is marked as "is_kel_position = true"
**When** I view the scatter chart
**Then** that point displays as a star marker (distinct from circles)
**And** the star is visually prominent (color/size differentiation)
**And** hovering/clicking shows "Kel's Target Position" label

**Given** no data point is marked as Kel's position
**When** I view the chart
**Then** no star marker appears
**And** the chart displays normally with all competitor circles

**Technical Notes:**
- Reuse existing star marker implementation from /visualization
- Ensure only one position can be marked as Kel's target

---

### Story 2.4: Admin Add Competitor Data Point

As an Admin user (Maho),
I want to add new competitor data points to the scatter chart,
So that I can keep the competitive landscape current.

**Acceptance Criteria:**

**Given** I am logged in as Admin
**When** I click the "Add Competitor" button
**Then** a dialog/form opens with fields:
  - Company name (required)
  - Price score (1-10 slider)
  - Quality score (1-10 slider)
  - Mark as Kel's Target Position (checkbox)

**Given** I fill in valid data and click Save
**When** the save completes
**Then** the new data point appears on the chart immediately (optimistic update - NFR7)
**And** I see a success toast notification (FR29)
**And** the dialog closes

**Given** I enter a duplicate company name
**When** I try to save
**Then** I see a validation error (FR43)
**And** the form does not submit

**Technical Notes:**
- Reuse existing AddCompetitorDialog from /visualization
- Sliders default to 5 (midpoint)
- Validation before submit (FR42)

---

### Story 2.5: Admin Edit Competitor Data Point

As an Admin user (Maho),
I want to edit existing competitor information,
So that I can update data as the market evolves.

**Acceptance Criteria:**

**Given** I am logged in as Admin and click a data point
**When** the detail panel opens
**Then** I see an "Edit" button

**Given** I click Edit
**When** the edit dialog opens
**Then** the form is pre-filled with current values
**And** I can modify name, price score, quality score, Kel target status

**Given** I save changes
**When** the save completes
**Then** the chart updates immediately (optimistic update)
**And** I see "Competitor updated" toast notification
**And** the dialog closes

**Technical Notes:**
- Reuse existing EditCompetitorDialog from /visualization
- Handle unique name validation (allow same name if same record)

---

### Story 2.6: Admin Delete Competitor Data Point

As an Admin user (Maho),
I want to delete competitor data points that are no longer relevant,
So that the visualization stays accurate.

**Acceptance Criteria:**

**Given** I am logged in as Admin and have a competitor detail panel open
**When** I click the "Delete" button
**Then** a confirmation dialog appears asking "Remove Competitor?"

**Given** I confirm deletion
**When** the delete completes
**Then** the data point disappears from the chart immediately (optimistic update)
**And** I see "Competitor removed" toast notification
**And** all dialogs close

**Given** I cancel deletion
**When** the confirmation dialog closes
**Then** nothing changes
**And** I return to the detail panel

**Technical Notes:**
- Reuse existing DeleteCompetitorDialog from /visualization
- Soft delete or hard delete based on existing pattern

---

### Story 2.7: Mark/Unmark Kel's Target Position (Admin)

As an Admin user (Maho),
I want to mark a position as "Kel's Target Position",
So that the chart clearly shows our strategic positioning.

**Acceptance Criteria:**

**Given** I am editing a competitor data point
**When** I check "Mark as Kel's Target Position"
**Then** any previously marked position is automatically unmarked (only one target)
**And** the save displays this point as a star marker

**Given** a competitor is marked as Kel's target
**When** I uncheck the option and save
**Then** the point reverts to a regular circle marker

**Technical Notes:**
- Ensure database constraint or trigger maintains single Kel position
- UI shows current state clearly in checkbox

---

## Epic 3: Company Profiles Browser

**Goal:** Users can browse, search, and view detailed competitor company profiles with source traceability. Quick access to any of the 14 competitor profiles with verification through citations.

**FRs covered:** FR7, FR8, FR9, FR10, FR11, FR12, FR40, FR41

**NFRs relevant:** NFR2-4 (page load performance), NFR8-17 (accessibility)

### Story 3.1: Company Profiles Database Schema

As the system,
I want a database schema for storing company profile data,
So that the 14 competitor profiles can be managed and displayed.

**Acceptance Criteria:**

**Given** the migration runs
**When** complete
**Then** a company_profiles table exists with:
  - id (uuid, primary key)
  - name (text, required, unique)
  - category (text - manufacturer_type, market_segment, etc.)
  - revenue (numeric, nullable)
  - market_share (numeric, nullable)
  - strengths (text[], array of strength points)
  - weaknesses (text[], array of weakness points)
  - source_urls (text[], array of citation URLs)
  - created_at, updated_at timestamps

**Given** the table exists
**When** RLS policies are applied
**Then** all authenticated users can read profiles
**And** only admin users can insert/update/delete

**Technical Notes:**
- Create migration file
- Apply RLS using existing admin role pattern
- Consider linking to competitor_data via name or separate FK

---

### Story 3.2: Company Profiles List View

As a user,
I want to browse a list of all competitor company profiles,
So that I can explore the competitive landscape.

**Acceptance Criteria:**

**Given** I navigate to /market-intelligence/companies
**When** the page loads
**Then** I see a list/grid of all 14 competitor profiles
**And** each card shows: company name, category, market share (if available)
**And** the list loads within < 2 seconds (NFR6)

**Given** I click on a company card
**When** navigating
**Then** I go to the individual company profile page

**Technical Notes:**
- Create CompanyProfilesList component
- Use TanStack Query with prefetching
- Implement loading skeletons

---

### Story 3.3: Search Company Profiles

As a user,
I want to search competitor profiles by company name,
So that I can quickly find a specific competitor.

**Acceptance Criteria:**

**Given** I am on the company profiles list
**When** I type in the search field
**Then** the list filters to show only matching companies (case-insensitive)
**And** filtering happens client-side for immediate feedback
**And** "No results" message shows if no matches

**Given** I clear the search
**When** the field is empty
**Then** all companies are shown again

**Technical Notes:**
- Implement client-side filtering on loaded data
- Search input with debounce optional (small dataset)

---

### Story 3.4: Filter Companies by Category

As a user,
I want to filter competitors by category,
So that I can focus on relevant market segments.

**Acceptance Criteria:**

**Given** I am on the company profiles list
**When** I select a category filter (e.g., "Manufacturer Type: Local")
**Then** only companies matching that category are shown
**And** the active filter is visually indicated

**Given** I have a category filter active
**When** I also use search
**Then** both filters apply together (AND logic)

**Given** I clear filters
**When** the page updates
**Then** all companies are shown again

**Technical Notes:**
- Create filter dropdown or chip group
- Categories derived from existing data or predefined list
- Filter state in URL params for shareability (optional)

---

### Story 3.5: Individual Company Profile View

As a user,
I want to view the complete profile for each competitor company,
So that I understand their position, strategy, and data sources.

**Acceptance Criteria:**

**Given** I click on a company
**When** the profile page loads at /market-intelligence/companies/[id]
**Then** I see complete profile information:
  - Company name and logo (if available)
  - Category/segment
  - Revenue and market share (FR10, if available)
  - Strengths list (FR11)
  - Weaknesses list (FR11)
  - Source citations as clickable links (FR12)

**Given** revenue or market share is not available
**When** I view the profile
**Then** those fields show "Not available" rather than empty

**Technical Notes:**
- Create dynamic route app/market-intelligence/companies/[id]/page.tsx
- Use server-side prefetching for SEO (existing pattern)

---

### Story 3.6: Source Citations Display

As a user,
I want to see source URLs and citations for research data,
So that I can verify the accuracy of market intelligence.

**Acceptance Criteria:**

**Given** I am viewing a company profile
**When** sources are available
**Then** I see a "Sources" section with clickable URLs (FR40)
**And** each link opens in a new tab (target="_blank" with rel="noopener")
**And** links are styled distinctly (underlined, blue)

**Given** I want to trace an insight to original research
**When** I click a source link (FR41)
**Then** I navigate to the original research document or external source

**Technical Notes:**
- Display source_urls array as list
- External links get noopener for security

---

## Epic 4: Product Category Matrix

**Goal:** Users can explore the product landscape by category, price tier, and flavor. Visualize product distribution and identify whitespace in the market.

**FRs covered:** FR13, FR14, FR15, FR16, FR17

**NFRs relevant:** NFR1 (chart render < 1s), NFR8-17 (accessibility), NFR15 (data table alternative)

### Story 4.1: Product Data Schema

As the system,
I want a database schema for storing product data,
So that product landscape can be visualized across multiple dimensions.

**Acceptance Criteria:**

**Given** the migration runs
**When** complete
**Then** a products table exists with:
  - id (uuid, primary key)
  - name (text, required)
  - company_id (uuid, FK to company_profiles)
  - category (text - puffs, chips, crackers, etc.)
  - price_tier (text - value, mid-market, premium)
  - flavor_category (text - cheese, original, spicy, sweet, etc.)
  - price_peso (numeric, optional)
  - created_at, updated_at timestamps

**Given** the table exists
**When** RLS policies are applied
**Then** all authenticated users can read
**And** only admin users can modify

**Technical Notes:**
- Create migration with FK to company_profiles
- Indexes on category, price_tier, flavor_category for filtering

---

### Story 4.2: Products by Category View

As a user,
I want to view products organized by category,
So that I can understand the product distribution across types.

**Acceptance Criteria:**

**Given** I navigate to /market-intelligence/products
**When** the page loads
**Then** I see products grouped by category (puffs, chips, crackers, etc.)
**And** each group shows product count
**And** I can expand/collapse each category group

**Given** I click on a category
**When** the section expands
**Then** I see product cards within that category

**Technical Notes:**
- Create ProductMatrix component with accordion or tabs
- Default view shows category breakdown

---

### Story 4.3: Products by Price Tier View

As a user,
I want to view products organized by price tier,
So that I can understand market positioning by price.

**Acceptance Criteria:**

**Given** I am viewing the product matrix
**When** I switch to "By Price Tier" view
**Then** products are grouped into Value, Mid-Market, Premium
**And** each tier shows product count (FR17)
**And** the distribution is visually clear (possibly bar chart)

**Technical Notes:**
- Create view toggle: Category | Price Tier | Flavor
- Reuse grouping logic with different dimension

---

### Story 4.4: Products by Flavor Category View

As a user,
I want to view products organized by flavor category,
So that I can identify flavor trends and gaps.

**Acceptance Criteria:**

**Given** I am viewing the product matrix
**When** I switch to "By Flavor" view
**Then** products are grouped by flavor (cheese, original, spicy, sweet, etc.)
**And** each flavor shows product count
**And** I can see which flavors are most/least represented

**Technical Notes:**
- Third view option in the view toggle
- Consider color coding flavors for visual differentiation

---

### Story 4.5: Multi-Dimensional Product Filtering

As a user,
I want to filter products by multiple dimensions simultaneously,
So that I can explore specific market segments.

**Acceptance Criteria:**

**Given** I am on the product matrix page
**When** I select multiple filters (e.g., Category: Puffs AND Price Tier: Premium)
**Then** only products matching ALL criteria are shown
**And** the product count updates to reflect filtered results

**Given** I have multiple filters active
**When** I can clear individual filters or all at once
**Then** the view updates accordingly

**Given** no products match my filter combination
**When** viewing results
**Then** I see "No products found" message with suggestion to adjust filters

**Technical Notes:**
- Create FilterBar component with multiple filter dropdowns
- Filter state persists during session
- URL params for shareable filtered views (optional)

---

### Story 4.6: Product Count and Distribution Display

As a user,
I want to see product counts and distribution within each category/tier/flavor,
So that I can identify market saturation and whitespace.

**Acceptance Criteria:**

**Given** I am viewing any product grouping
**When** the data loads
**Then** each group header shows the count (e.g., "Puffs (23)")
**And** a visualization shows relative distribution (bar chart or pie chart)

**Given** I view the distribution chart
**When** hovering over a segment
**Then** I see the exact count and percentage

**Given** the chart has segments with low counts
**When** viewing
**Then** small segments are still readable (minimum size or "Others" grouping)

**Technical Notes:**
- Use Recharts for visualization (existing pattern)
- Provide data table alternative for accessibility (NFR15)

---

## Epic 5: Market Gaps Dashboard & Mobile Experience

**Goal:** Users can identify market opportunities with supporting research. Admins can manage research content. All features accessible on mobile devices.

**FRs covered:** FR18, FR19, FR20, FR26, FR27, FR35, FR36, FR37, FR38, FR39, FR42, FR43

**NFRs relevant:** NFR7 (CRUD feedback), NFR13 (prefers-reduced-motion), all accessibility NFRs

### Story 5.1: Market Gaps Summary View

As a user,
I want to view a summary of identified market gaps and opportunities,
So that I can understand where strategic openings exist.

**Acceptance Criteria:**

**Given** I navigate to /market-intelligence/gaps (or dedicated opportunities section)
**When** the page loads
**Then** I see a list of identified market gaps/opportunities
**And** each gap shows: title, description snippet, opportunity level (high/medium/low)
**And** gaps are sorted by opportunity level (highest first)

**Technical Notes:**
- Create market_gaps table or use research findings
- Create MarketGapsList component

---

### Story 5.2: Market Gap Detail with Research References

As a user,
I want to view opportunity rationale with supporting research references,
So that I can verify the analysis and dive deeper into data.

**Acceptance Criteria:**

**Given** I click on a market gap
**When** the detail view opens
**Then** I see:
  - Full description of the opportunity
  - Which market segments are underserved (FR19)
  - Rationale with supporting data (FR20)
  - Links to referenced research documents
  - Kel's target position context if relevant

**Given** research references are available
**When** I click a reference link
**Then** I navigate to the source research document

**Technical Notes:**
- Create market_gap_details table or expand existing schema
- Link references to actual research documents in market-intelligence folders

---

### Story 5.3: Underserved Segments Visualization

As a user,
I want to see which market segments are underserved,
So that I can identify specific opportunities for entry.

**Acceptance Criteria:**

**Given** I am viewing market gaps
**When** the underserved segments section loads
**Then** I see a visualization (e.g., heatmap or matrix) showing:
  - Segments with low competition
  - Segments with unmet consumer demand
  - Gap between supply and demand

**Given** I interact with the visualization
**When** I click/tap a segment
**Then** I see details about why it's underserved

**Technical Notes:**
- Could be a matrix: Category × Price Tier with color intensity for competition
- Consider using existing product data to calculate saturation

---

### Story 5.4: Admin Add Research Finding

As an Admin user (Maho),
I want to add research findings to the appropriate category,
So that I can continuously expand market intelligence.

**Acceptance Criteria:**

**Given** I am logged in as Admin
**When** I click "Add Finding" on a market gaps or research page
**Then** a form opens with:
  - Title (required)
  - Category/segment selection
  - Description (rich text)
  - Opportunity level selection
  - Source URLs (array input)

**Given** I save a new finding
**When** the save completes
**Then** the finding appears in the list immediately (optimistic update)
**And** I see a success toast notification
**And** required field validation occurs before submit (FR42)

**Technical Notes:**
- Create AddResearchDialog component
- Reuse form validation patterns

---

### Story 5.5: Admin Edit Research Finding

As an Admin user (Maho),
I want to edit existing research content,
So that I can update findings as new information emerges.

**Acceptance Criteria:**

**Given** I am viewing a research finding as Admin
**When** I click "Edit"
**Then** the edit form opens pre-filled with current values

**Given** I save changes
**When** the save completes
**Then** the content updates immediately (optimistic update)
**And** I see "Finding updated" toast notification

**Technical Notes:**
- Reuse AddResearchDialog in edit mode
- Track updated_at timestamp

---

### Story 5.6: Mobile-Responsive Layout

As a user on mobile,
I want to access all visualizations on my mobile device,
So that I can review market intelligence on the go.

**Acceptance Criteria:**

**Given** I access Market Intelligence on iPhone SE (320px) or larger
**When** any page loads
**Then** content is readable without horizontal scrolling
**And** navigation is accessible (hamburger menu or bottom nav)
**And** touch targets are at least 44x44 pixels

**Given** I am on a tablet or desktop
**When** viewing the same pages
**Then** layout adapts to use available space efficiently

**Technical Notes:**
- Use existing responsive patterns from kel-dashboard
- Tailwind breakpoints: sm, md, lg
- Test on iPhone SE viewport (375x667)

---

### Story 5.7: Mobile Touch Navigation

As a user on mobile,
I want to navigate research categories with touch gestures,
So that the experience feels native to my device.

**Acceptance Criteria:**

**Given** I am on mobile viewing a list
**When** I swipe horizontally on category tabs
**Then** tabs scroll smoothly revealing more options

**Given** I am viewing a detail panel/sheet
**When** I swipe down
**Then** the sheet dismisses (if dismissible)

**Given** animations are present
**When** user has prefers-reduced-motion enabled (NFR13)
**Then** animations are disabled or minimized

**Technical Notes:**
- Use CSS scroll-snap for tab navigation
- Bottom sheets should support swipe-to-dismiss
- Check prefers-reduced-motion media query

---

### Story 5.8: Scatter Chart Mobile Pinch-to-Zoom

As a user on mobile,
I want to pinch-to-zoom on the scatter chart,
So that I can examine clustered data points.

**Acceptance Criteria:**

**Given** I am viewing the scatter chart on mobile
**When** I pinch to zoom in
**Then** the chart zooms centered on the pinch point
**And** data points become larger and more separated

**Given** I am zoomed in
**When** I drag/pan
**Then** the chart view moves accordingly
**And** I can explore different areas of the chart

**Given** I double-tap
**When** the action completes
**Then** the chart resets to default zoom level

**Technical Notes:**
- Implement using Recharts zoom or custom gesture handler
- Consider using a library like react-zoom-pan-pinch
- Test on actual mobile device

---

### Story 5.9: Bottom Sheets for Mobile Interactions

As a user on mobile,
I want to see mobile-optimized layouts using bottom sheets instead of dialogs,
So that interactions feel natural on a touch device.

**Acceptance Criteria:**

**Given** I am on mobile and click a data point or action
**When** a detail/form view opens
**Then** it appears as a bottom sheet sliding up from the bottom
**And** I can dismiss by swiping down or tapping outside

**Given** I am on desktop
**When** the same action occurs
**Then** content appears as a centered dialog or popover

**Technical Notes:**
- Reuse existing bottom sheet pattern from /visualization
- Use Vaul or similar bottom sheet library
- Detect mobile via viewport width or touch capability

---

### Story 5.10: Data Validation and Duplicate Prevention

As the system,
I want to validate required fields and prevent duplicates,
So that data integrity is maintained.

**Acceptance Criteria:**

**Given** an Admin is adding or editing data
**When** required fields are empty
**Then** the submit button is disabled
**And** validation messages appear under empty required fields (FR42)

**Given** an Admin tries to add a competitor with an existing name
**When** they attempt to save
**Then** they see an error "A competitor with this name already exists" (FR43)
**And** the form does not submit

**Given** validation errors occur
**When** the user corrects them
**Then** error messages disappear and submit becomes enabled

**Technical Notes:**
- Client-side validation for UX
- Server-side unique constraint as backup
- Use existing form validation patterns (react-hook-form or similar)
