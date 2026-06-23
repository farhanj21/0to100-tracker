import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCarById } from "@/lib/cars";
import { CarForm } from "@/components/car-form/car-form";
import { carTitle } from "@/lib/utils";
import { isAuthenticated } from "@/lib/auth";
import type { CarInput } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit car — 0–100 Tracker" };

export default async function EditCarPage({
  params,
}: {
  params: { id: string };
}) {
  if (!isAuthenticated()) redirect(`/login?next=/cars/${params.id}/edit`);

  const car = await getCarById(params.id);
  if (!car) notFound();

  const defaults: Partial<CarInput> = {
    modelYear: car.modelYear,
    manufacturer: car.manufacturer,
    carModel: car.carModel,
    variant: car.variant,
    engineSize: car.engineSize,
    powertrainType: car.powertrainType,
    transmission: car.transmission,
    induction: car.induction,
    zeroToHundred: car.zeroToHundred,
    media: car.media,
    specs: car.specs,
    features: car.features,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/cars/${car.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to car
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Edit car</h1>
        <p className="mt-1 text-muted-foreground">{carTitle(car)}</p>
      </div>

      <CarForm mode="edit" carId={car.id} defaultValues={defaults} />
    </div>
  );
}
