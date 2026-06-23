"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { UploadCloud, X, Loader2, Image as ImageIcon, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MediaDTO } from "@/lib/types";

interface MediaUploaderProps {
  value: MediaDTO[];
  onChange: (media: MediaDTO[]) => void;
}

/**
 * Multi-file image/video uploader. Files are uploaded to /api/upload as soon as
 * they're chosen and the returned { type, path } descriptors are appended to the
 * form's `media` array. Previews render straight from the saved public paths.
 */
export function MediaUploader({ value, onChange }: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    setUploading(true);
    try {
      const form = new FormData();
      files.forEach((f) => form.append("files", f));

      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Upload failed");
      }

      onChange([...value, ...(data.media as MediaDTO[])]);
      toast.success(
        `${data.media.length} file${data.media.length > 1 ? "s" : ""} uploaded`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {/* Dropzone */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-secondary/30"
        )}
      >
        {uploading ? (
          <Loader2 className="mb-2 h-6 w-6 animate-spin text-primary" />
        ) : (
          <UploadCloud className="mb-2 h-6 w-6 text-muted-foreground" />
        )}
        <p className="text-sm font-medium">
          {uploading ? "Uploading…" : "Drop images or videos, or click to browse"}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          JPG, PNG, WebP, GIF · MP4, WebM, MOV — multiple allowed
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Previews */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {value.map((m, i) => (
            <div
              key={`${m.path}-${i}`}
              className="group relative aspect-square overflow-hidden rounded-lg ring-1 ring-border"
            >
              {m.type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.path}
                  alt="upload preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <video
                  src={m.path}
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                />
              )}
              <span className="absolute left-1 top-1 rounded bg-black/60 px-1 py-0.5 text-[10px] text-white">
                {m.type === "image" ? (
                  <ImageIcon className="inline h-3 w-3" />
                ) : (
                  <Film className="inline h-3 w-3" />
                )}
              </span>
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity hover:bg-destructive group-hover:opacity-100"
                aria-label="Remove media"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {value.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {value.length} item{value.length > 1 ? "s" : ""} attached
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-muted-foreground"
            onClick={() => onChange([])}
          >
            Remove all
          </Button>
        </div>
      )}
    </div>
  );
}
