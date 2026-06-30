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
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings · 0–100" };

export default async function SettingsPage() {
  if (!isAuthenticated()) redirect("/login?next=/settings");

  const options = await getOptionsMap();
  const categories: OptionCategoryData[] = OPTION_CATEGORIES.map((key) => ({
    key,
    label: CATEGORY_LABEL[key],
    values: options[key],
  }));

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
    </div>
  );
}
