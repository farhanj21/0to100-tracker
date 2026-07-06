"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Send, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProofUploader } from "@/components/submit/proof-uploader";
import {
  Section,
  Field,
  OptionSelect,
  HoneypotField,
  blockNegativeKeys,
} from "@/components/submit/form-bits";
import { runSubmissionSchema, type RunSubmissionInput } from "@/lib/validation";
import type { SubmitOptions } from "@/components/submit/submit-tabs";

const MEASUREMENT_METHODS = [
  "GPS performance box (Dragy / VBOX)",
  "Onboard dash timer",
  "Phone app",
  "Other",
];

const BLANK: RunSubmissionInput = {
  kind: "run",
  car: {
    modelYear: "" as unknown as number,
    manufacturer: "",
    carModel: "",
    variant: "",
    engineSize: "" as unknown as number,
    powertrainType: "",
    transmission: "",
    induction: "",
  },
  claimedZeroToHundred: "" as unknown as number,
  measurementMethod: "",
  media: [],
  contact: "",
  notes: "",
};

/** "Submit a run" — a claimed time backed by mandatory video proof. */
export function RunForm({
  options,
  onSubmitted,
}: {
  options: SubmitOptions;
  onSubmitted: (contact: string) => void;
}) {
  const [honeypot, setHoneypot] = useState("");

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RunSubmissionInput>({
    resolver: zodResolver(runSubmissionSchema),
    defaultValues: BLANK,
  });

  const media = watch("media");

  async function onSubmit(values: RunSubmissionInput) {
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, website: honeypot }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      onSubmitted(values.contact);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="relative space-y-6">
      <HoneypotField value={honeypot} onChange={setHoneypot} />

      <Section title="The car">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Manufacturer" error={errors.car?.manufacturer?.message}>
            <Input placeholder="Enter car manufacturer" {...register("car.manufacturer")} />
          </Field>
          <Field label="Model" error={errors.car?.carModel?.message}>
            <Input placeholder="Enter car model" {...register("car.carModel")} />
          </Field>
          <Field
            label="Variant / Trim"
            error={errors.car?.variant?.message}
            hint="Optional (e.g. GLI, Competition)."
          >
            <Input placeholder="Enter car variant / trim" {...register("car.variant")} />
          </Field>
          <Field label="Model year" error={errors.car?.modelYear?.message}>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Enter car model year"
              onKeyDown={blockNegativeKeys}
              {...register("car.modelYear")}
            />
          </Field>
          <Field
            label="Engine size (L)"
            error={errors.car?.engineSize?.message}
            hint="Optional."
          >
            <Input
              type="number"
              step="any"
              inputMode="decimal"
              min={0}
              placeholder="Enter engine size"
              onKeyDown={blockNegativeKeys}
              {...register("car.engineSize")}
            />
          </Field>
        </div>

        <div className="mt-5 grid gap-5 border-t border-border pt-5 sm:grid-cols-3">
          <Field label="Powertrain" hint="Optional.">
            <Controller
              control={control}
              name="car.powertrainType"
              render={({ field }) => (
                <OptionSelect
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  options={options.powertrain}
                  placeholder="If you know it"
                />
              )}
            />
          </Field>
          <Field label="Transmission" hint="Optional.">
            <Controller
              control={control}
              name="car.transmission"
              render={({ field }) => (
                <OptionSelect
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  options={options.transmission}
                  placeholder="If you know it"
                />
              )}
            />
          </Field>
          <Field label="Induction" hint="Optional.">
            <Controller
              control={control}
              name="car.induction"
              render={({ field }) => (
                <OptionSelect
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  options={options.induction}
                  placeholder="If you know it"
                />
              )}
            />
          </Field>
        </div>
      </Section>

      <Section
        title="The run"
        subtitle="The time you clocked and how you clocked it. It's checked against your proof before it ever ranks."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Claimed 0–100 km/h time (seconds)"
            error={errors.claimedZeroToHundred?.message}
            hint="Subject to verification."
          >
            <div className="relative">
              <Gauge className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
              <Input
                type="number"
                step="any"
                inputMode="decimal"
                min={0}
                placeholder="Enter 0–100 time in seconds"
                className="pl-9"
                onKeyDown={blockNegativeKeys}
                {...register("claimedZeroToHundred")}
              />
            </div>
          </Field>
          <Field
            label="How was it measured?"
            error={errors.measurementMethod?.message}
          >
            <Controller
              control={control}
              name="measurementMethod"
              render={({ field }) => (
                <OptionSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={MEASUREMENT_METHODS}
                  placeholder="Select a method"
                />
              )}
            />
          </Field>
        </div>
      </Section>

      <Section
        title="Proof"
        subtitle="A video of the run is required — it's what gets your time believed. Photos of the car or the timer readout help too."
      >
        <Field error={errors.media?.message ?? errors.media?.root?.message}>
          <ProofUploader
            value={media}
            onChange={(next) =>
              setValue("media", next, { shouldDirty: true, shouldValidate: true })
            }
            accept="video/*,image/*"
            maxFiles={4}
            prompt="Drop the run video (plus up to 3 photos), or click to browse"
            hint="Video under 100 MB · images under 8 MB"
          />
        </Field>
      </Section>

      <Section title="You">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Contact"
            error={errors.contact?.message}
            hint="Email or Instagram — only used to follow up on this submission."
          >
            <Input placeholder="you@example.com or @handle" {...register("contact")} />
          </Field>
        </div>
        <div className="mt-5">
          <Field label="Notes" error={errors.notes?.message} hint="Optional — mods, conditions, anything worth knowing.">
            <Textarea rows={4} placeholder="Anything else about the car or the run…" {...register("notes")} />
          </Field>
        </div>
      </Section>

      <div className="flex items-center gap-3 border-t border-border pt-6">
        <Button type="submit" disabled={isSubmitting} size="lg">
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Submit for review
        </Button>
        <p className="text-xs text-muted-foreground">
          Reviewed by hand. Nothing joins the board automatically.
        </p>
      </div>
    </form>
  );
}
