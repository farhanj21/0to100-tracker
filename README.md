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
- Local file storage under `public/uploads` (swap-ready for S3/Cloudinary)

## Quick start

```bash
npm install
cp .env.example .env.local      # then edit MONGODB_URI
npm run seed                    # load the starter grid
npm run dev                     # http://localhost:3000
```

Set `MONGODB_URI` in `.env.local` to a local MongoDB (`mongodb://127.0.0.1:27017/zero-to-hundred`)
or an Atlas connection string.

## Scripts

| Script          | Description                              |
| --------------- | ---------------------------------------- |
| `npm run dev`   | Start the dev server                     |
| `npm run build` | Production build                         |
| `npm run start` | Run the production build                 |
| `npm run seed`  | Clear + reseed the cars collection       |
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
scripts/seed.ts                idempotent seed
```

## Data model

A `Car` has: `modelYear`, `manufacturer`, `carModel`, `engineSize` (L),
`powertrainType` (Petrol · Petrol / Hybrid · Petrol / Plug-In Hybrid · Diesel),
`transmission` (Auto · Manual), `induction` (NA · Turbocharged),
`zeroToHundred` (seconds), and `media[]` of `{ type: 'image' | 'video', path }`.
Timestamps are enabled. `position` is computed on read, never persisted.

## Swapping storage for S3/Cloudinary

All media I/O goes through `lib/storage.ts` (`saveFile` / `deleteFile`), which
deal only in public URL paths. Replace their bodies with provider SDK calls and
return the provider URL — no callers change.
