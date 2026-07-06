"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProofUploader } from "@/components/submit/proof-uploader";
import {
  Section,
  Field,
  HoneypotField,
  blockNegativeKeys,
} from "@/components/submit/form-bits";
import { testRequestSchema, type TestRequestInput } from "@/lib/validation";

const BLANK: TestRequestInput = {
  kind: "test-request",
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
  location: "",
  availability: "",
  contact: "",
  notes: "",
  media: [],
};

/**
 * "Book a test" — no claimed time and no proof needed; the owners drive the
 * car and time the 0–100 themselves.
 */
export function TestRequestForm({
  onSubmitted,
}: {
  onSubmitted: (contact: string) => void;
}) {
  const [honeypot, setHoneypot] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TestRequestInput>({
    resolver: zodResolver(testRequestSchema),
    defaultValues: BLANK,
  });

  const media = watch("media");

  async function onSubmit(values: TestRequestInput) {
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
            hint="Optional."
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
        </div>
        <div className="mt-5">
          <Field
            label="Anything worth knowing"
            error={errors.notes?.message}
            hint="Optional — mods, condition, “it's a manual”."
          >
            <Textarea rows={3} placeholder="Tell us about the car…" {...register("notes")} />
          </Field>
        </div>
      </Section>

      <Section
        title="The meet"
        subtitle="Where the car lives and when it's free. We'll sort the details over your contact."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="City / area" error={errors.location?.message}>
            <Input placeholder="Where is the car?" {...register("location")} />
          </Field>
          <Field
            label="Availability"
            error={errors.availability?.message}
            hint="Free-form — “weekends”, “any evening”."
          >
            <Input placeholder="When could it happen?" {...register("availability")} />
          </Field>
        </div>
      </Section>

      <Section
        title="You"
        subtitle="How we reach you, plus an optional photo so we know what's showing up."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Contact"
            error={errors.contact?.message}
            hint="Email, phone, or Instagram."
          >
            <Input placeholder="you@example.com or @handle" {...register("contact")} />
          </Field>
        </div>
        <div className="mt-5">
          <Field error={errors.media?.message}>
            <ProofUploader
              value={media}
              onChange={(next) =>
                setValue("media", next, { shouldDirty: true, shouldValidate: true })
              }
              accept="image/*"
              maxFiles={1}
              prompt="Drop one photo of the car (optional), or click to browse"
              hint="Image under 8 MB"
            />
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
          Request a test
        </Button>
        <p className="text-xs text-muted-foreground">
          We drive it, we time it, it ranks.
        </p>
      </div>
    </form>
  );
}
