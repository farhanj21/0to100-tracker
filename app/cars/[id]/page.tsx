import Link from "next/link";
import { notFound, redirect } from "next/navigation";
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
  Flag,
} from "lucide-react";
import { getCarBySlug, getRankedCars } from "@/lib/cars";
import { isAuthenticated } from "@/lib/auth";
import { Gallery } from "@/components/gallery";
import { DeleteCarButton } from "@/components/delete-car-button";
import { CountUp } from "@/components/count-up";
import { Button } from "@/components/ui/button";
import { formatEngine, carTitle, ordinal } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const car = await getCarBySlug(params.id);
  if (!car) return { title: "Car not found · 0–100" };
  return { title: `${carTitle(car)} · 0–100` };
}

export default async function CarDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const ranked = await getRankedCars();
  const car =
    ranked.find((c) => c.slug === params.id) ??
    ranked.find((c) => c.id === params.id);
  if (!car) notFound();
  // Canonicalise: reaching this page via an old/raw id redirects to the slug.
  if (car.slug !== params.id) redirect(`/cars/${car.slug}`);

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
              <Link href={`/cars/${car.slug}/edit`}>
                <Pencil className="h-4 w-4" /> Edit
              </Link>
            </Button>
            <DeleteCarButton carId={car.id} carName={carTitle(car)} />
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:gap-10">
        {/* Gallery — "Set as thumbnail" only available to admins */}
        <Gallery media={car.media} carId={authed ? car.id : undefined} />

        {/* Headline + stat — mirrors the home cover-story language. */}
        <div className="flex flex-col justify-center">
          <span className="self-start bg-primary px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-wider text-primary-foreground">
            No.{String(car.position).padStart(2, "0")}
          </span>

          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Rank {ordinal(car.position)}{" "}
            <span className="text-muted-foreground/50">of {total}</span>
          </p>

          <h1 className="mt-3 font-display text-4xl leading-none tracking-tight sm:text-5xl">
            {car.manufacturer}{" "}
            <span className="text-muted-foreground">
              {car.carModel}
              {car.variant ? ` ${car.variant}` : ""}
            </span>
          </h1>

          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
            {car.modelYear} · {formatEngine(car.engineSize)} · {car.induction} ·{" "}
            {car.transmission} · {car.powertrainType}
          </p>

          <div className="mt-7 border-t border-border pt-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
              0–100 km/h
            </p>
            <div className="-ml-1 mt-1 flex items-baseline gap-2">
              <CountUp
                value={car.zeroToHundred}
                className="font-mono text-7xl font-bold leading-[0.8] tracking-tighter sm:text-8xl"
              />
              <span className="font-mono text-2xl text-muted-foreground">s</span>
            </div>
            <p className="mt-4 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
              {car.position === 1 ? (
                marginToNext > 0.0001 ? (
                  <>
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

            <Button asChild variant="outline" size="sm" className="mt-6 self-start">
              <Link href={`/race?cars=${car.slug}`}>
                <Flag className="h-4 w-4" /> Visualize 0–100
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Spec sheet */}
      <div>
        <SectionHeading>Spec sheet</SectionHeading>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {specs.map((spec) => (
            <div
              key={spec.label}
              className="border border-border bg-card p-4"
            >
              <dt className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                <spec.icon className="h-3 w-3" /> {spec.label}
              </dt>
              <dd className="mt-1 font-medium">{spec.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Full specifications (extended, from auto-fill or manual entry) */}
      {car.specs.length > 0 && (
        <div>
          <SectionHeading>Full specifications</SectionHeading>
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
          <SectionHeading>Features</SectionHeading>
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

      {/* Notes */}
      {car.notes.trim().length > 0 && (
        <div>
          <SectionHeading>Notes</SectionHeading>
          <div className="border border-border bg-card p-4 sm:p-5">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {car.notes}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/** Editorial section label: mono caps on a hairline rule, led by a solid
 *  solid accent tick (the recurring block motif). */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 flex items-center gap-2 border-b border-border pb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-foreground">
      <span aria-hidden className="h-3 w-1.5 bg-primary" />
      {children}
    </h2>
  );
}
