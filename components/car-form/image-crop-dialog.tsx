"use client";

import { useEffect, useRef, useState } from "react";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Crop as CropIcon, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Aspect presets. `undefined` = free-form. */
const ASPECTS: { label: string; value: number | undefined }[] = [
  { label: "Free", value: undefined },
  { label: "16:9", value: 16 / 9 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:2", value: 3 / 2 },
  { label: "1:1", value: 1 },
];

function centeredCrop(width: number, height: number, aspect?: number): Crop {
  const base = aspect
    ? makeAspectCrop({ unit: "%", width: 90 }, aspect, width, height)
    : ({ unit: "%", x: 5, y: 5, width: 90, height: 90 } as Crop);
  return centerCrop(base, width, height);
}

function percentToPixel(
  crop: Crop,
  width: number,
  height: number
): PixelCrop {
  return {
    unit: "px",
    x: (crop.x / 100) * width,
    y: (crop.y / 100) * height,
    width: (crop.width / 100) * width,
    height: (crop.height / 100) * height,
  };
}

/** Output a cropped File from the displayed <img> and a pixel crop. */
async function cropToFile(
  image: HTMLImageElement,
  crop: PixelCrop,
  fileName: string,
  mime: string
): Promise<File> {
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const pixelW = Math.max(1, Math.round(crop.width * scaleX));
  const pixelH = Math.max(1, Math.round(crop.height * scaleY));

  const canvas = document.createElement("canvas");
  canvas.width = pixelW;
  canvas.height = pixelH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    pixelW,
    pixelH
  );

  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Crop failed"))),
      mime,
      0.92
    )
  );
  return new File([blob], fileName, { type: mime });
}

function outputMime(type: string): string {
  return ["image/jpeg", "image/png", "image/webp"].includes(type)
    ? type
    : "image/jpeg";
}

interface ImageCropDialogProps {
  /** The image to crop, or null when the dialog is closed. */
  file: File | null;
  index: number;
  total: number;
  onResolve: (file: File) => void;
  onCancel: () => void;
}

export function ImageCropDialog({
  file,
  index,
  total,
  onResolve,
  onCancel,
}: ImageCropDialogProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  // Build / revoke an object URL for the current file.
  useEffect(() => {
    if (!file) {
      setSrc(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setSrc(url);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setAspect(undefined);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const initial = centeredCrop(width, height, aspect);
    setCrop(initial);
    setCompletedCrop(percentToPixel(initial, width, height));
  }

  function applyAspect(value: number | undefined) {
    setAspect(value);
    const image = imgRef.current;
    if (!image) return;
    const next = centeredCrop(image.width, image.height, value);
    setCrop(next);
    setCompletedCrop(percentToPixel(next, image.width, image.height));
  }

  async function confirmCrop() {
    if (!file || !imgRef.current || !completedCrop || completedCrop.width === 0) {
      // Nothing to crop — fall back to the original.
      if (file) onResolve(file);
      return;
    }
    setBusy(true);
    try {
      const mime = outputMime(file.type);
      const cropped = await cropToFile(
        imgRef.current,
        completedCrop,
        file.name,
        mime
      );
      onResolve(cropped);
    } catch {
      // If cropping fails for any reason, keep the original so the upload still works.
      onResolve(file);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={file !== null}
      onOpenChange={(open) => {
        if (!open && !busy) onCancel();
      }}
    >
      <DialogContent className="max-w-2xl" hideClose>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CropIcon className="h-4 w-4 text-primary" /> Crop image
            {total > 1 && (
              <span className="ml-auto text-xs font-normal text-muted-foreground tabular-nums">
                {index + 1} of {total}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            Drag to adjust the crop, or pick an aspect ratio. Skip to upload the
            original.
          </DialogDescription>
        </DialogHeader>

        {/* Aspect presets */}
        <div className="flex flex-wrap gap-1.5">
          {ASPECTS.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={() => applyAspect(a.value)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                aspect === a.value
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border text-muted-foreground hover:bg-secondary"
              )}
            >
              {a.label}
            </button>
          ))}
        </div>

        {/* Crop surface */}
        <div className="flex max-h-[55vh] justify-center overflow-auto rounded-lg bg-black/40 p-2">
          {src && (
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
              keepSelection
              className="max-h-[50vh]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={src}
                alt="Crop preview"
                onLoad={onImageLoad}
                className="max-h-[50vh] w-auto object-contain"
              />
            </ReactCrop>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
            <X className="h-4 w-4" /> Cancel
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => file && onResolve(file)}
              disabled={busy}
            >
              Use original
            </Button>
            <Button type="button" onClick={confirmCrop} disabled={busy}>
              <Check className="h-4 w-4" />
              {total > 1 && index + 1 < total ? "Crop & next" : "Crop & upload"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
