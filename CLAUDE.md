# Klip-Calendar — Barbershop Dashboard

Web-based calendar and management dashboard for barbershop owners. Functions like Google Calendar, displaying direct bookings and external calendar events.

## Commands

- `npm run dev` — starts frontend (Vite) + backend (Express) together on port 5000
- `npm run build` — production build via `script/build.ts`
- `npm run start` — run production build
- `npm run check` — TypeScript type check
- `npm run db:push` — push Drizzle schema changes to PostgreSQL

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui (Radix primitives)
- **Backend**: Express 5 + Node.js, served via `tsx`
- **Database**: PostgreSQL with Drizzle ORM; schema in `shared/schema.ts`
- **Routing**: `wouter` (client-side), Express (server-side)
- **State / Data fetching**: TanStack React Query
- **Forms**: react-hook-form + zod

## Project Structure

```
client/src/
  pages/       # dashboard, calendar-view, barbers, services-page, bookings-page,
               # working-hours, calendar-sync, settings-page
  components/  # app-sidebar, theme-provider, theme-toggle, ui/ (shadcn)
server/
  index.ts     # entry point
  routes.ts    # all API route handlers
  storage.ts   # DB access layer
  db.ts        # Drizzle client setup
  seed.ts      # seed data
shared/
  schema.ts    # Drizzle table definitions + Zod schemas (shared by client and server)
```

## Data Models (shared/schema.ts)

| Table | Purpose |
|---|---|
| `businesses` | Single barbershop info |
| `staff_members` | Barbers — roles, colors, bios |
| `services` | Service catalog — duration, price, categories |
| `working_hours` | Per-barber weekly schedules |
| `bookings` | Appointments with clients, times, prices |
| `blocked_times` | Time slots blocked from external calendars |
| `calendar_syncs` | External calendar sync configurations |

## API Routes (all prefixed `/api`)

- `GET/PATCH /business`
- `GET/POST/PATCH/DELETE /staff`, `/staff/:id`
- `GET/POST/PATCH/DELETE /services`, `/services/:id`
- `GET/PUT /working-hours/:staffId`
- `GET/POST/PATCH /bookings`, `/bookings/:id`
- `GET/POST/DELETE /blocked-times`, `/blocked-times/:id`
- `GET/POST/DELETE /calendar-syncs`, `/calendar-syncs/:id`

## Key Features

1. Dashboard with stats overview
2. Week/Day calendar with color-coded bookings per barber
3. Staff CRUD management
4. Services CRUD with categories
5. Working hours config per barber
6. Bookings management (create, view, cancel)
7. External calendar sync (Google, Vagaro, Booksy, iCal)
8. Business settings
9. Dark mode via `next-themes`
