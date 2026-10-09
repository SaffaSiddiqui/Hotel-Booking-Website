# CLAUDE.md

This file is the main instruction and context file for Claude Code while developing this project. Read it fully before making any change. Follow it unless the user explicitly says otherwise.

---

## 1. Project Overview

**Project name:** Hotel Booking Website (Booking.com-style)

A responsive hotel booking website inspired by Booking.com. Users can search for hotels, browse matching results, view hotel details, enter their booking information, and complete a booking. All important data (users, hotels, bookings) lives in **Supabase**, not in frontend files.

### Purpose

Allow a user to:

1. Search hotels by destination, check-in date, check-out date, and number of guests.
2. View a list of available/matching hotels.
3. Open a hotel's detail page.
4. Fill in a booking form.
5. Submit the booking, which is saved in Supabase.
6. See a booking confirmation.

### Complete User Flow

```
Home Page
  -> Hotel Search
  -> Hotel Listings
  -> Hotel Details
  -> Booking Form
  -> Submit Booking
  -> Save Booking in Supabase
  -> Booking Confirmation
```

Every feature built must support this flow. Do not add features outside it unless requested.

---

## 2. Current Project Status

- The full first implementation is **built**: schema, services, components, pages, styles, and validation tests.
- `npm run lint`, `npm test` and `npm run build` pass. The app has not yet been run against a live Supabase project; do that first (see README.md).
- Future work should extend the existing structure, not restructure it.

---

## 3. Technology Stack

| Area | Technology |
|------|-----------|
| Frontend framework | React |
| Language | JavaScript (no TypeScript unless requested) |
| Backend / Database | Supabase (Postgres + `@supabase/supabase-js`) |
| Styling | Plain CSS (no CSS framework unless requested) |
| Routing | React Router |
| Build tool | Vite (recommended for React setup) |
| Config | Environment variables via `.env` |

Rules:
- Do not add libraries without a clear need. Prefer built-in browser and React features.
- Any new dependency must be justified to the user before installing.

---

## 4. Architecture

React component-based architecture with reusable components, separated by responsibility.

### Folder Structure (actual)

```
project-root/
├── CLAUDE.md
├── README.md
├── .env.example           # variable names only; real .env is git-ignored
├── supabase/schema.sql    # tables, constraints, RLS, SQL functions, seed hotels
└── src/
    ├── main.jsx, App.jsx  # entry, routes, "Supabase not configured" notice
    ├── lib/               # supabaseClient.js, serviceError.js (friendly errors)
    ├── services/          # hotelService.js, bookingService.js (ONLY place that calls Supabase)
    ├── hooks/useAsync.js  # loading / error / retry for async calls
    ├── utils/             # validation.js (+ test), format.js, searchParams.js
    ├── components/        # reusable UI (SearchForm, HotelCard, HotelList, BookingForm, StaySummary, FormField, ...)
    ├── pages/             # Home, SearchResults, HotelDetails, Booking, Confirmation, NotFound
    └── styles/            # global.css (tokens, base, forms), components.css
```

### Layer Responsibilities

- **Pages**: compose components, read route params, call services, manage page-level state.
- **Components**: presentational and reusable. Receive data via props. No direct Supabase calls.
- **Services**: the only place that talks to Supabase. Return data or throw clear errors.
- **Utils**: pure helper functions (validation, date formatting, price calculation).
- **lib/supabaseClient.js**: creates the one shared Supabase client from environment variables.

### Routes (suggested)

| Route | Page |
|-------|------|
| `/` | Home Page (search section) |
| `/hotels?destination=&checkIn=&checkOut=&guests=` | Hotel Listings |
| `/hotels/:id` | Hotel Details |
| `/booking/:hotelId` | Booking Form |
| `/confirmation/:bookingId` | Booking Confirmation |
| `*` | Not Found page |

Search criteria (destination, dates, guests) should travel through URL query parameters so pages survive refresh and can be shared. Do not rely on in-memory state alone for the flow.

---

## 5. Features

Required features:

- **Home page** with a hero and hotel search section.
- **Hotel search** by destination/location, check-in date, check-out date, and number of guests.
- **Hotel listings** showing hotels that match the search.
- **Hotel details** page: name, location, description, price, image, available rooms, guest capacity.
- **Booking form** collecting required user and booking information.
- **Booking submission** saved to Supabase.
- **Booking confirmation** page showing the saved booking details.
- **Supabase integration** for all hotel, user, and booking data.
- **Error handling** for validation and network/database failures.
- **Responsive design** for mobile, tablet, and desktop.

Out of scope unless the user requests it: payments, authentication/login, admin dashboard, reviews, maps, multi-language support.

---

## 6. Supabase / Database Structure

Supabase is the single source of truth for hotel, user, and booking data. Do **not** hardcode hotel data in frontend files (seed data belongs in `supabase/schema.sql` or Supabase itself).

### Tables

**users**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key, default `gen_random_uuid()` |
| name | text | Required |
| email | text | Required, unique |
| created_at | timestamptz | Default `now()` |

**hotels**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key, default `gen_random_uuid()` |
| name | text | Required |
| location | text | Required (city/destination, searchable) |
| description | text | |
| price | numeric(10,2) | Price per night, must be >= 0 |
| available_rooms | integer | Must be >= 0 |
| guest_capacity | integer | Must be >= 1 |
| image | text | Image URL |

**bookings**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key, default `gen_random_uuid()` |
| user_id | uuid | Foreign key -> `users.id` |
| hotel_id | uuid | Foreign key -> `hotels.id` |
| check_in | date | Required |
| check_out | date | Required, must be after `check_in` |
| guests | integer | Required, >= 1 |
| status | text | e.g. `pending`, `confirmed`, `cancelled`; default `confirmed` or `pending` |
| created_at | timestamptz | Default `now()` |

### Relationships

- One user -> many bookings (`bookings.user_id` -> `users.id`).
- One hotel -> many bookings (`bookings.hotel_id` -> `hotels.id`).

### Database Constraints (should be enforced in SQL, not only in the UI)

- `CHECK (check_out > check_in)`
- `CHECK (guests >= 1)`
- `CHECK (status IN ('pending', 'confirmed', 'cancelled'))`
- `CHECK (price >= 0)`, `CHECK (available_rooms >= 0)`, `CHECK (guest_capacity >= 1)`
- Unique constraint on `users.email`
- Indexes on `hotels.location`, `bookings.user_id`, `bookings.hotel_id`

### Security (Row Level Security)

- Enable RLS on all tables.
- `hotels`: public read access; no public write.
- `users` and `bookings`: allow only the minimum the anon key needs (e.g. insert a booking, read back a booking by its ID). Do not allow public listing of all users or all bookings.
- Document every policy in `supabase/schema.sql`.

### Availability Logic

- A hotel matches a search when its `location` matches the destination (case-insensitive, partial match), `guest_capacity >= guests`, and rooms are available for the requested dates.
- Date-aware availability should consider overlapping bookings: a booking overlaps when `existing.check_in < requested.check_out AND existing.check_out > requested.check_in`.
- Prefer doing the availability check in the database (a SQL function / RPC or a query) rather than in the client. Revisit this decision with the user when building the search feature.
- Booking creation should re-check availability at submit time to avoid overbooking. Ideally the check and insert happen atomically (e.g. a Postgres function called via `supabase.rpc`).

---

## 7. Data Flow

1. **Home Page**: the user enters destination, check-in, check-out, guests. The form is validated, then navigates to `/hotels?...` with query params.
2. **Hotel Listings**: the page reads the query params, calls `hotelService.searchHotels(...)`, and renders `HotelCard`s from Supabase results. Show loading, empty, and error states.
3. **Hotel Details**: the page calls `hotelService.getHotelById(id)` and displays full details. A "Book now" action carries the search params forward.
4. **Booking Form**: collects the user's name and email plus the booking details (hotel, dates, guests). Validated before submit.
5. **Submit Booking**: `bookingService.createBooking(...)` finds or creates the user by email, then inserts the booking with `user_id`, `hotel_id`, `check_in`, `check_out`, `guests`, and `status`.
6. **Supabase**: stores the booking with proper foreign keys.
7. **Confirmation**: on success, navigate to `/confirmation/:bookingId`, fetch the booking (with hotel info) from Supabase, and display it.

Rules:
- Data shown to the user always comes from Supabase, not from stale frontend copies.
- Never mark a booking as successful in the UI until Supabase confirms the insert.

---

## 8. Coding Rules

### General
- Keep the project clean, organized, responsive, and easy to maintain.
- Avoid duplicate code and unnecessary files. Extract repeated logic into components, hooks, or utils.
- Prefer small, focused components and functions with a single responsibility.
- Use functional components and React hooks only (no class components).
- Use clear, descriptive names. Components in `PascalCase`, functions/variables in `camelCase`, CSS classes in `kebab-case`.
- Do not leave dead code, commented-out blocks, or stray `console.log` calls.
- Do not hardcode values that belong in config or the database.

### React
- Components receive data through props and stay reusable.
- Keep Supabase calls out of presentational components; use the `services/` layer.
- Handle loading, empty, and error states for every async operation.
- Use controlled inputs for forms.
- Use `key` props correctly in lists (use database IDs).
- Clean up effects and avoid state updates after unmount or race conditions in async fetches.

### CSS
- Plain CSS, organized per component or in `styles/`.
- Define design tokens (colors, spacing, font sizes) as CSS variables in one global file.
- Mobile-first with `min-width` media queries.
- Use flexbox/grid; avoid fixed pixel widths for layout.
- Keep interactive elements accessible: visible focus states, sufficient contrast, adequate touch target size.

### Accessibility
- Use semantic HTML (`header`, `main`, `nav`, `section`, `footer`, `form`).
- Every input has an associated `<label>`.
- Images have meaningful `alt` text.
- Error messages are announced or clearly linked to their fields.

---

## 9. Environment Variables & Security

- Supabase config goes in `.env` using Vite's naming:
  ```
  VITE_SUPABASE_URL=
  VITE_SUPABASE_ANON_KEY=
  ```
- Provide a `.env.example` with variable names only.
- `.env` must be listed in `.gitignore`. Never commit real keys.
- **Never** put the Supabase `service_role` key (or any secret) in frontend code, in `.env` files that get bundled, or in the repo. Only the public `anon` key is allowed in the frontend.
- Real access control is enforced by Supabase Row Level Security, not by hiding code in the frontend.
- Validate and sanitize user input. Use Supabase's parameterized client methods; never build SQL by string concatenation.
- Do not log personal data (names, emails) to the console.

---

## 10. Validation & Error Handling

Handle these common errors with clear, user-friendly messages. Never show raw database or stack-trace errors to the user (log technical detail only in development).

### Search Validation
- Missing destination, check-in, check-out, or guests -> show which field is missing.
- Check-in date in the past -> invalid.
- Check-out date on or before check-in -> invalid.
- Guests less than 1 or not a whole number -> invalid.
- Optionally cap maximum stay length and guests with sensible limits.

### Booking Form Validation
- Name required (trimmed, non-empty).
- Email required and in a valid format.
- Dates and guests re-validated at submit (query params can be edited manually).
- Guests must not exceed the hotel's `guest_capacity`.
- Prevent double submission (disable the button and show a loading state while submitting).

### Request / Database Errors
- Failed hotel fetch -> error message with a retry option.
- Hotel not found (invalid ID) -> friendly "not found" state.
- No results -> clear empty state suggesting changing the search.
- Failed booking submission -> keep the entered form data, show a message, allow retry.
- Hotel became unavailable between viewing and booking -> explain and link back to search.
- Network offline or timeout -> generic connectivity message.
- Unknown route -> Not Found page.
- Consider a top-level React Error Boundary for unexpected render errors.

### Patterns
- Services throw errors with meaningful messages; pages catch them and set error state.
- Use a shared `ErrorMessage` component and a shared `Loader` component.
- Validation logic lives in `utils/validation.js` and is reused by both the search form and the booking form.

---

## 11. UI / UX Guidelines

- Booking.com-inspired layout: prominent search bar on the home page, card-based hotel listings with image, name, location, price per night, and a clear call to action.
- Show price per night and, on the booking form and confirmation, the total for the stay (nights x price).
- Format dates and currency consistently through shared helpers.
- Always show loading indicators for async operations.
- Responsive breakpoints: mobile (default), tablet (~768px), desktop (~1024px+).
- The search form stacks vertically on mobile and goes horizontal on larger screens.
- Images should be responsive (`max-width: 100%`, `object-fit: cover`) and lazy-loaded where appropriate, with a fallback if the image URL fails.

---

## 12. Testing Guidelines

Test each feature as it is built. At minimum, manually verify the following.

### Functional Checklist
- [ ] Home page renders the search section correctly.
- [ ] Search with valid input navigates to results with correct query params.
- [ ] Search with missing/invalid input shows errors and does not navigate.
- [ ] Results display hotels from Supabase matching the destination and guest count.
- [ ] Empty results show the empty state.
- [ ] Hotel details page shows all required fields; invalid ID shows not-found.
- [ ] Booking form validates name, email, dates, and guests.
- [ ] Successful booking creates rows in Supabase with correct `user_id`, `hotel_id`, dates, guests, and status.
- [ ] Confirmation page displays the saved booking data.
- [ ] Failed Supabase requests display friendly errors without crashing.
- [ ] Refreshing any page in the flow still works (state comes from URL and database).
- [ ] Double-clicking submit does not create duplicate bookings.
- [ ] Overlapping/overbooked requests are rejected correctly.

### Responsive Checklist
- [ ] Verified at ~375px, ~768px, and ~1280px widths.
- [ ] No horizontal scrolling on mobile.
- [ ] Forms and buttons are usable by touch.

### Database Checklist
- [ ] Foreign keys and constraints reject invalid data.
- [ ] RLS policies block unauthorized reads/writes with the anon key.
- [ ] No secret keys appear anywhere in the frontend bundle or repo.

### Automated Tests (when requested or when logic grows)
- Unit tests for `utils/validation.js` and date/price helpers (Vitest recommended with Vite).
- Component tests with React Testing Library for forms and error states.
- Mock the Supabase client in tests; never run tests against production data.

### Before Declaring a Task Done
- Run the app and exercise the affected flow.
- Run the linter and build (`npm run lint`, `npm run build`) and fix errors/warnings.
- Confirm no unused files, imports, or console logs were left behind.

---

## 13. Development Workflow for Claude Code

1. **Read this file first** and respect its rules.
2. **Plan before building.** For any substantial task, briefly outline the approach and files affected, then proceed.
3. **Build in small steps**, in this suggested order:
   1. Project setup (Vite + React, folder structure, routing, global styles, `.env.example`, `.gitignore`)
   2. Supabase schema (`supabase/schema.sql`) with tables, constraints, RLS, and seed hotels
   3. Supabase client and services
   4. Shared components (Layout, Loader, ErrorMessage) and validation utils
   5. Home page + search form
   6. Hotel listings
   7. Hotel details
   8. Booking form + submission
   9. Confirmation page
   10. Error handling polish, responsive polish, and testing
4. **Keep changes focused.** Do not refactor or modify unrelated code without being asked.
5. **Ask when unclear.** If a requirement is ambiguous or a decision affects the database design, ask the user instead of guessing.
6. **Do not** install unnecessary packages, create unnecessary files, or add features outside the defined scope.
7. **Do not** commit, push, or run destructive database operations without explicit permission.
8. **Summarize** what changed after each task: files created or modified, and how to test it.

---

## 14. Decisions Made

- Booking status defaults to `confirmed` (no payment step yet). `pending` and `cancelled` are supported by the schema.
- Availability is date-range based: `available_rooms` is the hotel's total rooms; rooms left = total minus overlapping non-cancelled bookings. Calculated in SQL (`search_hotels`, `get_hotel`).
- Users are identified by email only (find-or-create inside `create_booking`). No authentication.
- `users` and `bookings` have RLS enabled with **no** direct anon policies. All access goes through `SECURITY DEFINER` functions: `search_hotels`, `get_hotel`, `create_booking` (atomic, locks the hotel row, re-checks availability), `get_booking`.
- Currency is USD (`formatPrice` in `utils/format.js`). Seed hotel images are external URLs; `HotelImage` falls back to a placeholder if they fail.
- Still open: authentication, payments, cancellation flow, Supabase Storage for images.

---

## 15. Quick Reference

- **Stack:** React + JavaScript + Supabase + CSS (Vite)
- **Backend:** Supabase only; data lives in the database, not in frontend files
- **Tables:** `users`, `hotels`, `bookings` (bookings reference users and hotels via foreign keys)
- **Flow:** Home -> Search -> Listings -> Details -> Booking Form -> Submit -> Save in Supabase -> Confirmation
- **Secrets:** `.env` for the URL and anon key only; never expose the `service_role` key
- **Rules:** clean, no duplicate code, no unnecessary files, reusable components, handle errors, responsive
