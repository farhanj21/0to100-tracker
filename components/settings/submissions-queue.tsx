"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ChevronDown,
  Check,
  X,
  Trash2,
  Loader2,
  Inbox,
  Video,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, cloudinaryThumb, formatTime } from "@/lib/utils";
import type { SubmissionDTO } from "@/lib/types";

/**
 * Admin review queue for public submissions. Pending items carry the actions;
 * handled ones collapse into a quiet history that can be cleaned out.
 *
 * Approving a run flips its status and hands off to /cars/new?submission=<id>,
 * pre-filled — the official car (and its 0–100 time) is still created through
 * the normal admin flow, never straight from the submission.
 */
export function SubmissionsQueue({
  submissions,
}: {
  submissions: SubmissionDTO[];
}) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const pending = submissions.filter((s) => s.status === "pending");
  const handled = submissions.filter((s) => s.status !== "pending");

  async function patch(id: string, status: "approved" | "rejected") {
    setBusyId(id);
    try {
      const res = await fetch(`/api/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function approve(sub: SubmissionDTO) {
    const ok = await patch(sub.id, "approved");
    if (!ok) return;
    if (sub.kind === "run") {
      // Hand off to the normal add-car flow, pre-filled from the submission.
      router.push(`/cars/new?submission=${sub.id}`);
    } else {
      toast.success("Marked handled — reach out via their contact to arrange it.");
      router.refresh();
    }
  }

  async function reject(sub: SubmissionDTO) {
    if (!window.confirm("Reject this submission? Its uploaded media will be deleted.")) {
      return;
    }
    const ok = await patch(sub.id, "rejected");
    if (!ok) return;
    toast.success("Submission rejected");
    router.refresh();
  }

  async function remove(sub: SubmissionDTO) {
    if (!window.confirm("Delete this submission for good?")) return;
    setBusyId(sub.id);
    try {
      const res = await fetch(`/api/submissions/${sub.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      toast.success("Submission deleted");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center border border-dashed border-border bg-card py-12 text-center">
        <Inbox className="mb-3 h-8 w-8 text-muted-foreground" />
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          Nothing to review
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Public submissions from /submit will land here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div className="space-y-3">
          {pending.map((sub) => (
            <SubmissionCard
              key={sub.id}
              sub={sub}
              expanded={expandedId === sub.id}
              busy={busyId === sub.id}
              onToggle={() =>
                setExpandedId((cur) => (cur === sub.id ? null : sub.id))
              }
              onApprove={() => approve(sub)}
              onReject={() => reject(sub)}
            />
          ))}
        </div>
      )}

      {handled.length > 0 && (
        <div className="space-y-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Handled
          </p>
          {handled.map((sub) => (
            <SubmissionCard
              key={sub.id}
              sub={sub}
              expanded={expandedId === sub.id}
              busy={busyId === sub.id}
              onToggle={() =>
                setExpandedId((cur) => (cur === sub.id ? null : sub.id))
              }
              onDelete={() => remove(sub)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SubmissionCard({
  sub,
  expanded,
  busy,
  onToggle,
  onApprove,
  onReject,
  onDelete,
}: {
  sub: SubmissionDTO;
  expanded: boolean;
  busy: boolean;
  onToggle: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onDelete?: () => void;
}) {
  const title = [sub.car.modelYear, sub.car.manufacturer, sub.car.carModel, sub.car.variant]
    .filter(Boolean)
    .join(" ");
  const isRun = sub.kind === "run";
  const date = new Date(sub.createdAt).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div
      className={cn(
        "border border-border bg-card",
        sub.status === "rejected" && "opacity-60"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em]",
            isRun
              ? "border-primary/40 text-primary"
              : "border-border text-muted-foreground"
          )}
        >
          {isRun ? <Video className="h-3 w-3" /> : <KeyRound className="h-3 w-3" />}
          {isRun ? "Run" : "Test"}
        </span>

        <span className="min-w-0 flex-1 truncate text-sm font-medium">{title}</span>

        {isRun && sub.claimedZeroToHundred != null && (
          <span className="hidden shrink-0 font-mono text-xs text-muted-foreground sm:inline">
            claims {formatTime(sub.claimedZeroToHundred)}s
          </span>
        )}
        <span className="hidden shrink-0 text-xs text-muted-foreground md:inline">
          {date}
        </span>
        {sub.status !== "pending" && (
          <span
            className={cn(
              "shrink-0 font-mono text-[10px] uppercase tracking-[0.16em]",
              sub.status === "approved" ? "text-primary" : "text-muted-foreground"
            )}
          >
            {sub.status}
          </span>
        )}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            expanded && "rotate-180"
          )}
        />
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-border px-4 py-4">
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <Detail label="Contact" value={sub.contact} />
            {isRun && sub.claimedZeroToHundred != null && (
              <Detail
                label="Claimed 0–100"
                value={`${formatTime(sub.claimedZeroToHundred)}s${
                  sub.measurementMethod ? ` · ${sub.measurementMethod}` : ""
                }`}
              />
            )}
            {sub.location && <Detail label="City / area" value={sub.location} />}
            {sub.availability && (
              <Detail label="Availability" value={sub.availability} />
            )}
            {sub.car.engineSize != null && (
              <Detail label="Engine" value={`${sub.car.engineSize}L`} />
            )}
            {(sub.car.powertrainType || sub.car.transmission || sub.car.induction) && (
              <Detail
                label="Drivetrain"
                value={[sub.car.powertrainType, sub.car.transmission, sub.car.induction]
                  .filter(Boolean)
                  .join(" · ")}
              />
            )}
            {sub.notes && <Detail label="Notes" value={sub.notes} wide />}
            {sub.reviewNote && <Detail label="Review note" value={sub.reviewNote} wide />}
          </dl>

          {sub.media.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {sub.media.map((m, i) =>
                m.type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={`${m.path}-${i}`}
                    src={cloudinaryThumb(m.path, 240, 160, "fill")}
                    alt="submission media"
                    className="aspect-video w-full rounded-md object-cover ring-1 ring-border"
                  />
                ) : (
                  <video
                    key={`${m.path}-${i}`}
                    src={m.path}
                    controls
                    playsInline
                    preload="metadata"
                    className="aspect-video w-full rounded-md object-cover ring-1 ring-border"
                  />
                )
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
            {onApprove && (
              <Button size="sm" onClick={onApprove} disabled={busy}>
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {isRun ? "Approve & add to board" : "Mark handled"}
              </Button>
            )}
            {onReject && (
              <Button size="sm" variant="outline" onClick={onReject} disabled={busy}>
                <X className="h-4 w-4" /> Reject
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onDelete}
                disabled={busy}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({
  label,
  value,
  wide,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={cn(wide && "sm:col-span-2")}>
      <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 whitespace-pre-wrap break-words">{value}</dd>
    </div>
  );
}
