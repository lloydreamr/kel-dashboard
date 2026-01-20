---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
lastStep: 11
workflowStatus: complete
completedAt: 2026-01-10
inputDocuments:
  - market-intelligence/GUIDE.md
  - market-intelligence/companies/ (14 profiles)
  - market-intelligence/products/ (7 docs)
  - market-intelligence/distribution/ (7 docs)
  - market-intelligence/consumers/ (13 docs)
  - market-intelligence/trends/ (4 docs)
  - market-intelligence/supply-chain/ (3 docs)
  - market-intelligence/stakeholders/ (3+ docs)
  - market-intelligence/regulatory/ (4 docs)
  - market-intelligence/research/ (59 docs)
documentCounts:
  briefs: 1
  research: 122
  brainstorming: 0
  projectDocs: 0
workflowType: 'prd'
lastStep: 4
project_name: 'Market Intelligence Dashboard'
user_name: 'Maho'
date: '2026-01-10'
---

# Product Requirements Document - Market Intelligence Dashboard

**Author:** Maho
**Date:** 2026-01-10

## Executive Summary

The **Market Intelligence Dashboard** transforms 122 research documents into an interactive visualization layer for the Kel project. It provides a strategic view of the Philippine snack market - mapping competitors, products, distribution channels, and consumer behaviors to identify market entry opportunities.

**Vision:** "See the entire battlefield - players, products, channels, consumers - so we can find where we fit."

**Core Problem:** Months of comprehensive market research exists as static markdown files across 8 categories. Decision-makers cannot quickly identify patterns, gaps, or opportunities without manually reading through 100+ documents.

**Solution:** A visualization dashboard integrated into the existing kel-dashboard that:
- Displays competitor positioning (scatter charts, comparison matrices)
- Maps distribution networks and channel economics
- Visualizes consumer segments and behaviors
- Highlights market gaps and opportunities

**Target Users:**
- **Maho (Admin):** Full CRUD access to research data, can add/edit visualizations
- **Kel (Viewer):** Read-only access to view insights and export reports

### What Makes This Special

This isn't generic business intelligence. It's a purpose-built decision support tool for Philippine snack market entry, backed by:
- 14 competitor company profiles with strategic analysis
- Complete product landscape mapping (categories, prices, flavors)
- Distribution ecosystem understanding (sari-sari to modern trade)
- Consumer behavior research across segments and occasions
- 43+ deep-dive research documents on specific market dynamics

The dashboard answers one question: **"Where's our opportunity?"**

## Project Classification

| Attribute | Value |
|-----------|-------|
| **Technical Type** | web_app (Next.js dashboard extension) |
| **Domain** | general (market intelligence) |
| **Complexity** | Low |
| **Project Context** | Brownfield - extending existing kel-dashboard |

**Tech Stack (Existing):**
- Next.js 14 (App Router)
- Supabase (PostgreSQL + Auth)
- TanStack Query (data fetching)
- Tailwind CSS + shadcn/ui
- Recharts (already used for scatter chart visualization)

**Integration Approach:** New `/market-intelligence` route with sub-pages for each research category, reusing existing auth, layout, and component patterns.

## Success Criteria

### User Success

**For Maho (Admin):**
- Can answer any strategic question about Philippine snack market within 2 minutes
- Can visually identify market gaps without reading individual research documents
- Can update research data and see changes reflected immediately
- Can export visualizations for distributor pitch preparation

**For Kel (Viewer):**
- Can understand competitive landscape at a glance
- Can navigate between research categories intuitively
- Can view on mobile device during meetings/travel

### Business Success

| Timeframe | Success Metric |
|-----------|----------------|
| Immediate | Dashboard supports WOFEX 2026 pitch preparation |
| 1 month | All 8 research categories visualized and accessible |
| 3 months | Dashboard becomes primary tool for market decisions |
| 6 months | Can onboard new team members via dashboard tour |

### Technical Success

- **Performance:** All visualizations render in < 1 second (NFR3 compliance)
- **Responsiveness:** Full functionality on mobile devices (iPhone SE minimum)
- **Integration:** Seamless auth with existing kel-dashboard (Supabase)
- **Maintainability:** Data updates via Supabase without code changes
- **Accessibility:** WCAG 2.1 AA compliance for all visualizations

### Measurable Outcomes

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Time to strategic insight | < 2 min | User testing session |
| Chart render time | < 1 sec | Playwright E2E tests |
| Research category coverage | 8/8 | Feature completion checklist |
| Mobile usability | 100% functional | Cross-device testing |
| Data update latency | < 5 sec | Optimistic update verification |

## Product Scope

### MVP - Minimum Viable Product

Core visualizations that answer "Where's our opportunity?":

1. **Competitor Landscape View** *(exists)* - Scatter chart positioning competitors by price/quality
2. **Company Profiles Browser** - Searchable directory of 14 competitor profiles
3. **Product Category Matrix** - Visual breakdown by category, price tier, flavor
4. **Market Gaps Dashboard** - Highlighted underserved segments and opportunities

**MVP Definition of Done:** Maho can prepare a distributor pitch using only the dashboard (no markdown file searches)

### Growth Features (Post-MVP)

5. Distribution Network Map - Interactive channel visualization
6. Consumer Segment Explorer - Filter by behavior/occasion
7. Trend Timeline - Flavor lifecycle and seasonality
8. Competitor Comparison Tool - Side-by-side analysis generator
9. Export to PDF - Pitch deck material generation

### Vision (Future)

10. AI-Powered Query - Natural language search across research
11. Real-time Price Tracking - Market monitoring integration
12. Collaborative Annotations - Team insights on visualizations
13. Scenario Modeling - Position simulation tools

## User Journeys

### Journey 1: Maho Santos - Preparing the Perfect Distributor Pitch

Maho has spent months researching the Philippine snack market. She has 122 markdown files spread across 8 folders - competitor profiles, consumer behavior studies, distribution channel analysis, and regulatory requirements. The research is comprehensive, but there's a problem: WOFEX 2026 is approaching, and she needs to create a compelling pitch for distributors.

Late one Tuesday night, Maho realizes she can't remember which file has the URC market share data. She opens the market-intelligence folder and starts searching through documents. Twenty minutes later, she's still clicking through files, building a mental map of where everything is. "There has to be a better way," she thinks.

The next morning, Maho opens the new Market Intelligence Dashboard. Instead of 122 files, she sees a clean navigation with 8 research categories. She clicks "Companies" and immediately sees all 14 competitor profiles in a searchable, filterable list. The scatter chart shows competitors positioned by price and quality - URC dominates the upper-right, while a clear gap exists in the premium-affordable space.

She clicks on URC's dot and instantly sees their profile: ₱235B revenue, 35% market share, Jack n' Jill dominance, and - crucially - their weakness: slow innovation in premium flavors. She exports the competitive landscape chart for her pitch deck.

The breakthrough comes during her distributor meeting prep. What used to take 3 hours of document searching now takes 20 minutes. She can answer any question by navigating to the right visualization. When the distributor asks "What's your differentiation?", Maho pulls up the Market Gaps view showing the underserved salted egg premium segment. The visual is worth a thousand words.

### Journey 2: Kel Reyes - Understanding the Battlefield at a Glance

Kel is the strategist behind the snack market entry, but he doesn't have time to read 122 research documents. His role is high-level: validate the opportunity, approve the direction, and make go/no-go decisions. He needs to understand the market without getting lost in details.

On his commute, Kel opens the Market Intelligence Dashboard on his phone. The mobile view shows a clean summary: "Philippine Snack Market Overview" with key stats visible at a glance - ₱156B market size, 6 major players, 3 identified opportunities.

He taps "Competitive Landscape" and sees the scatter chart - even on mobile, it's clear that URC and Oishi dominate while a gap exists in premium-yet-accessible pricing. He pinches to zoom on the gap area. The visualization confirms what Maho has been telling him: there's room for a differentiated entrant.

During a quick coffee meeting with a potential advisor, Kel shows them the dashboard. "This is our research," he says, navigating through the visualizations. The advisor is impressed - not by the volume of research, but by how clearly it's presented. "You clearly understand the market," they say.

Later, when preparing for a board update, Kel can quickly pull key insights without bothering Maho. He knows where things are, can navigate intuitively, and trusts the data because he can trace it back to the research sources.

### Journey 3: Maho - Adding New Research Insights

The research never stops. Maho just finished a deep dive on pricing elasticity and needs to update the dashboard with new findings. She also noticed an error in the URC profile - their 2025 revenue was updated.

She opens the dashboard, navigates to the Products section, and clicks "Add Data" (only visible to her admin role). A form appears asking for the research type, key findings, and source URLs. She enters the pricing elasticity findings and the system shows them immediately - optimistic update before the database confirms.

Next, she navigates to URC's profile and clicks "Edit." The markdown content appears in an editor. She updates the revenue figure, adds a source citation, and saves. The change is live in seconds.

But Maho makes a mistake - she accidentally deletes a paragraph. No panic: she clicks "History" and sees the previous version. One click to restore. Crisis averted.

### Journey 4: Maho - Discovering a Market Gap

This is the "aha!" moment journey - when the dashboard reveals an insight that wasn't obvious from individual documents.

Maho is exploring the Product Category Matrix, filtering by "Puffs" category. She sees the price distribution: most competitors cluster around ₱12-15 for standard packs. She switches the view to show flavor distribution - cheese dominates, followed by BBQ.

She then overlays consumer preference data from the Consumer Segment view. The health-conscious segment is growing (23% CAGR), but almost no puffs target them. She filters for "salted egg" flavor - only Oishi and Irvins play here, and neither targets the ₱15-25 sweet spot for everyday premium.

The visualization makes it obvious: **salted egg puffs in the affordable premium segment is an open opportunity**. This wasn't a single document insight - it emerged from cross-referencing multiple research categories visually.

Maho screenshots the visualization, annotates it, and sends it to Kel. "This is our entry point," she writes. The dashboard just justified its existence.

### Journey Requirements Summary

| Capability Area | Source Journeys | Priority |
|-----------------|-----------------|----------|
| Category-based navigation | 1, 2, 3, 4 | MVP |
| Searchable/filterable profiles | 1, 3 | MVP |
| Interactive scatter chart with click-to-detail | 1, 2, 4 | MVP (exists) |
| Mobile-responsive design | 2 | MVP |
| Export/screenshot functionality | 1, 4 | MVP |
| Role-based UI (Admin/Viewer) | 2, 3 | MVP |
| CRUD operations for research data | 3 | MVP |
| Optimistic updates | 3 | MVP |
| High-level overview dashboard | 2 | MVP |
| Source traceability | 2 | MVP |
| Cross-category filtering and overlay | 4 | Growth |
| Version history/restore | 3 | Growth |

## Web App Specific Requirements

### Architecture Overview

The Market Intelligence Dashboard is built as a **Single Page Application (SPA)** within the existing Next.js 14 App Router architecture. This approach provides:
- Fast client-side navigation between research categories
- Consistent UI state across page transitions
- Optimistic updates for CRUD operations
- Server-side rendering for initial page load performance

### Browser Support Matrix

| Browser | Minimum Version | Support Level |
|---------|-----------------|---------------|
| Chrome | 100+ | Full |
| Safari | 15+ | Full |
| Firefox | 100+ | Full |
| Edge | 100+ | Full |
| Mobile Safari (iOS) | 15+ | Full |
| Chrome Mobile (Android) | 100+ | Full |

**Not Supported:** Internet Explorer (any version), legacy mobile browsers

### Responsive Design Requirements

| Breakpoint | Min Width | Target Devices | Layout |
|------------|-----------|----------------|--------|
| Mobile | 320px | iPhone SE, small phones | Single column, stacked charts |
| Tablet | 768px | iPad Mini, tablets | Two column, side navigation |
| Desktop | 1024px | Laptops, monitors | Full layout, expanded charts |
| Large | 1440px | Large monitors | Dashboard grid, parallel views |

**Mobile-First Priorities:**
- Touch-friendly chart interactions (44px minimum tap targets)
- Swipe navigation between research categories
- Bottom sheet modals (instead of dialogs) on mobile
- Collapsible sidebar for maximum chart viewport

### Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| First Contentful Paint (FCP) | < 1.5s | Lighthouse |
| Largest Contentful Paint (LCP) | < 2.5s | Lighthouse |
| Time to Interactive (TTI) | < 3.5s | Lighthouse |
| Chart Render Time | < 1s | Custom E2E timing |
| Data Fetch (cached) | < 100ms | TanStack Query |
| Data Fetch (network) | < 2s | Network waterfall |

**Optimization Strategy:**
- Server-side prefetching with HydrationBoundary
- Lazy loading for non-MVP visualizations
- Image optimization via Next.js Image component
- Code splitting per route

### SEO Strategy

**Minimal SEO Approach** (internal tool):
- Basic meta tags for bookmarking clarity
- No sitemap generation
- No robots.txt indexing
- Protected routes behind authentication

**Why:** This is a private dashboard for Maho and Kel only. Public discoverability is not a goal and would be a security concern.

### Accessibility Requirements (WCAG 2.1 AA)

| Requirement | Implementation |
|-------------|----------------|
| Color contrast | 4.5:1 minimum for text, 3:1 for UI components |
| Keyboard navigation | Full tab navigation, focus indicators |
| Screen reader support | ARIA labels on all interactive elements |
| Chart accessibility | Data table alternatives for all visualizations |
| Reduced motion | Respect `prefers-reduced-motion` for animations |
| Focus management | Trap focus in modals, restore on close |

**Chart-Specific Accessibility:**
- Scatter chart points must have `role="img"` with `aria-label`
- Filter controls must be keyboard navigable
- Data tables as fallback for complex visualizations
- High contrast mode support for chart colors

### Implementation Considerations

**Reuse from Existing kel-dashboard:**
- Authentication flow (Supabase Auth)
- Layout components (sidebar, header)
- shadcn/ui component library
- TanStack Query configuration
- Recharts scatter chart (visualization page)
- Role-based access patterns (RLS policies)

**New Development Required:**
- `/market-intelligence` route group
- Category-specific sub-routes
- Company profiles data model
- Product matrix visualization
- Market gaps summary view
- Admin CRUD interfaces

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Problem-Solving MVP
- **Core Problem:** 122 research documents exist as static markdown files; decision-makers cannot quickly identify patterns, gaps, or opportunities
- **MVP Solution:** Transform research into interactive visualizations that answer "Where's our opportunity?"
- **Success Metric:** Maho can prepare a distributor pitch using only the dashboard (no markdown file searches)

**Resource Requirements:**
- **Team size:** Solo developer (Maho)
- **Skills needed:** Next.js, React, Supabase, data visualization
- **Timeline constraint:** WOFEX 2026 (July 29, 2026)

**Why Problem-Solving MVP:**
This isn't about building a platform or generating revenue yet. It's about solving a specific pain point: finding strategic insights without reading 100+ documents. The fastest path to validated learning is proving the dashboard enables better pitch preparation than file browsing.

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
1. Journey 1: Preparing Distributor Pitch → Primary MVP journey
2. Journey 2: Understanding Battlefield at a Glance → Mobile read-only view
3. Journey 3: Adding New Research → Admin CRUD operations

**Must-Have Capabilities:**

| Feature | MVP Requirement | Rationale |
|---------|-----------------|-----------|
| Competitor Landscape View | EXISTS | Scatter chart already built in /visualization |
| Company Profiles Browser | Build | 14 competitor profiles need searchable index |
| Product Category Matrix | Build | Visual breakdown by category/price/flavor |
| Market Gaps Dashboard | Build | Summary of identified opportunities |
| Role-based access | Build | Maho (admin) vs Kel (viewer) |
| Mobile responsive | Build | Kel needs to view during meetings |
| Category navigation | Build | 8 research categories with sub-routes |

**MVP Definition of Done:**
- [ ] All 8 research categories accessible via navigation
- [ ] 14 competitor profiles viewable with search/filter
- [ ] Product matrix visualization renders < 1 second
- [ ] Market gaps summary highlights top 3 opportunities
- [ ] Maho can CRUD competitor data
- [ ] Kel can view (read-only) on mobile
- [ ] WOFEX pitch can be prepared using dashboard only

### Post-MVP Features

**Phase 2 (Growth) - Post-WOFEX:**

| Feature | Description | Dependency |
|---------|-------------|------------|
| Distribution Network Map | Interactive channel visualization | MVP company data |
| Consumer Segment Explorer | Filter by behavior/occasion | Consumer research data |
| Trend Timeline | Flavor lifecycle visualization | Trends data |
| Competitor Comparison | Side-by-side analysis generator | MVP profiles |
| Export to PDF | Pitch deck material generation | All visualizations |
| Version history | Restore previous data states | Admin CRUD |
| Cross-category overlay | Journey 4 discovery pattern | All category data |

**Phase 3 (Vision) - Future:**

| Feature | Description | Why Later |
|---------|-------------|-----------|
| AI-Powered Query | Natural language search | Requires substantial data + LLM integration |
| Real-time Price Tracking | Market monitoring | Requires external data sources |
| Collaborative Annotations | Team insights | Requires multi-user infrastructure |
| Scenario Modeling | Position simulation | Requires advanced analytics |

### Risk Mitigation Strategy

**Technical Risks:**

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Chart performance on mobile | Medium | High | Server-side prefetch, lazy loading, test on iPhone SE |
| Data model complexity | Low | Medium | Leverage existing competitor_data table pattern |
| State sync issues | Low | Medium | TanStack Query with optimistic updates (proven pattern) |

**Market/Timeline Risks:**

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| WOFEX deadline pressure | High | High | MVP-only scope, no growth features before July 29 |
| Scope creep | Medium | High | Strict MVP definition of done, defer enhancements |
| Research data incomplete | Low | Low | 122 docs already exist; manual entry for gaps |

**Resource Risks:**

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Solo developer capacity | Medium | High | Leverage existing patterns from kel-dashboard |
| Knowledge gaps | Low | Medium | Tech stack already familiar (Next.js, Supabase) |

**Contingency Plan (If Behind Schedule):**
1. Ship Competitor Landscape View only (exists)
2. Add Company Profiles Browser as searchable list (no fancy viz)
3. Skip Product Matrix, use simple table
4. Manual Market Gaps document in dashboard (not computed)

This still delivers core value: organized research access in one place.

## Functional Requirements

### Market Research Navigation

- **FR1:** Users can view the 8 research categories (companies, products, distribution, consumers, trends, supply-chain, stakeholders, regulatory) in a navigation structure
- **FR2:** Users can navigate between research categories with a single click/tap
- **FR3:** Users can see breadcrumb navigation showing current location within research hierarchy
- **FR4:** Users can access a high-level overview dashboard with key market statistics

### Competitor Analysis

- **FR5:** Users can view a scatter chart positioning competitors by price and quality scores
- **FR6:** Users can click on a competitor data point to view detailed profile information
- **FR7:** Users can view the complete company profile for each of the 14 competitors
- **FR8:** Users can search competitor profiles by company name
- **FR9:** Users can filter competitors by category (manufacturer type, market segment, etc.)
- **FR10:** Users can view competitor financials (revenue, market share) when available
- **FR11:** Users can view competitor strengths and weaknesses analysis
- **FR12:** Users can see source citations for competitor data

### Product Landscape

- **FR13:** Users can view products organized by category (puffs, chips, crackers, etc.)
- **FR14:** Users can view products organized by price tier (value, mid-market, premium)
- **FR15:** Users can view products organized by flavor category
- **FR16:** Users can filter product views by multiple dimensions simultaneously
- **FR17:** Users can see product count and distribution within each category/tier/flavor

### Market Opportunity

- **FR18:** Users can view a summary of identified market gaps and opportunities
- **FR19:** Users can see which market segments are underserved
- **FR20:** Users can view opportunity rationale with supporting research references
- **FR21:** Users can see Kel's target position highlighted relative to competitors

### Data Management (Admin Only)

- **FR22:** Admin users can add new competitor data points to the scatter chart
- **FR23:** Admin users can edit existing competitor information
- **FR24:** Admin users can delete competitor data points
- **FR25:** Admin users can mark a position as "Kel's Target Position" (star marker)
- **FR26:** Admin users can add research findings to the appropriate category
- **FR27:** Admin users can edit existing research content
- **FR28:** Admin users see immediate feedback when data changes (optimistic updates)
- **FR29:** Admin users receive confirmation notifications after successful CRUD operations

### User Access & Roles

- **FR30:** Users must authenticate to access the Market Intelligence Dashboard
- **FR31:** The system distinguishes between Admin users (Maho) and Viewer users (Kel)
- **FR32:** Viewer users see the same data visualizations as Admin users
- **FR33:** Viewer users do not see CRUD controls (Add, Edit, Delete buttons)
- **FR34:** Admin users see CRUD controls only when they have admin role

### Mobile & Responsive Experience

- **FR35:** Users can access all visualizations on mobile devices (iPhone SE minimum)
- **FR36:** Users can navigate research categories on mobile with touch gestures
- **FR37:** Users can view scatter chart on mobile with pinch-to-zoom capability
- **FR38:** Users see mobile-optimized layouts (bottom sheets instead of dialogs)
- **FR39:** Users can take screenshots of visualizations for sharing

### Data Integrity & Traceability

- **FR40:** Users can see source URLs/citations for research data
- **FR41:** Users can trace insights back to original research documents
- **FR42:** System validates required fields before saving data
- **FR43:** System prevents duplicate competitor entries (by name)

## Non-Functional Requirements

### Performance

| Requirement | Target | Measurement Method |
|-------------|--------|-------------------|
| **NFR1:** Chart visualizations render | < 1 second | Playwright E2E test timing |
| **NFR2:** Initial page load (First Contentful Paint) | < 1.5 seconds | Lighthouse audit |
| **NFR3:** Largest Contentful Paint | < 2.5 seconds | Lighthouse audit |
| **NFR4:** Time to Interactive | < 3.5 seconds | Lighthouse audit |
| **NFR5:** Data fetch (cached queries) | < 100ms | TanStack Query devtools |
| **NFR6:** Data fetch (network queries) | < 2 seconds | Network waterfall analysis |
| **NFR7:** CRUD operation feedback | < 500ms | User perceived (optimistic updates) |

**Performance Optimization Requirements:**
- Server-side prefetching with HydrationBoundary to eliminate query waterfalls
- Code splitting per route to reduce initial bundle size
- Lazy loading for non-MVP visualizations
- Memoization of computed chart data to prevent unnecessary re-renders

### Accessibility

| Requirement | Target | Standard |
|-------------|--------|----------|
| **NFR8:** Color contrast for text | 4.5:1 minimum | WCAG 2.1 AA |
| **NFR9:** Color contrast for UI components | 3:1 minimum | WCAG 2.1 AA |
| **NFR10:** Keyboard navigation | 100% of interactive elements | WCAG 2.1 AA |
| **NFR11:** Screen reader compatibility | All visualizations have text alternatives | WCAG 2.1 AA |
| **NFR12:** Focus indicators | Visible on all interactive elements | WCAG 2.1 AA |
| **NFR13:** Motion sensitivity | Respect `prefers-reduced-motion` | WCAG 2.1 AAA |

**Chart-Specific Accessibility:**
- **NFR14:** Scatter chart data points include `aria-label` with competitor name, price score, quality score
- **NFR15:** Data tables provided as accessible alternative to all chart visualizations
- **NFR16:** Filter controls navigable via keyboard (Tab, Enter, Arrow keys)
- **NFR17:** Modal/dialog focus trapped while open, restored on close

### Security

| Requirement | Implementation |
|-------------|----------------|
| **NFR18:** Authentication required | All dashboard routes require valid Supabase session |
| **NFR19:** Role-based access control | RLS policies distinguish Admin (Maho) from Viewer (Kel) |
| **NFR20:** Data authorization | Users can only access data permitted by their role |
| **NFR21:** Session management | Sessions expire after 7 days of inactivity |
| **NFR22:** HTTPS enforcement | All traffic encrypted in transit (Vercel default) |

**Security Scope Note:** As a private dashboard for 2 known users with no payment processing or external data sharing, advanced security measures (MFA, audit logging, penetration testing) are not required for MVP.

### Integration

| Requirement | Specification |
|-------------|---------------|
| **NFR23:** Authentication | Reuse existing Supabase Auth from kel-dashboard |
| **NFR24:** Database | Use existing Supabase PostgreSQL instance |
| **NFR25:** Data fetching | Reuse existing TanStack Query configuration |
| **NFR26:** UI components | Reuse existing shadcn/ui component library |
| **NFR27:** Routing | Integrate within existing Next.js 14 App Router structure |
| **NFR28:** Deployment | Deploy via existing Vercel project |

**Integration Requirement:**
- **NFR29:** New Market Intelligence routes must not break existing kel-dashboard functionality
- **NFR30:** Shared components must maintain backward compatibility

### Reliability

| Requirement | Target |
|-------------|--------|
| **NFR31:** Dashboard availability | 99% uptime (allows ~3.5 days downtime/year) |
| **NFR32:** Data durability | Supabase managed backups (daily) |
| **NFR33:** Error recovery | Graceful error states with retry options |
| **NFR34:** Offline tolerance | Display cached data when offline; queue writes |

**Reliability Scope Note:** As an internal tool for pitch preparation, brief downtime is acceptable. No SLA enforcement or automated failover required for MVP.

