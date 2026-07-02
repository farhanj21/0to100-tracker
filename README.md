# 0–100 Tracker

A modern acceleration leaderboard for cars. Every car has a 0–100 km/h time and the
app ranks them automatically, fastest to slowest. Add, edit, and delete cars,
attach images and videos, and the board re-ranks itself the moment a time changes.

**Position is computed, never stored** — ranks are always derived by sorting cars
ascending by `zeroToHundred` on read.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** + **shadcn/ui** components
- **Framer Motion** — layout animations for smooth row re-ordering
- **MongoDB** + **Mongoose** (cached global connection for dev hot-reloads)
- **zod** + **react-hook-form** — typed, validated forms
- **Cloudinary** — image/video storage (signed server-side uploads)

## Quick start

```bash
npm install
cp .env.example .env.local      # then edit MONGODB_URI
npm run seed                    # load the starter grid (fresh DB only)
npm run dev                     # http://localhost:3000
```

Set `MONGODB_URI` in `.env.local` to a local MongoDB (`mongodb://127.0.0.1:27017/zero-to-hundred`)
or an Atlas connection string, and add your **Cloudinary** credentials
(`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) from the
[Cloudinary dashboard](https://cloudinary.com/console) so media uploads work.

## Scripts

| Script          | Description                              |
| --------------- | ---------------------------------------- |
| `npm run dev`   | Start the dev server                     |
| `npm run build` | Production build                         |
| `npm run start` | Run the production build                 |
| `npm run seed`  | Seed a fresh DB; refuses if cars exist (`-- --force` to wipe) |
| `npm run lint`  | Lint                                     |

## Project structure

```
app/
  api/cars/route.ts            GET (ranked) · POST (create)
  api/cars/[id]/route.ts       GET · PUT · DELETE (cleans up media)
  api/upload/route.ts          multipart media upload
  page.tsx                     leaderboard (home)
  cars/new, cars/[id], .../edit
components/
  leaderboard/                 podium, rows, filters (Framer Motion)
  car-form/                    form + media uploader
  gallery.tsx                  image/video gallery + lightbox
  ui/                          shadcn primitives
lib/
  db.ts                        cached Mongoose connection
  models/Car.ts                Car schema (no stored position)
  cars.ts                      ranked reads (.lean, _id → id, computed position)
  storage.ts                   file storage abstraction
  validation.ts                zod schemas
scripts/seed.ts                fresh-DB seed (guarded; --force to wipe)
```

## Data model

A `Car` has: `modelYear`, `manufacturer`, `carModel`, `engineSize` (L),
`powertrainType` (Petrol · Petrol / Hybrid · Petrol / Plug-In Hybrid · Diesel),
`transmission` (Auto · Manual), `induction` (NA · Turbocharged),
`zeroToHundred` (seconds), and `media[]` of `{ type: 'image' | 'video', path }`.
Timestamps are enabled. `position` is computed on read, never persisted.

## Admin access

Viewing the leaderboard is public. Adding, editing, and deleting cars (and
managing media) requires the admin passcode. Set `ADMIN_PASSCODE` and a random
`SESSION_SECRET` in `.env.local`, then visit `/login` and enter the passcode —
this sets a signed, httpOnly session cookie (7-day expiry).

Enforcement is layered:

- **Write APIs** (`POST/PUT/DELETE /api/cars`, `PATCH …/thumbnail`,
  `POST /api/upload`) call `requireApiAuth()` and return **401** without a valid
  session — the real gate.
- **`middleware.ts`** issues a **307** redirect to `/login` for `/cars/new` and
  `/cars/[id]/edit` before they render.
- **UI** hides Add / Edit / Delete / "Set as thumbnail" unless signed in.

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Auto-fill specs (free, Gemini + Google Search)

On the add/edit car form, **Auto-fill from web** looks up a car's specs so you
don't type them by hand. Enter the manufacturer, model, and year, click the
button, and it fills **engine size, powertrain, transmission, and induction**,
then showcases everything it found (including an approximate **0–100 reference**).

- **Web-grounded.** Lookups run in two steps: a Gemini call grounded in live
  **Google Search** results researches the car, then a second schema-constrained
  call structures the findings. If the research pass fails (quota/timeout) it
  falls back to a memory-only lookup automatically.
- **Free, no charges.** It uses Google Gemini's free tier. Add a free key (no
  card) from [Google AI Studio](https://aistudio.google.com/apikey) as
  `GEMINI_API_KEY` in `.env.local` (optionally `GEMINI_MODEL`). Without a key the
  button simply reports it isn't configured — the rest of the app is unaffected.
- **You stay in control.** Values are approximate (AI lookup), shown for review
  before saving. The **0–100 time is never auto-filled** — you enter it yourself,
  since it sets the leaderboard rank.

Flow: `components/car-form/car-form.tsx` → `POST /api/cars/fetch-specs`
(auth-gated) → `lib/specs.ts` (grounded research + zod-validated structuring)
→ `lib/gemini.ts` (REST via `fetch`, no SDK).

The same pipeline powers the specs generated for cars imported from the Google
Sheet (below).

## Google Sheet two-way sync

The [Sorted Table sheet](https://docs.google.com/spreadsheets/d/1DFBxwsICbicLR_CTJ797ZS357Zyy_Xfyot_VRMIOVs0/edit)
and the leaderboard keep each other in step automatically — no Google Cloud
keys, just an Apps Script inside the spreadsheet and one shared secret:

- **Sheet → site (instant):** adding a row publishes that car within seconds,
  specs auto-generated; editing a row updates its car (rows are pinned to cars
  via a hidden **Car ID** column, so renames don't duplicate).
- **Site → sheet:** any add/edit/delete on the site rewrites the sheet —
  re-sorted, positions recomputed, the sheet's combined `Petrol / Hybrid`-style
  powertrain labels preserved.
- Row deletions in the sheet are ignored (delete on the site instead), invalid
  rows are skipped and reported, and script-made writes never re-trigger the
  sync, so the loop can't echo.

Pieces: `scripts/google-apps-script/Code.gs` (lives in the sheet: onChange
trigger + web app), `POST /api/sheet-sync` (secret-gated import + returns the
canonical mirror), `lib/sheet-sync.ts` (diff/apply + mirror push),
`lib/sheet-format.ts` (pure parsing/label logic). Set `SHEET_SYNC_SECRET` and
`SHEET_WEBAPP_URL`, then follow **[docs/SHEET_SYNC_SETUP.md](docs/SHEET_SYNC_SETUP.md)**.

## Media storage (Cloudinary)

Uploads flow through the `/api/upload` route handler, which calls
`lib/storage.ts`. There, `saveFiles` streams each file to Cloudinary (signed,
server-side — your API secret never reaches the browser) and returns
`{ type, path }` where `path` is the Cloudinary secure URL stored on the car.
`deleteManyMedia` removes assets when a car is deleted or its media is dropped
during an edit. To swap providers (S3, local disk, …) replace the bodies in
`lib/storage.ts` and keep the signatures — no callers change.
