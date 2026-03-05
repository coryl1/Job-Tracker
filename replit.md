# JobTrackr

A Kanban-style job search tracker built with React, Express, and PostgreSQL. Prospects are organized into columns by pipeline status and can be created, edited, and deleted through a clean card-based interface.

## Tech Stack

- **Frontend**: React 18 (Vite), Tailwind CSS, shadcn/ui, TanStack React Query, wouter
- **Backend**: Express.js (TypeScript), Drizzle ORM, node-postgres
- **Database**: PostgreSQL

## File Structure

```
shared/schema.ts              - Database table definitions (prospects + phase_history), Zod validation, TypeScript types
server/
  index.ts                    - Express app bootstrap, middleware, server start
  db.ts                       - PostgreSQL connection pool (Drizzle)
  routes.ts                   - API route handlers (GET/POST/PATCH/DELETE + phase history endpoints)
  storage.ts                  - Storage interface + DatabaseStorage class
  prospect-helpers.ts         - Pure helper functions (validateProspect, buildPhaseHistory, shouldRecordPhase, validatePhaseDate)
  __tests__/                  - Jest tests for validation and phase history logic
client/src/
  App.tsx                     - Root component, routing, providers
  pages/home.tsx              - Kanban board with 7 status columns + per-column interest filters
  components/
    prospect-card.tsx         - Card component with edit/delete actions + phase history display
    add-prospect-form.tsx     - Dialog form for creating prospects (sends local date for initial phase)
    edit-prospect-form.tsx    - Dialog form for editing prospects + manual phase date editing
    ui/                       - shadcn/ui primitives
```

## Database

Two tables:
- `prospects`: id, company_name, role_title, job_url, status, interest_level, notes, salary (integer, nullable), created_at
- `phase_history`: id, prospect_id (FK → prospects.id, cascade delete), phase, date (text, YYYY-MM-DD)

- **Statuses**: Bookmarked, Applied, Phone Screen, Interviewing, Offer, Rejected, Withdrawn
- **Interest levels**: High, Medium, Low

## API

- `GET /api/prospects` - list all with phase history, ordered by created_at DESC
- `POST /api/prospects` - create (validated with Zod), auto-records initial phase date
- `PATCH /api/prospects/:id` - partial update; auto-records new phase date on status change (only if first time in that phase)
- `DELETE /api/prospects/:id` - delete (cascades phase history)
- `GET /api/prospects/:id/phase-history` - get phase history for a prospect
- `PUT /api/prospects/:id/phase-history` - manually set/override a phase date

## Phase History Logic

- On prospect creation, the initial status and local date are recorded automatically
- On status change, the new phase date is recorded only if the card has never been in that phase before
- Users can manually override any phase date via the edit form's date pickers
- Phase history persists in the database across refreshes

## Running

- `npm run dev` starts the full app (Express + Vite)
- `npm run db:push` syncs schema to database
- `npx jest` runs tests (20 tests covering validation + phase history)
