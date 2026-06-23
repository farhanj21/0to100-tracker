import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CarForm } from "@/components/car-form/car-form";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Add a car · 0–100 Tracker" };

export default function NewCarPage() {
  if (!isAuthenticated()) redirect("/login?next=/cars/new");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to leaderboard
        </Link>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">
          Add a car
        </h1>
        <p className="mt-1 text-muted-foreground">
          Enter the specs and the 0–100 time. The board re-ranks as soon as you
          save.
        </p>
      </div>

      <CarForm mode="create" />
    </div>
  );
}
