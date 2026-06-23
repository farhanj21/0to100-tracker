"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  UploadCloud,
  X,
  Loader2,
  Image as ImageIcon,
  Film,
  Crop as CropIcon,
  Youtube,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageCropDialog } from "@/components/car-form/image-crop-dialog";
import { cn } from "@/lib/utils";
import { extractYouTubeId, youTubeThumb } from "@/lib/youtube";
import type { MediaDTO } from "@/lib/types";

interface MediaUploaderProps {
  value: MediaDTO[];
  onChange: (media: MediaDTO[]) => void;
}

/** Fetch an already-uploaded image URL back into a local File so it can be
 *  re-cropped on a same-origin canvas (avoids cross-origin canvas tainting). */
async function urlToFile(url: string): Promise<File> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Could not load image");
  const blob = await res.blob();
  const name = url.split("/").pop()?.split("?")[0] || "image";
  return new File([blob], name, { type: blob.type || "image/jpeg" });
}

/**
 * Multi-file image/video uploader.
 *
 * Videos upload immediately. Images are routed through a crop dialog before
 * upload, and any already-uploaded image can be re-cropped via its "Crop"
 * button (it's re-uploaded and replaces the original; the stale asset is cleaned
 * up when the car is saved). Previews render from the saved URLs.
 */
export function MediaUploader({ value, onChange }: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [linkInput, setLinkInput] = useState("");

  // Crop queue: images awaiting cropping before upload.
  const [cropQueue, setCropQueue] = useState<File[]>([]);
  const [cropIndex, setCropIndex] = useState(0);
  const resolvedRef = useRef<File[]>([]);
  // When set, the crop result replaces value[recropIndex] instead of appending.
  const [recropIndex, setRecropIndex] = useState<number | null>(null);

  /** Upload files to Cloudinary; returns the saved descriptors or null on error. */
  async function uploadRaw(files: File[]): Promise<MediaDTO[] | null> {
    if (files.length === 0) return null;
    setUploading(true);
    try {
      const form = new FormData();
      files.forEach((f) => form.append("files", f));
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      return data.media as MediaDTO[];
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function uploadAndAppend(files: File[]) {
    const media = await uploadRaw(files);
    if (!media) return;
    onChange([...value, ...media]);
    toast.success(
      `${media.length} file${media.length > 1 ? "s" : ""} uploaded`
    );
  }

  /** Finalize a completed crop batch — either replace one item or append. */
  async function finishBatch(files: File[], replaceIndex: number | null) {
    const media = await uploadRaw(files);
    if (!media) return;
    if (replaceIndex !== null) {
      const next = [...value];
      if (next[replaceIndex]) next[replaceIndex] = media[0];
      onChange(next);
      toast.success("Image re-cropped");
    } else {
      onChange([...value, ...media]);
      toast.success(
        `${media.length} file${media.length > 1 ? "s" : ""} uploaded`
      );
    }
  }

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    if (inputRef.current) inputRef.current.value = "";

    const images = files.filter((f) => f.type.startsWith("image/"));
    const others = files.filter((f) => !f.type.startsWith("image/"));

    if (others.length) void uploadAndAppend(others);

    if (images.length) {
      resolvedRef.current = [];
      setRecropIndex(null);
      setCropIndex(0);
      setCropQueue(images);
    }
  }

  async function startRecrop(i: number) {
    try {
      const file = await urlToFile(value[i].path);
      resolvedRef.current = [];
      setRecropIndex(i);
      setCropIndex(0);
      setCropQueue([file]);
    } catch {
      toast.error("Could not load image for cropping");
    }
  }

  function handleCropResolve(file: File) {
    resolvedRef.current = [...resolvedRef.current, file];
    const nextIndex = cropIndex + 1;
    if (nextIndex < cropQueue.length) {
      setCropIndex(nextIndex);
    } else {
      const batch = resolvedRef.current;
      const replaceIndex = recropIndex;
      resolvedRef.current = [];
      setCropQueue([]);
      setCropIndex(0);
      setRecropIndex(null);
      void finishBatch(batch, replaceIndex);
    }
  }

  function handleCropCancel() {
    resolvedRef.current = [];
    setCropQueue([]);
    setCropIndex(0);
    setRecropIndex(null);
  }

  function addYouTubeLink() {
    const id = extractYouTubeId(linkInput);
    if (!id) {
      toast.error("Enter a valid YouTube link");
      return;
    }
    if (value.some((m) => m.type === "youtube" && m.path === id)) {
      toast.error("That video is already added");
      setLinkInput("");
      return;
    }
    onChange([...value, { type: "youtube", path: id }]);
    toast.success("YouTube video added");
    setLinkInput("");
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
          "flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed px-6 py-10 text-center transition-colors",
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
          JPG, PNG, WebP, GIF · MP4, WebM, MOV. Crop images before they upload.
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

      {/* YouTube link */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Youtube className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-500" />
          <Input
            type="url"
            inputMode="url"
            placeholder="Paste a YouTube link to embed…"
            className="pl-9"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addYouTubeLink();
              }
            }}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={addYouTubeLink}
          disabled={!linkInput.trim()}
        >
          <Plus className="h-4 w-4" /> Add
        </Button>
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
              ) : m.type === "youtube" ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={youTubeThumb(m.path)}
                    alt="YouTube preview"
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Youtube className="h-6 w-6 text-white" />
                  </span>
                </>
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
                ) : m.type === "youtube" ? (
                  <Youtube className="inline h-3 w-3" />
                ) : (
                  <Film className="inline h-3 w-3" />
                )}
              </span>

              {/* Re-crop (images only) */}
              {m.type === "image" && (
                <button
                  type="button"
                  onClick={() => startRecrop(i)}
                  disabled={uploading}
                  className="absolute bottom-1 right-1 inline-flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity hover:bg-primary disabled:opacity-50 group-hover:opacity-100"
                  aria-label="Crop image"
                  title="Crop image"
                >
                  <CropIcon className="h-3 w-3" /> Crop
                </button>
              )}

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

      {/* Crop dialog (open while images are queued) */}
      <ImageCropDialog
        file={cropQueue[cropIndex] ?? null}
        index={cropIndex}
        total={cropQueue.length}
        allowUseOriginal={recropIndex === null}
        confirmLabel={recropIndex !== null ? "Crop & replace" : undefined}
        onResolve={handleCropResolve}
        onCancel={handleCropCancel}
      />
    </div>
  );
}
