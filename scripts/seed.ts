/**
 * Standalone seed script for a FRESH database.
 *
 *   npm run seed            # safe: aborts if cars already exist
 *   npm run seed -- --force # destructive: wipes the collection, then reseeds
 *
 * Connects to MONGODB_URI (from .env.local). Seeding clears the entire cars
 * collection before inserting the starter grid, so by default the script
 * refuses to run when any cars already exist — pass --force (or set
 * SEED_FORCE=1) to override and wipe. On an empty collection it just seeds.
 *
 * Note: position/rank is never seeded — it is computed at read time by sorting
 * on zeroToHundred. We only provide the raw 0–100 times.
 */
import { config } from "dotenv";
import mongoose from "mongoose";

// Load .env.local first (fall back to .env) before reading MONGODB_URI.
config({ path: ".env.local" });
config();

import Car, { type ICar } from "../lib/models/Car";

type SeedCar = Omit<
  ICar,
  "createdAt" | "updatedAt" | "media" | "specs" | "features" | "variant"
> & {
  media?: ICar["media"];
  specs?: ICar["specs"];
  features?: ICar["features"];
  variant?: ICar["variant"];
};

// A spread of real-world cars covering every enum value and a range of years.
// All media arrays are empty — thumbnails fall back to a placeholder until you
// upload images/videos through the app.
const CARS: SeedCar[] = [
  { modelYear: 2017, manufacturer: "Toyota", carModel: "Camry", engineSize: 2.5, powertrainType: "Petrol / Hybrid", transmission: "Auto", induction: "NA", zeroToHundred: 6.87 },
  { modelYear: 2011, manufacturer: "Hyundai", carModel: "Sonata", engineSize: 2.4, powertrainType: "Petrol", transmission: "Auto", induction: "NA", zeroToHundred: 6.91 },
  { modelYear: 2024, manufacturer: "Haval", carModel: "H6", engineSize: 1.5, powertrainType: "Petrol / Hybrid", transmission: "Auto", induction: "Turbocharged", zeroToHundred: 8.21 },
  { modelYear: 2007, manufacturer: "BMW", carModel: "E65 730D", engineSize: 3.0, powertrainType: "Diesel", transmission: "Auto", induction: "Turbocharged", zeroToHundred: 8.71 },
  { modelYear: 2022, manufacturer: "Chery", carModel: "Tiggo 8 Pro", engineSize: 1.6, powertrainType: "Petrol", transmission: "Auto", induction: "Turbocharged", zeroToHundred: 9.09 },
  { modelYear: 2019, manufacturer: "Nissan", carModel: "Note e-Power", engineSize: 1.2, powertrainType: "Petrol / Hybrid", transmission: "Auto", induction: "NA", zeroToHundred: 9.11 },
  { modelYear: 2021, manufacturer: "Toyota", carModel: "Yaris", engineSize: 1.5, powertrainType: "Petrol", transmission: "Auto", induction: "NA", zeroToHundred: 9.25 },
  { modelYear: 2023, manufacturer: "Toyota", carModel: "Corolla X Altis Grande", engineSize: 1.8, powertrainType: "Petrol", transmission: "Auto", induction: "NA", zeroToHundred: 9.27 },
  { modelYear: 2020, manufacturer: "Nissan", carModel: "Sentra", engineSize: 2.0, powertrainType: "Petrol", transmission: "Auto", induction: "NA", zeroToHundred: 9.81 },
  { modelYear: 2023, manufacturer: "Toyota", carModel: "Fortuner Legender", engineSize: 2.8, powertrainType: "Diesel", transmission: "Auto", induction: "Turbocharged", zeroToHundred: 10.04 },
  { modelYear: 2014, manufacturer: "Toyota", carModel: "Prius", engineSize: 1.8, powertrainType: "Petrol / Hybrid", transmission: "Auto", induction: "NA", zeroToHundred: 10.2 },
  { modelYear: 2007, manufacturer: "Toyota", carModel: "Prius", engineSize: 1.5, powertrainType: "Petrol / Hybrid", transmission: "Auto", induction: "NA", zeroToHundred: 10.51 },
  { modelYear: 2022, manufacturer: "Hyundai", carModel: "Sonata", engineSize: 2.5, powertrainType: "Petrol", transmission: "Auto", induction: "NA", zeroToHundred: 10.74 },
  { modelYear: 2021, manufacturer: "Hyundai", carModel: "Tucson", engineSize: 2.0, powertrainType: "Petrol", transmission: "Auto", induction: "NA", zeroToHundred: 11.39 },
  { modelYear: 2026, manufacturer: "Changan", carModel: "Oshan X7 FutureSense", engineSize: 1.5, powertrainType: "Petrol", transmission: "Auto", induction: "Turbocharged", zeroToHundred: 11.47 },
  { modelYear: 2008, manufacturer: "Honda", carModel: "Civic", engineSize: 1.8, powertrainType: "Petrol", transmission: "Auto", induction: "NA", zeroToHundred: 11.87 },
  { modelYear: 2025, manufacturer: "Toyota", carModel: "Corolla Cross X", engineSize: 1.8, powertrainType: "Petrol / Hybrid", transmission: "Auto", induction: "NA", zeroToHundred: 12.27 },
  { modelYear: 2012, manufacturer: "Toyota", carModel: "Corolla GLI", engineSize: 1.6, powertrainType: "Petrol", transmission: "Auto", induction: "NA", zeroToHundred: 12.84 },
  { modelYear: 2024, manufacturer: "Toyota", carModel: "Yaris GLI", engineSize: 1.3, powertrainType: "Petrol", transmission: "Auto", induction: "NA", zeroToHundred: 13.07 },
  { modelYear: 2022, manufacturer: "Changan", carModel: "Alsvin Lumiere", engineSize: 1.5, powertrainType: "Petrol", transmission: "Auto", induction: "NA", zeroToHundred: 13.64 },
  { modelYear: 2018, manufacturer: "Toyota", carModel: "Corolla GLI", engineSize: 1.3, powertrainType: "Petrol", transmission: "Manual", induction: "NA", zeroToHundred: 14.27 },
  { modelYear: 2005, manufacturer: "Mitsubishi", carModel: "Galant", engineSize: 2.0, powertrainType: "Diesel", transmission: "Manual", induction: "Turbocharged", zeroToHundred: 14.87 },
  { modelYear: 2016, manufacturer: "Toyota", carModel: "Corolla GLI", engineSize: 1.3, powertrainType: "Petrol", transmission: "Auto", induction: "NA", zeroToHundred: 14.94 },
  { modelYear: 2012, manufacturer: "Honda", carModel: "City", engineSize: 1.3, powertrainType: "Petrol", transmission: "Manual", induction: "NA", zeroToHundred: 18.01 },
  { modelYear: 2014, manufacturer: "Daihatsu", carModel: "Mira", engineSize: 0.6, powertrainType: "Petrol", transmission: "Auto", induction: "NA", zeroToHundred: 18.02 },
  { modelYear: 2007, manufacturer: "Toyota", carModel: "Passo", engineSize: 1.0, powertrainType: "Petrol", transmission: "Auto", induction: "NA", zeroToHundred: 18.21 },
  { modelYear: 2011, manufacturer: "Subaru", carModel: "Pleo", engineSize: 0.6, powertrainType: "Petrol", transmission: "Auto", induction: "NA", zeroToHundred: 18.92 },
  { modelYear: 2009, manufacturer: "Toyota", carModel: "Vitz", engineSize: 1.0, powertrainType: "Petrol", transmission: "Auto", induction: "NA", zeroToHundred: 19.24 },
  { modelYear: 2014, manufacturer: "Suzuki", carModel: "Mehran", engineSize: 0.6, powertrainType: "Petrol", transmission: "Manual", induction: "NA", zeroToHundred: 33.21 },
  { modelYear: 2025, manufacturer: "Hyundai", carModel: "Santa Fe", engineSize: 1.6, powertrainType: "Petrol / Hybrid", transmission: "Auto", induction: "Turbocharged", zeroToHundred: 8.17 },
  { modelYear: 2026, manufacturer: "Kia", carModel: "Sportage L", engineSize: 1.6, powertrainType: "Petrol / Hybrid", transmission: "Auto", induction: "Turbocharged", zeroToHundred: 8.24 },
  { modelYear: 2026, manufacturer: "Chery", carModel: "Tiggo 8", engineSize: 1.5, powertrainType: "Petrol / Plug-In Hybrid", transmission: "Auto", induction: "Turbocharged", zeroToHundred: 6.57 },
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error(
      "✗ MONGODB_URI is not set. Copy .env.example to .env.local and set it."
    );
    process.exit(1);
  }

  const force =
    process.argv.includes("--force") || process.env.SEED_FORCE === "1";

  console.log("→ Connecting to MongoDB…");
  await mongoose.connect(uri);

  // Safety guard: seeding wipes the whole collection, so never run against a
  // populated database unless the caller explicitly opts in with --force.
  const existing = await Car.countDocuments();
  if (existing > 0 && !force) {
    console.error(
      `\n✗ Refusing to seed: ${existing} car${existing === 1 ? "" : "s"} already in the database.\n` +
        "  Seeding clears the ENTIRE cars collection first — this would delete them.\n\n" +
        "  If you really want to wipe everything and reload the 33 sample cars, run:\n" +
        "    npm run seed -- --force   (or set SEED_FORCE=1)\n"
    );
    await mongoose.disconnect();
    process.exit(1);
  }

  if (existing > 0) {
    console.log(`→ --force set: clearing ${existing} existing cars…`);
  }
  await Car.deleteMany({});

  console.log(`→ Inserting ${CARS.length} cars…`);
  await Car.insertMany(CARS.map((c) => ({ ...c, media: c.media ?? [] })));

  const count = await Car.countDocuments();
  console.log(`✓ Seed complete — ${count} cars on the grid.`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(async (err) => {
  console.error("✗ Seed failed:", err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
