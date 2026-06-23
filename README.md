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
npm run seed                    # load the starter grid
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

## Media storage (Cloudinary)

Uploads flow through the `/api/upload` route handler, which calls
`lib/storage.ts`. There, `saveFiles` streams each file to Cloudinary (signed,
server-side — your API secret never reaches the browser) and returns
`{ type, path }` where `path` is the Cloudinary secure URL stored on the car.
`deleteManyMedia` removes assets when a car is deleted or its media is dropped
during an edit. To swap providers (S3, local disk, …) replace the bodies in
`lib/storage.ts` and keep the signatures — no callers change.
