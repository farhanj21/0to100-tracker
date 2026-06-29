"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Save, Gauge, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MediaUploader } from "@/components/car-form/media-uploader";
import { ExtraSpecsEditor } from "@/components/car-form/extra-specs-editor";
import { carInputSchema, type CarInput } from "@/lib/validation";
import {
  POWERTRAIN_TYPES,
  TRANSMISSIONS,
  INDUCTIONS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { CarSpecsResult, SpecPair } from "@/lib/types";

interface CarFormProps {
  mode: "create" | "edit";
  carId?: string;
  defaultValues?: Partial<CarInput>;
}

// Block characters that would produce a negative (or exponential) value in
// number inputs — the user shouldn't even be able to type them.
function blockNegativeKeys(e: React.KeyboardEvent<HTMLInputElement>) {
  if (["-", "+", "e", "E"].includes(e.key)) {
    e.preventDefault();
  }
}

const BLANK: CarInput = {
  // Numeric fields start blank so the user enters them explicitly.
  modelYear: "" as unknown as number,
  manufacturer: "",
  carModel: "",
  variant: "",
  engineSize: "" as unknown as number,
  // Dropdowns start unselected so their placeholder shows.
  powertrainType: "" as unknown as CarInput["powertrainType"],
  transmission: "" as unknown as CarInput["transmission"],
  induction: "" as unknown as CarInput["induction"],
  zeroToHundred: "" as unknown as number,
  media: [],
  specs: [],
  features: [],
  notes: "",
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
  const specsValue = watch("specs");
  const featuresValue = watch("features");
  const manufacturerValue = watch("manufacturer");
  const carModelValue = watch("carModel");
  const canAutoFill = Boolean(
    manufacturerValue?.toString().trim() && carModelValue?.toString().trim()
  );

  const [fetchingSpecs, setFetchingSpecs] = useState(false);
  const [foundSpecs, setFoundSpecs] = useState<CarSpecsResult | null>(null);

  // Look up specs from the free Gemini tier and pre-fill the form. The 0–100
  // time is intentionally NOT written — it's shown in the showcase as reference.
  async function autoFillFromWeb() {
    const manufacturer = manufacturerValue?.toString().trim();
    const carModel = carModelValue?.toString().trim();
    if (!manufacturer || !carModel) {
      toast.error("Enter manufacturer and model first.");
      return;
    }

    setFetchingSpecs(true);
    try {
      const res = await fetch("/api/cars/fetch-specs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manufacturer,
          carModel,
          variant: watch("variant")?.toString().trim() || undefined,
          modelYear: watch("modelYear"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Lookup failed.");

      const specs = data.specs as CarSpecsResult;
      const opts = { shouldValidate: true, shouldDirty: true } as const;
      const filled: string[] = [];

      if (specs.engineSize != null) {
        setValue("engineSize", specs.engineSize, opts);
        filled.push("engine");
      }
      if (specs.powertrainType) {
        setValue("powertrainType", specs.powertrainType, opts);
        filled.push("powertrain");
      }
      if (specs.transmission) {
        setValue("transmission", specs.transmission, opts);
        filled.push("transmission");
      }
      if (specs.induction) {
        setValue("induction", specs.induction, opts);
        filled.push("induction");
      }
      if (specs.modelYear != null) {
        setValue("modelYear", specs.modelYear, opts);
      }

      // Extended specs + features (replace existing when the lookup returns any).
      if (specs.specs.length > 0) {
        setValue("specs", specs.specs, opts);
      }
      if (specs.features.length > 0) {
        setValue("features", specs.features, opts);
      }

      setFoundSpecs(specs);
      const extra = specs.specs.length + specs.features.length;
      if (filled.length || extra) {
        toast.success(
          `Filled ${filled.join(", ") || "details"}${
            extra ? ` + ${extra} extra items` : ""
          }. Add the 0–100 time to finish.`
        );
      } else {
        toast.message("Nothing came back. Enter the specs by hand.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lookup failed.");
    } finally {
      setFetchingSpecs(false);
    }
  }

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
            <Input placeholder="Enter car manufacturer" {...register("manufacturer")} />
          </Field>
          <Field label="Model" error={errors.carModel?.message}>
            <Input placeholder="Enter car model" {...register("carModel")} />
          </Field>
          <Field
            label="Variant / Trim"
            error={errors.variant?.message}
            hint="Optional. A trim level sharpens the lookup (e.g. GLI, Altis Grande)."
          >
            <Input placeholder="Enter car variant / trim" {...register("variant")} />
          </Field>
          <Field label="Model year" error={errors.modelYear?.message}>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Enter car model year"
              onKeyDown={blockNegativeKeys}
              {...register("modelYear")}
            />
          </Field>
          <Field label="Engine size (L)" error={errors.engineSize?.message}>
            <Input
              type="number"
              step="any"
              inputMode="decimal"
              min={0}
              placeholder="Enter car engine size"
              onKeyDown={blockNegativeKeys}
              {...register("engineSize")}
            />
          </Field>
        </div>

        {/* Free auto-fill from the web (Google Gemini) */}
        <div className="mt-5 border-t border-border pt-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Fills car specifications &amp; features from a free
              web lookup. Review before saving.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={autoFillFromWeb}
              disabled={fetchingSpecs || !canAutoFill}
              className="shrink-0"
            >
              {fetchingSpecs ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Auto-fill from web
            </Button>
          </div>
          {foundSpecs && <SpecShowcase specs={foundSpecs} />}
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
              min={0}
              placeholder="0–100 time in secs"
              className="pl-9 font-mono text-lg"
              onKeyDown={blockNegativeKeys}
              {...register("zeroToHundred")}
            />
          </div>
        </Field>
      </Section>

      {/* Extra specs & features */}
      <Section
        title="Extra specs & features"
        subtitle="The spec sheet your car page shows. Auto-fill drafts it; every field stays editable."
      >
        <ExtraSpecsEditor
          specs={specsValue}
          features={featuresValue}
          onSpecsChange={(next) =>
            setValue("specs", next, { shouldDirty: true, shouldValidate: true })
          }
          onFeaturesChange={(next) =>
            setValue("features", next, { shouldDirty: true, shouldValidate: true })
          }
        />
      </Section>

      {/* Notes */}
      <Section
        title="Notes"
        subtitle="Free-form notes about this car — impressions, ownership history, anything worth remembering."
      >
        <Field label="Notes" error={errors.notes?.message}>
          <Textarea
            rows={5}
            placeholder="Add any notes about this car…"
            {...register("notes")}
          />
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

function SpecShowcase({ specs }: { specs: CarSpecsResult }) {
  const extraCount = specs.specs.length;
  const featureCount = specs.features.length;

  return (
    <div className="mt-4 rounded-sm border border-primary/30 bg-primary/5 p-4 text-sm">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
        <Sparkles className="h-3.5 w-3.5" /> Drafted by auto-fill. Give it a once-over before saving.
      </div>

      <p className="mt-2 text-muted-foreground">
        Filled the core fields
        {extraCount
          ? `, plus ${extraCount} extra spec${extraCount > 1 ? "s" : ""}`
          : ""}
        {featureCount
          ? ` and ${featureCount} feature${featureCount > 1 ? "s" : ""}`
          : ""}
        {extraCount || featureCount ? " (in the section below)" : ""}.
      </p>

      {specs.zeroToHundredHint != null && (
        <p className="mt-1 text-muted-foreground">
          0–100 reference:{" "}
          <span className="font-mono font-medium text-foreground">
            {specs.zeroToHundredHint.toFixed(1)} s
          </span>
          . Enter the official figure in the Performance field.
        </p>
      )}

      {(specs.notes || specs.sourceSummary) && (
        <p className="mt-1 text-xs text-muted-foreground">
          {specs.notes && <span>{specs.notes} </span>}
          {specs.sourceSummary && (
            <span className="italic">({specs.sourceSummary})</span>
          )}
        </p>
      )}

      <p className="mt-2 text-[11px] text-muted-foreground">
        Ballpark figures from an AI lookup. Worth a quick sanity check before saving.
      </p>
    </div>
  );
}

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
    <section className="border border-border bg-card p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-foreground">
          <span aria-hidden className="h-3 w-1.5 bg-primary" />
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1.5 text-xs text-muted-foreground">{subtitle}</p>
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
