# Swazi Cultural Heritage Platform

Full-stack web app preserving Swazi ceremonies, royal lineage, and cultural content for the Kingdom of Eswatini. Portfolio/BSc project by Celimphilo Dlamini.

## Stack

- **Client**: React 18 + Vite + Tailwind CSS, `client/src/`
- **Server**: Node.js + Express (ES modules), `server/src/`
- **Database**: MySQL 8 via `mysql2`
- **AI**: Google Gemini (chat), local NLP fallback (`server/ml/`)
- **Auth**: JWT (access + refresh), stored client-side in localStorage
- **Maps**: vanilla `leaflet` (not `react-leaflet` — see gotchas)
- **Email**: nodemailer/SMTP, config via `.env` or Admin → Config → Integrations (runtime override)

Two independent npm packages — install and run each separately, no shared root `package.json` script.

## Commands

```
# Server (from server/)
npm install
npm run migrate   # idempotent — safe to re-run, applies schema.sql + seeds
npm run dev        # nodemon, port 5000
npm start          # no reload

# Client (from client/)
npm install
npm run dev         # vite, port 5173
npm run build        # -> client/dist/
```

Full setup: `SETUP_GUIDE.html`. Feature walkthrough for all 4 roles: `USER_GUIDE.html`. Both are static HTML docs at the repo root — update them (not just this file) when adding a user-facing feature or changing setup steps.

## Roles

`admin`, `user`, `history_keeper`, `ceremony_keeper`. Practitioner = either keeper role, shares `PractitionerLayout`/`/practitioner/*` routes, sidebar adapts per role. Self-registration always creates `user`; role changes only via admin.

## Architecture conventions

**Server routes are one file.** `server/src/routes/index.js` holds nearly every route, organized into per-feature `Router()` instances (`seminarRouter`, `imvunuloListingsRouter`, `publicationsRouter`, etc.), each mounted at the bottom of the file. A few older features (ceremonies, auth) have dedicated `controllers/*.controller.js` files instead — both patterns coexist, follow whichever the feature you're touching already uses.

**Models**: most features get their own `server/src/models/<feature>.model.js`, re-exported through `server/src/models/models.js` so routes import everything from one place (`import { X } from "../models/models.js"`). A few models (Seminar, Notification, Ceremony via a separate file) are inlined directly in `models.js` — inconsistent, but that's the existing pattern; don't refactor it as a drive-by.

**Public GET routes before `.use(protect)`.** Every feature router follows: unauthenticated `GET /` and `GET /:id` first, then `router.use(protect)`, then role-gated routes (`practitionersOnly`, `adminOnly`, `historyKeeperOnly`). Copy this shape for new routers.

**Content review workflow** (ceremonies, lineage, publications): `status` ENUM `draft/pending_review/published/rejected`, `created_by`/`reviewed_by`/`rejection_note` columns. Submitting always goes to `pending_review`; editing a `published`/`rejected` item resets it to `pending_review`. Admin approves/rejects via `PATCH /:id/review`, which emails via `pendingReviewEmail`/`contentReviewedEmail` (`server/src/utils/emailTemplates.js`). Admin UI: `client/src/pages/admin/ContentReview.jsx`, tabbed by content type.

**Enquiry-based commerce** (services/Marketplace, imvunulo listings): no payment/checkout — buyer messages seller, threaded replies (`enquiries` + `enquiry_messages`-shaped table pair per feature, kept separate rather than polymorphic since the UI hardcodes field names per feature). New enquiries fire both an in-app notification (`notify()`/`notifyMany()` in `routes/index.js`, backed by the generic `notifications` table + bell icon `NotificationBell.jsx`) and an email.

**Location fields**: `location_name` + `latitude`/`longitude` DECIMAL(10,7), filled via `client/src/components/common/PlaceAutocomplete.jsx` (free Nominatim/OpenStreetMap search, no API key). Displayed via `client/src/components/common/CultureMap.jsx` (vanilla Leaflet, `markers={[{lat,lng,title,subtitle,type}]}` prop, add new marker colors to its `MARKER_COLORS` map per feature).

**Scheduler**: `server/src/utils/scheduler.js` runs every 30s, auto-transitions `cinemas` (`scheduled→live`) and `seminars` (`scheduled→ongoing→completed`). Add new time-driven status transitions here, not in a route handler.

## Naming collisions to watch for

`ImvunuloModel` (admin-managed ceremony-attire vocabulary, `imvunulo_presets`/`imvunulo` tables) is unrelated to `ImvunuloListingModel` (the rental/sale catalogue, `imvunulo_listings` table). Never shorten the latter to bare `Imvunulo*`.

## Database

Single file: `server/database/migrations/schema.sql`, run via `server/database/migrate.js` (`npm run migrate`). New tables use `CREATE TABLE IF NOT EXISTS`; new columns on *existing* tables need an explicit `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` right after the `CREATE TABLE` block, since `CREATE TABLE IF NOT EXISTS` alone won't retrofit a running database. Both are idempotent — re-running migrate is always safe.

`mysql2` returns `DECIMAL` columns as strings — coerce with `parseFloat`/`Number` before doing math or passing to Leaflet (`CultureMap.jsx` already does this for marker coords). `JSON` columns need `JSON.stringify()` on write and `JSON.parse()` (or an array-check) on read since the driver doesn't auto-serialize.

## API shape

Base path `/api/v1` (not `/api` — a common mistake when testing with curl). Responses: `{success, data, message}` via `success()`/`created()`, or `{success, data, meta:{total,page,limit,totalPages}}` via `paginated()` (`server/src/utils/apiResponse.js`). Admin list endpoints that feed `ContentReview.jsx` must use `paginated()`, not a flat array — the shared UI expects `{data, meta}`.

## No automated test suite

Verify backend changes with a throwaway Node script using `fetch` against the running dev server (register → promote role via direct DB update → login → exercise endpoint → clean up test rows), or `curl`. `node`'s `fetch` has been flaky doing rapid sequential calls in this environment — `curl` is more reliable for quick checks. Verify frontend changes with `npm run build` (catches import/JSX errors) since there's no browser automation available by default; ask the user to click through anything that needs visual confirmation.

## Bilingual UI

`client/src/lib/uiStrings.js` — flat `en`/`ss` (siSwati) string maps, accessed via `ui(lang, key)` (falls back to English, then the raw key). Only nav labels and homepage copy are fully bilingual; most feature page body text (Seminars, Imvunulo, Tourism, Library, Marketplace) is English-only — consistent existing gap, not a regression to fix incidentally.
