import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  getOptionsMap,
  OPTION_CATEGORIES,
  CATEGORY_LABEL,
} from "@/lib/options";
import {
  OptionsManager,
  type OptionCategoryData,
} from "@/components/settings/options-manager";
import { SubmissionsQueue } from "@/components/settings/submissions-queue";
import { getSubmissions } from "@/lib/submissions";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings · 0–100" };

export default async function SettingsPage() {
  if (!isAuthenticated()) redirect("/login?next=/settings");

  const [options, submissions] = await Promise.all([
    getOptionsMap(),
    getSubmissions(),
  ]);
  const categories: OptionCategoryData[] = OPTION_CATEGORIES.map((key) => ({
    key,
    label: CATEGORY_LABEL[key],
    values: options[key],
  }));
  const pendingCount = submissions.filter((s) => s.status === "pending").length;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to leaderboard
        </Link>
        <h1 className="mt-3 font-display text-4xl tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage the dropdown options used when adding or editing a car. Adding a
          value makes it available immediately; renaming one updates every car
          that uses it.
        </p>
      </div>

      <OptionsManager categories={categories} />

      <div className="border-t border-border pt-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl tracking-tight">Submissions</h2>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {pendingCount} pending
          </span>
        </div>
        <p className="mb-4 mt-1 text-sm text-muted-foreground">
          Runs and test requests sent in by visitors via /submit. Approving a
          run opens the add-car form pre-filled — you verify the proof and
          enter the official time yourself.
        </p>
        <SubmissionsQueue submissions={submissions} />
      </div>
    </div>
  );
}
