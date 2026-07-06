"use client";

import { useState } from "react";
import { Video, KeyRound } from "lucide-react";
import { RunForm } from "@/components/submit/run-form";
import { TestRequestForm } from "@/components/submit/test-request-form";
import { SubmittedNote } from "@/components/submit/form-bits";
import { cn } from "@/lib/utils";

/** The admin-managed dropdown lists, supplied by the page rendering the tabs. */
export interface SubmitOptions {
  powertrain: string[];
  induction: string[];
  transmission: string[];
}

type Tab = "run" | "test";

const TABS: { value: Tab; label: string; icon: typeof Video; blurb: string }[] = [
  {
    value: "run",
    label: "Submit a run",
    icon: Video,
    blurb: "You've timed it — send the numbers and the footage.",
  },
  {
    value: "test",
    label: "Book a test",
    icon: KeyRound,
    blurb: "We drive the car and clock the 0–100 ourselves.",
  },
];

export function SubmitTabs({
  options,
  initialTab,
}: {
  options: SubmitOptions;
  initialTab: Tab;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [submittedContact, setSubmittedContact] = useState<string | null>(null);

  if (submittedContact) {
    return <SubmittedNote contact={submittedContact} />;
  }

  const active = TABS.find((t) => t.value === tab)!;

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex divide-x divide-border border border-border bg-card">
          {TABS.map((t) => {
            const isActive = tab === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setTab(t.value)}
                aria-pressed={isActive}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors sm:px-4",
                  isActive
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <t.icon className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
                {t.label}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{active.blurb}</p>
      </div>

      {tab === "run" ? (
        <RunForm options={options} onSubmitted={setSubmittedContact} />
      ) : (
        <TestRequestForm onSubmitted={setSubmittedContact} />
      )}
    </div>
  );
}
