"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, Pencil, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface OptionCategoryData {
  key: string;
  label: string;
  values: string[];
}

/**
 * Admin editor for the car dropdown lists (powertrain / induction /
 * transmission). Supports adding new values and renaming existing ones; a
 * rename cascades to every car on the server. Deletion is intentionally not
 * offered — values can only be added or renamed.
 */
export function OptionsManager({
  categories,
}: {
  categories: OptionCategoryData[];
}) {
  const [lists, setLists] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(categories.map((c) => [c.key, c.values]))
  );

  const setValues = (key: string, values: string[]) =>
    setLists((prev) => ({ ...prev, [key]: values }));

  return (
    <div className="space-y-6">
      {categories.map((cat) => (
        <CategorySection
          key={cat.key}
          categoryKey={cat.key}
          label={cat.label}
          values={lists[cat.key]}
          onValues={(v) => setValues(cat.key, v)}
        />
      ))}
    </div>
  );
}

function CategorySection({
  categoryKey,
  label,
  values,
  onValues,
}: {
  categoryKey: string;
  label: string;
  values: string[];
  onValues: (values: string[]) => void;
}) {
  const router = useRouter();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState("");
  const [busy, setBusy] = useState(false);

  async function rename(index: number) {
    const newValue = draft.trim();
    const oldValue = values[index];
    if (!newValue || newValue === oldValue) {
      setEditingIndex(null);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/options", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: categoryKey, oldValue, newValue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Rename failed");
      onValues(data.values);
      setEditingIndex(null);
      toast.success(`Renamed to "${newValue}" — updated everywhere it's used`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rename failed");
    } finally {
      setBusy(false);
    }
  }

  async function add() {
    const value = adding.trim();
    if (!value) return;
    setBusy(true);
    try {
      const res = await fetch("/api/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: categoryKey, value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't add value");
      onValues(data.values);
      setAdding("");
      toast.success(`Added "${value}"`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't add value");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="border border-border bg-card p-5 sm:p-6">
      <h2 className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-foreground">
        <span aria-hidden className="h-3 w-1.5 bg-primary" />
        {label}
      </h2>

      <ul className="mt-4 divide-y divide-border border border-border">
        {values.map((value, index) => {
          const editing = editingIndex === index;
          return (
            <li
              key={`${value}-${index}`}
              className="flex items-center justify-between gap-3 px-3 py-2.5"
            >
              {editing ? (
                <>
                  <Input
                    autoFocus
                    value={draft}
                    disabled={busy}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        rename(index);
                      } else if (e.key === "Escape") {
                        setEditingIndex(null);
                      }
                    }}
                    className="h-9"
                  />
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      disabled={busy}
                      onClick={() => rename(index)}
                      aria-label="Save"
                    >
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      disabled={busy}
                      onClick={() => setEditingIndex(null)}
                      aria-label="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <span className="font-medium">{value}</span>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    disabled={busy}
                    onClick={() => {
                      setEditingIndex(index);
                      setDraft(value);
                    }}
                    aria-label={`Rename ${value}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex items-center gap-2">
        <Input
          placeholder={`Add a ${label.toLowerCase()} value…`}
          value={adding}
          disabled={busy}
          onChange={(e) => setAdding(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          className="h-9"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy || !adding.trim()}
          onClick={add}
          className="shrink-0"
        >
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>
    </section>
  );
}
