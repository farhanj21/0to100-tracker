"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SpecPair } from "@/lib/types";

interface ExtraSpecsEditorProps {
  specs: SpecPair[];
  features: string[];
  onSpecsChange: (specs: SpecPair[]) => void;
  onFeaturesChange: (features: string[]) => void;
}

/**
 * Editable spec sheet (label/value rows) + feature chips. Pre-populated by the
 * "Auto-fill from web" lookup, but fully editable so the admin can add, correct,
 * or remove anything before saving.
 */
export function ExtraSpecsEditor({
  specs,
  features,
  onSpecsChange,
  onFeaturesChange,
}: ExtraSpecsEditorProps) {
  const [featureInput, setFeatureInput] = useState("");

  function updateSpec(index: number, patch: Partial<SpecPair>) {
    onSpecsChange(specs.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function addFeature() {
    const v = featureInput.trim();
    if (!v) return;
    if (!features.includes(v)) onFeaturesChange([...features, v]);
    setFeatureInput("");
  }

  const hasAny = specs.length > 0 || features.length > 0;

  return (
    <div className="space-y-5">
      {/* Specs */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">
            Specifications
          </p>
          {hasAny && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-muted-foreground"
              onClick={() => {
                onSpecsChange([]);
                onFeaturesChange([]);
              }}
            >
              Clear all
            </Button>
          )}
        </div>

        {specs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            None yet — use{" "}
            <span className="font-medium text-foreground">Auto-fill from web</span>{" "}
            above, or add rows manually.
          </p>
        ) : (
          <div className="space-y-2">
            {specs.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  className="w-1/3"
                  placeholder="Label (e.g. Power)"
                  value={s.label}
                  onChange={(e) => updateSpec(i, { label: e.target.value })}
                />
                <Input
                  className="flex-1"
                  placeholder="Value (e.g. 389 hp)"
                  value={s.value}
                  onChange={(e) => updateSpec(i, { value: e.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => onSpecsChange(specs.filter((_, idx) => idx !== i))}
                  aria-label="Remove spec"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onSpecsChange([...specs, { label: "", value: "" }])}
        >
          <Plus className="h-4 w-4" /> Add spec
        </Button>
      </div>

      {/* Features */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Features</p>
        {features.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {features.map((f, i) => (
              <span
                key={`${f}-${i}`}
                className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs"
              >
                {f}
                <button
                  type="button"
                  onClick={() =>
                    onFeaturesChange(features.filter((_, idx) => idx !== i))
                  }
                  className="text-muted-foreground transition-colors hover:text-destructive"
                  aria-label={`Remove ${f}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <Input
            placeholder="Add a feature…"
            value={featureInput}
            onChange={(e) => setFeatureInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addFeature();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addFeature}
            disabled={!featureInput.trim()}
          >
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      </div>
    </div>
  );
}
