import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCarBySlug } from "@/lib/cars";
import { getOptionsMap } from "@/lib/options";
import { CarForm } from "@/components/car-form/car-form";
import { carTitle } from "@/lib/utils";
import { isAuthenticated } from "@/lib/auth";
import type { CarInput } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit car · 0–100" };

export default async function EditCarPage({
  params,
}: {
  params: { id: string };
}) {
  if (!isAuthenticated()) redirect(`/login?next=/cars/${params.id}/edit`);

  const car = await getCarBySlug(params.id);
  if (!car) notFound();
  // Canonicalise: an old id URL redirects to the readable slug.
  if (car.slug !== params.id) redirect(`/cars/${car.slug}/edit`);

  const options = await getOptionsMap();

  const defaults: Partial<CarInput> = {
    modelYear: car.modelYear,
    manufacturer: car.manufacturer,
    carModel: car.carModel,
    variant: car.variant,
    engineSize: car.engineSize,
    fuelType: car.fuelType,
    powertrainType: car.powertrainType,
    transmission: car.transmission,
    induction: car.induction,
    zeroToHundred: car.zeroToHundred,
    media: car.media,
    specs: car.specs,
    features: car.features,
    notes: car.notes,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/cars/${car.slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to car
        </Link>
        <h1 className="mt-3 font-display text-4xl tracking-tight">Edit car</h1>
        <p className="mt-1 text-muted-foreground">{carTitle(car)}</p>
      </div>

      <CarForm
        mode="edit"
        carId={car.id}
        options={options}
        defaultValues={defaults}
      />
    </div>
  );
}
