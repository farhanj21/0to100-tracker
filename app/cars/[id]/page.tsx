import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  Pencil,
  Trophy,
  Calendar,
  Gauge,
  Wind,
  Cog,
  Zap,
  Hash,
} from "lucide-react";
import { getCarById, getCarCount } from "@/lib/cars";
import { isAuthenticated } from "@/lib/auth";
import { Gallery } from "@/components/gallery";
import { DeleteCarButton } from "@/components/delete-car-button";
import { RankBadge } from "@/components/leaderboard/rank-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  cn,
  formatTime,
  formatEngine,
  carTitle,
  ordinal,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const car = await getCarById(params.id);
  if (!car) return { title: "Car not found — 0–100 Tracker" };
  return { title: `${carTitle(car)} — 0–100 Tracker` };
}

export default async function CarDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [car, total] = await Promise.all([
    getCarById(params.id),
    getCarCount(),
  ]);
  if (!car) notFound();

  const authed = isAuthenticated();
  const isPodium = car.position <= 3;

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
          <div
            className={cn(
              "rounded-xl border bg-card p-5",
              isPodium ? "border-primary/40" : "border-border"
            )}
          >
            <div className="flex items-center gap-3">
              <RankBadge position={car.position} size="lg" />
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Global rank
                </p>
                <p className="text-lg font-semibold">
                  {ordinal(car.position)}{" "}
                  <span className="text-muted-foreground">
                    of {total}
                  </span>
                </p>
              </div>
              {isPodium && (
                <Trophy className="ml-auto h-6 w-6 text-gold" />
              )}
            </div>

            <div className="mt-5 border-t border-border pt-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                0–100 km/h
              </p>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-5xl font-bold tabular-nums text-primary">
                  {formatTime(car.zeroToHundred)}
                </span>
                <span className="text-lg text-muted-foreground">seconds</span>
              </div>
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {car.manufacturer}{" "}
              <span className="text-muted-foreground">{car.carModel}</span>
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
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
          Spec sheet
        </h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {specs.map((spec) => (
            <div
              key={spec.label}
              className="rounded-lg border border-border bg-card/50 p-4"
            >
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <spec.icon className="h-3.5 w-3.5" /> {spec.label}
              </dt>
              <dd className="mt-1 font-medium">{spec.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
