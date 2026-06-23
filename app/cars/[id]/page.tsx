import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  Pencil,
  Calendar,
  Gauge,
  Wind,
  Cog,
  Zap,
  Hash,
  Check,
} from "lucide-react";
import { getCarById, getRankedCars } from "@/lib/cars";
import { isAuthenticated } from "@/lib/auth";
import { Gallery } from "@/components/gallery";
import { DeleteCarButton } from "@/components/delete-car-button";
import { RankBadge } from "@/components/leaderboard/rank-badge";
import { CountUp } from "@/components/count-up";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatEngine, carTitle, ordinal } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const car = await getCarById(params.id);
  if (!car) return { title: "Car not found · 0–100" };
  return { title: `${carTitle(car)} · 0–100` };
}

export default async function CarDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const ranked = await getRankedCars();
  const car = ranked.find((c) => c.id === params.id);
  if (!car) notFound();

  const total = ranked.length;
  const leaderTime = ranked[0]?.zeroToHundred ?? car.zeroToHundred;
  const gap = car.zeroToHundred - leaderTime;
  const marginToNext =
    car.position === 1 && ranked[1]
      ? ranked[1].zeroToHundred - car.zeroToHundred
      : 0;

  const authed = isAuthenticated();

  const specs = [
    { icon: Calendar, label: "Model year", value: String(car.modelYear) },
    { icon: Gauge, label: "Engine", value: formatEngine(car.engineSize) },
    { icon: Zap, label: "Powertrain", value: car.powertrainType },
    { icon: Wind, label: "Induction", value: car.induction },
    { icon: Cog, label: "Transmission", value: car.transmission },
    { icon: Hash, label: "Manufacturer", value: car.manufacturer },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Leaderboard
        </Link>
        {authed && (
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/cars/${car.id}/edit`}>
                <Pencil className="h-4 w-4" /> Edit
              </Link>
            </Button>
            <DeleteCarButton carId={car.id} carName={carTitle(car)} />
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Gallery — "Set as thumbnail" only available to admins */}
        <Gallery media={car.media} carId={authed ? car.id : undefined} />

        {/* Summary */}
        <div className="space-y-5">
          <div className="border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <RankBadge position={car.position} size="lg" />
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Rank {ordinal(car.position)}{" "}
                <span className="text-muted-foreground/60">of {total}</span>
              </p>
            </div>

            <div className="mt-5 border-t border-border pt-5">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                0–100 km/h
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <CountUp
                  value={car.zeroToHundred}
                  className="font-mono text-6xl font-bold tabular-nums tracking-tight text-primary"
                />
                <span className="font-mono text-lg text-muted-foreground">s</span>
              </div>
              <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                {car.position === 1 ? (
                  marginToNext > 0.0001 ? (
                    <>
                      Fastest —{" "}
                      <span className="font-bold text-primary">
                        {marginToNext.toFixed(2)} s
                      </span>{" "}
                      clear of P2
                    </>
                  ) : (
                    "Fastest on the board"
                  )
                ) : (
                  <>
                    <span className="font-bold text-primary">
                      +{gap.toFixed(2)} s
                    </span>{" "}
                    off the lead
                  </>
                )}
              </p>
            </div>
          </div>

          <div>
            <h1 className="font-display text-4xl leading-none tracking-tight sm:text-5xl">
              {car.manufacturer}{" "}
              <span className="text-muted-foreground">
                {car.carModel}
                {car.variant ? ` ${car.variant}` : ""}
              </span>
            </h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="default">{car.powertrainType}</Badge>
              <Badge variant="outline">{car.induction}</Badge>
              <Badge variant="outline">{car.transmission}</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Spec sheet */}
      <div>
        <h2 className="mb-3 font-mono text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Spec sheet
        </h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {specs.map((spec) => (
            <div
              key={spec.label}
              className="border border-border bg-card p-4"
            >
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <spec.icon className="h-3.5 w-3.5" /> {spec.label}
              </dt>
              <dd className="mt-1 font-medium">{spec.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Full specifications (extended, from auto-fill or manual entry) */}
      {car.specs.length > 0 && (
        <div>
          <h2 className="mb-3 font-mono text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Full specifications
          </h2>
          <dl className="grid grid-cols-1 gap-px overflow-hidden border border-border bg-border sm:grid-cols-2">
            {car.specs.map((s, i) => (
              <div
                key={`${s.label}-${i}`}
                className="flex items-center justify-between gap-4 bg-card px-4 py-3"
              >
                <dt className="text-sm text-muted-foreground">{s.label}</dt>
                <dd className="text-right text-sm font-medium">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Features */}
      {car.features.length > 0 && (
        <div>
          <h2 className="mb-3 font-mono text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Features
          </h2>
          <ul className="flex flex-wrap gap-2">
            {car.features.map((f, i) => (
              <li
                key={`${f}-${i}`}
                className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-card px-2.5 py-1 text-sm"
              >
                <Check className="h-3.5 w-3.5 text-primary" /> {f}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
