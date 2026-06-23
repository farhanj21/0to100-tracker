"use client";

import { useRouter } from "next/navigation";
import { useForm, Controller, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Save, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MediaUploader } from "@/components/car-form/media-uploader";
import { carInputSchema, type CarInput } from "@/lib/validation";
import {
  POWERTRAIN_TYPES,
  TRANSMISSIONS,
  INDUCTIONS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

interface CarFormProps {
  mode: "create" | "edit";
  carId?: string;
  defaultValues?: Partial<CarInput>;
}

const BLANK: CarInput = {
  modelYear: new Date().getFullYear(),
  manufacturer: "",
  carModel: "",
  engineSize: 2,
  powertrainType: "Petrol",
  transmission: "Auto",
  induction: "Turbocharged",
  zeroToHundred: 5,
  media: [],
};

export function CarForm({ mode, carId, defaultValues }: CarFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CarInput>({
    resolver: zodResolver(carInputSchema),
    defaultValues: { ...BLANK, ...defaultValues },
  });

  const media = watch("media");

  async function onSubmit(values: CarInput) {
    const url = mode === "create" ? "/api/cars" : `/api/cars/${carId}`;
    const method = mode === "create" ? "POST" : "PUT";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Something went wrong");
      }

      toast.success(
        mode === "create" ? "Car added to the grid" : "Car updated"
      );
      const id = mode === "create" ? data.id : carId;
      router.push(`/cars/${id}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Identity */}
      <Section title="Identity">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Manufacturer" error={errors.manufacturer?.message}>
            <Input placeholder="e.g. Porsche" {...register("manufacturer")} />
          </Field>
          <Field label="Model" error={errors.carModel?.message}>
            <Input placeholder="e.g. 911 Turbo S" {...register("carModel")} />
          </Field>
          <Field label="Model year" error={errors.modelYear?.message}>
            <Input
              type="number"
              inputMode="numeric"
              {...register("modelYear")}
            />
          </Field>
          <Field label="Engine size (L)" error={errors.engineSize?.message}>
            <Input
              type="number"
              step="any"
              inputMode="decimal"
              {...register("engineSize")}
            />
          </Field>
        </div>
      </Section>

      {/* Drivetrain */}
      <Section title="Drivetrain">
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Powertrain" error={errors.powertrainType?.message}>
            <ControlledSelect
              control={control}
              name="powertrainType"
              options={[...POWERTRAIN_TYPES]}
              placeholder="Select powertrain"
            />
          </Field>
          <Field label="Induction" error={errors.induction?.message}>
            <ControlledSelect
              control={control}
              name="induction"
              options={[...INDUCTIONS]}
              placeholder="Select induction"
            />
          </Field>
          <Field label="Transmission" error={errors.transmission?.message}>
            <ControlledSelect
              control={control}
              name="transmission"
              options={[...TRANSMISSIONS]}
              placeholder="Select transmission"
            />
          </Field>
        </div>
      </Section>

      {/* Performance */}
      <Section title="Performance">
        <Field
          label="0–100 km/h time (seconds)"
          error={errors.zeroToHundred?.message}
          hint="The metric that sets this car's rank."
        >
          <div className="relative max-w-xs">
            <Gauge className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
            <Input
              type="number"
              step="any"
              inputMode="decimal"
              className="pl-9 font-mono text-lg"
              {...register("zeroToHundred")}
            />
          </div>
        </Field>
      </Section>

      {/* Media */}
      <Section title="Media" subtitle="Images and videos for the gallery">
        <MediaUploader
          value={media}
          onChange={(next) =>
            setValue("media", next, { shouldDirty: true, shouldValidate: true })
          }
        />
      </Section>

      <div className="flex items-center gap-3 border-t border-border pt-6">
        <Button type="submit" disabled={isSubmitting} size="lg">
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {mode === "create" ? "Add to leaderboard" : "Save changes"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

/* ---------- small presentational helpers ---------- */

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card/50 p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-primary">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

type EnumField = "powertrainType" | "transmission" | "induction";

function ControlledSelect({
  control,
  name,
  options,
  placeholder,
}: {
  control: Control<CarInput>;
  name: EnumField;
  options: string[];
  placeholder: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Select value={field.value as string} onValueChange={field.onChange}>
          <SelectTrigger className={cn(!field.value && "text-muted-foreground")}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  );
}
