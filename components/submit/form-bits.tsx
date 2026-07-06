"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/**
 * Small presentational pieces shared by the public submission forms. They
 * mirror the admin car form's Section/Field styling so /submit reads as a
 * native part of the site, without touching the admin components.
 */

export function Section({
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

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      {label && <Label>{label}</Label>}
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function OptionSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn(!value && "text-muted-foreground")}>
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
  );
}

/** Block characters that would produce a negative/exponential number value. */
export function blockNegativeKeys(e: React.KeyboardEvent<HTMLInputElement>) {
  if (["-", "+", "e", "E"].includes(e.key)) {
    e.preventDefault();
  }
}

/**
 * Honeypot: an off-screen "website" input no human sees or fills. Bots that
 * complete every field give themselves away; the API silently drops those.
 */
export function HoneypotField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div aria-hidden className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
      <label>
        Website
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </div>
  );
}

/** The quiet, editorial confirmation shown once a submission lands. */
export function SubmittedNote({ contact }: { contact: string }) {
  return (
    <div className="border border-border bg-card p-8 sm:p-10">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
        Received
      </p>
      <p className="mt-3 font-display text-3xl tracking-tight">
        In the queue<span className="text-primary">.</span>
      </p>
      <p className="mt-2 max-w-prose text-sm text-muted-foreground">
        We review every submission before it races the board — you&apos;ll hear
        from us at <span className="text-foreground">{contact}</span>.
      </p>
    </div>
  );
}
