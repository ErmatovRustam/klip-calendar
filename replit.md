# Klip-Calendar - Barbershop Dashboard

## Overview
A web-based calendar and management dashboard for barbershop owners. Functions like Google Calendar, displaying direct bookings and external calendar events.

## Tech Stack
- Frontend: React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- Backend: Express.js + Node.js
- Database: PostgreSQL with Drizzle ORM
- Routing: wouter (client), Express (server)
- State: TanStack React Query

## Project Structure
- `client/src/pages/` - All page components (dashboard, calendar-view, barbers, services-page, bookings-page, working-hours, calendar-sync, settings-page)
- `client/src/components/` - Shared components (app-sidebar, theme-provider, theme-toggle, ui/)
- `server/` - Express backend (routes.ts, storage.ts, db.ts, seed.ts)
- `shared/schema.ts` - Drizzle schema definitions for all tables

## Data Models
- **businesses** - Business info (single barbershop)
- **staff_members** - Barbers with roles, colors, and bios
- **services** - Services with duration, price, categories
- **working_hours** - Per-barber weekly schedules
- **bookings** - Appointments with clients, times, prices
- **blocked_times** - Blocked time slots from external calendars
- **calendar_syncs** - External calendar sync configurations

## API Routes (all prefixed /api)
- GET/PATCH /business
- GET/POST/PATCH/DELETE /staff, /staff/:id
- GET/POST/PATCH/DELETE /services, /services/:id
- GET/PUT /working-hours/:staffId
- GET/POST/PATCH /bookings, /bookings/:id
- GET/POST/DELETE /blocked-times, /blocked-times/:id
- GET/POST/DELETE /calendar-syncs, /calendar-syncs/:id

## Key Features
1. Dashboard with stats overview
2. Week/Day calendar view with color-coded bookings per barber
3. Staff (barbers) CRUD management
4. Services CRUD management with categories
5. Working hours configuration per barber
6. Bookings management (create, view, cancel)
7. Calendar sync for external calendars (Google, Vagaro, Booksy, iCal)
8. Business settings management
9. Dark mode support

## Running
- `npm run dev` starts both frontend (Vite) and backend (Express) on port 5000
- `npm run db:push` to push schema changes
