import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, AlertTriangle, Flag } from "lucide-react";
import { getRankedCars } from "@/lib/cars";
import { leaderboardStats, type LeaderboardStats } from "@/lib/stats";
import { BarRow } from "@/components/viz/bar-row";
import { Breakdown } from "@/components/viz/breakdown";
import { StaticDistribution } from "@/components/viz/static-distribution";
import { CountUp } from "@/components/count-up";
import { Reveal } from "@/components/reveal";
import { cn, formatTime } from "@/lib/utils";
import type { CarDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "By the Numbers · 0–100",
  description:
    "The 0–100 field in aggregate: distribution, breakdowns, and records.",
};

export default async function NumbersPage() {
  let cars: CarDTO[] = [];
  let error = false;

  try {
    cars = await getRankedCars();
  } catch (err) {
    console.error("Failed to load stats:", err);
    error = true;
  }

  return (
    <div className="space-y-12">
      <header>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> The board
        </Link>
        <h1 className="mt-3 font-display text-6xl leading-[0.92] tracking-tight sm:text-7xl">
          By the <span className="italic">Numbers</span>
        </h1>
        <p className="mt-3 max-w-prose text-sm text-muted-foreground">
          Every time is the 0–100 km/h sprint, in seconds. Quicker is better.
        </p>
      </header>

      {error ? (
        <ConnectionError />
      ) : cars.length === 0 ? (
        <Empty />
      ) : (
        <NumbersBody cars={cars} stats={leaderboardStats(cars)} />
      )}
    </div>
  );
}

function NumbersBody({ cars, stats }: { cars: CarDTO[]; stats: LeaderboardStats }) {
  const maxBand = Math.max(...stats.bands.map((b) => b.count));
  const leadBand = stats.bands.findIndex((b) => b.count > 0);
  const leaderId = stats.quickest.id;
  const domain: [number, number] = [
    stats.quickest.zeroToHundred,
    stats.slowest.zeroToHundred,
  ];

  const records = [
    { label: "Quickest manual", car: stats.records.quickestManual },
    { label: "Quickest automatic", car: stats.records.quickestAuto },
    { label: "Quickest naturally aspirated", car: stats.records.quickestNA },
    { label: "Quickest turbocharged", car: stats.records.quickestTurbo },
    { label: "Newest", car: stats.records.newest },
    { label: "Oldest", car: stats.records.oldest },
  ].filter((r): r is { label: string; car: CarDTO } => r.car !== null);

  return (
    <div className="space-y-14">
      <KeyFigures stats={stats} />

      <Section
        title="Distribution"
        caption="Each car as a dot, slowest to quickest, then counted into one-second bands."
      >
        <div className="mb-10 max-w-3xl">
          <StaticDistribution cars={cars} domain={domain} leaderId={leaderId} />
          <div className="mt-3 flex justify-end">
            <Link
              href="/race?all=1"
              className="group inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-primary"
            >
              <Flag className="h-3.5 w-3.5" /> Watch them race
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
        <div className="max-w-3xl">
          {stats.bands.map((b, i) => (
            <BarRow
              key={b.label}
              label={b.label}
              value={b.count}
              max={maxBand}
              valueLabel={`${b.count} ${b.count === 1 ? "car" : "cars"}`}
              highlight={i === leadBand}
              index={i}
            />
          ))}
        </div>
      </Section>

      {stats.fuels.length > 0 && (
        <Section title="Fuel">
          <Breakdown rows={stats.fuels} leaderId={leaderId} />
        </Section>
      )}

      <Section title="Powertrain">
        <Breakdown rows={stats.powertrains.map(ptRow)} leaderId={leaderId} />
      </Section>

      <Section title="Induction & transmission">
        <div className="space-y-8">
          <Breakdown rows={stats.induction} leaderId={leaderId} />
          <Breakdown rows={stats.transmission} leaderId={leaderId} />
        </div>
      </Section>

      <Section title="By decade">
        <Breakdown rows={stats.decades} leaderId={leaderId} />
      </Section>

      <Section title="Engine size">
        <Breakdown rows={stats.engineBands} leaderId={leaderId} />
      </Section>

      <Section title="Records">
        <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-3">
          {records.map((r) => (
            <RecordCell key={r.label} label={r.label} car={r.car} />
          ))}
        </div>
      </Section>

      <Section
        title="By manufacturer"
        caption="Sorted by each marque's quickest car."
      >
        <div className="overflow-x-auto border border-border bg-card">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-foreground/70 text-left font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                <th className="px-4 py-3 font-normal">Manufacturer</th>
                <th className="px-4 py-3 text-right font-normal">Cars</th>
                <th className="px-4 py-3 text-right font-normal">Quickest</th>
                <th className="px-4 py-3 text-right font-normal">Average</th>
              </tr>
            </thead>
            <tbody>
              {stats.manufacturers.map((m, i) => (
                <tr
                  key={m.manufacturer}
                  className="border-b border-border/60 last:border-0"
                >
                  <td className="px-4 py-3 font-medium">{m.manufacturer}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                    {m.count}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right font-mono tabular-nums",
                      i === 0 ? "font-bold text-primary" : "text-foreground"
                    )}
                  >
                    {formatTime(m.quickest.zeroToHundred)}
                    <span className="text-muted-foreground"> s</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-muted-foreground">
                    {formatTime(m.mean)}
                    <span> s</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}

function KeyFigures({ stats }: { stats: LeaderboardStats }) {
  const cells: { label: string; value: number; decimals: number; unit: string }[] = [
    { label: "Quickest", value: stats.quickest.zeroToHundred, decimals: 2, unit: "s" },
    { label: "Slowest", value: stats.slowest.zeroToHundred, decimals: 2, unit: "s" },
    { label: "Average", value: stats.mean, decimals: 2, unit: "s" },
    { label: "Median", value: stats.median, decimals: 2, unit: "s" },
    { label: "Spread", value: stats.spread, decimals: 2, unit: "s" },
    { label: "Cars", value: stats.count, decimals: 0, unit: "" },
  ];
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-3 lg:grid-cols-6">
      {cells.map((c) => (
        <div key={c.label}>
          <div className="font-mono text-3xl font-bold tabular-nums tracking-tight sm:text-4xl">
            <CountUp value={c.value} decimals={c.decimals} />
            {c.unit && (
              <span className="ml-0.5 text-base font-normal text-muted-foreground">
                {c.unit}
              </span>
            )}
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {c.label}
          </div>
        </div>
      ))}
    </div>
  );
}

function RecordCell({ label, car }: { label: string; car: CarDTO }) {
  return (
    <Link
      href={`/cars/${car.slug}`}
      className="group block bg-background p-4 transition-colors hover:bg-secondary/40"
    >
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 truncate font-display text-xl leading-tight">
        {car.manufacturer}{" "}
        <span className="text-muted-foreground">{car.carModel}</span>
      </div>
      <div className="mt-1 font-mono text-sm tabular-nums">
        <span className="font-bold text-primary">
          {formatTime(car.zeroToHundred)}s
        </span>
        <span className="text-muted-foreground"> · {car.modelYear}</span>
      </div>
    </Link>
  );
}

function Section({
  title,
  caption,
  children,
}: {
  title: string;
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <Reveal>
      <section>
        <h2 className="flex items-center gap-2 border-b border-border pb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-foreground">
          <span aria-hidden className="h-3 w-1.5 bg-primary" />
          {title}
        </h2>
        {caption && (
          <p className="mb-5 mt-3 max-w-3xl text-sm text-muted-foreground">
            {caption}
          </p>
        )}
        <div className={caption ? "" : "mt-5"}>{children}</div>
      </section>
    </Reveal>
  );
}

/** PowertrainStat carries `type`; the Breakdown speaks in `label`. */
function ptRow(p: { type: string; count: number; quickest: CarDTO }) {
  return { label: p.type, count: p.count, quickest: p.quickest };
}

function Empty() {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-border py-20 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        Empty grid
      </p>
      <h2 className="mt-1 font-display text-3xl">Nothing to count yet</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Add cars to the board and the numbers fill in here.
      </p>
    </div>
  );
}

function ConnectionError() {
  return (
    <div className="flex flex-col items-center justify-center border border-destructive/40 bg-destructive/5 py-20 text-center">
      <AlertTriangle className="mb-3 h-8 w-8 text-destructive" />
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-destructive">
        Connection error
      </p>
      <h2 className="mt-1 font-display text-3xl">Couldn&apos;t reach the database</h2>
    </div>
  );
}
