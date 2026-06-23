"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";

export function DeleteCarButton({
  carId,
  carName,
}: {
  carId: string;
  carName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function onDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/cars/${carId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to delete");
      }
      toast.success(`${carName} removed from the grid`);
      setOpen(false);
      router.push("/");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !deleting && setOpen(o)}>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" /> Delete
      </Button>

      <DialogContent>
        <DialogHeader>
          <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/15 text-destructive">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <DialogTitle>Delete this car?</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{carName}</span> will be
            permanently removed, along with its uploaded media. The leaderboard
            will re-rank automatically. This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" disabled={deleting}>
              Cancel
            </Button>
          </DialogClose>
          <Button variant="destructive" onClick={onDelete} disabled={deleting}>
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete car
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
