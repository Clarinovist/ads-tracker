# Architectural Health Check Report

**Date:** October 26, 2023
**Project:** Ads Tracker (Next.js + Prisma)
**Reviewer:** Jules (Senior Software Architect)

---

## 🏗️ Architectural Assessment (Current State)

The project is built on a modern and robust stack: **Next.js 16 (App Router)**, **TypeScript**, and **Prisma ORM** with **PostgreSQL**. This provides a strong foundation for type safety, performance, and developer experience.

### Key Strengths:
- **Tech Stack:** Usage of the latest Next.js features and strict TypeScript configuration ensures a scalable frontend/BFF architecture.
- **Utilities:** `src/lib` contains well-defined utilities (e.g., `meta.ts` for API interaction, `env.ts` for validation), showing an intent for modularity.
- **Database:** The database schema and Prisma setup seem solid, with migrations and proper typing.

However, the application is currently in a "transition" phase where rapid development has led to some architectural debt, particularly in the separation of business logic.

---

## ⚠️ Structural Flaws

### 1. Separation of Concerns (Business Logic Leakage)
**Issue:** Business logic and database queries are leaking into the API routes (Controllers).
**Evidence:**
- `src/app/api/campaigns/route.ts`: Directly calls `prisma.campaign.findMany` and performs heavy aggregation logic (calculating CTR, CPC, ROAS) inside the request handler.
- **Impact:** Hard to unit test logic; code duplication if other parts of the app need these metrics; controllers become bloated.

### 2. The "God Object" Anti-Pattern
**Issue:** `src/services/dataSync.ts` is doing too much.
**Evidence:**
- It handles:
    1. Orchestration of the sync process.
    2. Fetching data from Meta (orchestrating `fetchInsights`).
    3. Data transformation (parsing metrics).
    4. Database persistence (complex `upsert` logic).
- **Impact:** This file is fragile. A change to the Meta API response structure, a change to business metric definitions, or a change to the DB schema *all* require modifying this single file.

### 3. Flat Component Structure
**Issue:** `src/components` lacks hierarchy.
**Evidence:**
- High-level layout components (`AppSidebar.tsx`), feature components (`CampaignsTable.tsx`), and UI fragments (`SyncStatusIndicator.tsx`) are all siblings.
- **Impact:** As the project grows, finding components will become difficult. It's unclear which components belong to which domain.

### 4. Tight Coupling in Sync Logic
**Issue:** The sync logic is tightly coupled to the database schema.
**Evidence:**
- `dataSync.ts` constructs raw Prisma queries with deep knowledge of the schema relations.
- **Impact:** Changing the database schema (e.g., renaming a column) requires hunting down raw queries in complex service files.

---

## 💡 Refactoring Roadmap

To improve maintainability and scalability, I recommend the following step-by-step refactoring:

### Phase 1: Establish the Data Access Layer (Repository Pattern)
Abstract direct Prisma calls into Repositories. This decouples the database from the business logic.

- **Action:** Create `src/repositories/`.
- **Tasks:**
    - Create `CampaignRepository.ts`: Methods like `findWithInsights(filters)`, `upsertCampaign(data)`.
    - Create `AdRepository.ts`, `InsightRepository.ts`.
- **Benefit:** API routes and services will call `CampaignRepository.findWithInsights()` instead of `prisma.campaign.findMany({...})`.

### Phase 2: Decompose the Sync Service
Break `dataSync.ts` into specialized services focusing on Single Responsibility.

- **Action:** Refactor `src/services/dataSync.ts`.
- **Tasks:**
    - `MetaFetchService`: Strictly handles fetching data from Meta (wraps `lib/meta.ts` with error handling/retries).
    - `MetricCalculator`: Pure functions to calculate CTR, CPC, ROAS from raw data (move logic out of `parseMetrics`).
    - `SyncOrchestrator`: Coordinates the flow, calling Fetcher -> Calculator -> Repository.
- **Benefit:** You can unit test the `MetricCalculator` without mocking the database or external APIs.

### Phase 3: "Thin" Controllers
Refactor API routes to simply delegate to services.

- **Action:** Update `src/app/api/*`.
- **Tasks:**
    - Move aggregation logic from `src/app/api/campaigns/route.ts` into a `CampaignService` (or `CampaignAnalyticsService`).
    - The API route should look like:
      ```typescript
      const data = await campaignService.getPerformanceReport(filters);
      return NextResponse.json(data);
      ```
- **Benefit:** API routes become readable and focused on HTTP concerns (status codes, params parsing).

### Phase 4: Organize Components
Group components by Feature/Domain.

- **Action:** Restructure `src/components/`.
- **Proposed Structure:**
    ```
    src/components/
    ├── common/          # Shared generic components (ui/, layout/)
    ├── dashboard/       # Dashboard-specific layout
    ├── campaigns/       # Campaign-related (CampaignsTable, Filters)
    ├── ads/             # Ads-related (AdsTable)
    └── sync/            # Sync-related (SyncButton, StatusIndicator)
    ```

---
**Conclusion:** The project works and is built on great tech, but investing time in these architectural refactorings now will prevent significant technical debt as features are added.
