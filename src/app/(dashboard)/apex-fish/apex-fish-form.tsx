"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME = ["image/png", "image/jpeg", "image/webp"] as const;
type ApexImageMime = (typeof ALLOWED_MIME)[number];

export interface ApexFishFormValues {
  name: string;
  weightMinKg: number;
  weightMaxKg: number;
  imageBase64?: string;
  imageMimeType?: ApexImageMime;
}

interface ApexFishFormProps {
  initial?: {
    name: string;
    weightMinKg: number;
    weightMaxKg: number;
    /** Existing image URL when editing — preview only. */
    assetUrl?: string;
  };
  /** When true, image upload is required (creating a new fish). */
  imageRequired: boolean;
  submitting?: boolean;
  submitLabel?: string;
  onSubmit: (values: ApexFishFormValues) => Promise<void>;
  onCancel?: () => void;
  error?: string | null;
}

async function readFileAsBase64(file: File): Promise<{
  base64: string;
  mime: ApexImageMime;
}> {
  if (!ALLOWED_MIME.includes(file.type as ApexImageMime)) {
    throw new Error(
      `Unsupported image format: ${file.type}. Use PNG / JPEG / WEBP.`,
    );
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(
      `Image too large: ${file.size} bytes (max ${MAX_IMAGE_BYTES}).`,
    );
  }
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return { base64: btoa(binary), mime: file.type as ApexImageMime };
}

export function ApexFishForm({
  initial,
  imageRequired,
  submitting,
  submitLabel,
  onSubmit,
  onCancel,
  error,
}: ApexFishFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [weightMinKg, setWeightMinKg] = useState(initial?.weightMinKg ?? 30);
  const [weightMaxKg, setWeightMaxKg] = useState(initial?.weightMaxKg ?? 50);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initial?.assetUrl ?? null,
  );
  const [localError, setLocalError] = useState<string | null>(null);

  function handleFile(picked: File | null) {
    setLocalError(null);
    setFile(picked);
    if (!picked) {
      setPreviewUrl(initial?.assetUrl ?? null);
      return;
    }
    setPreviewUrl(URL.createObjectURL(picked));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    if (name.trim().length === 0) {
      setLocalError("Name is required");
      return;
    }
    if (weightMaxKg < weightMinKg) {
      setLocalError("weightMaxKg must be ≥ weightMinKg");
      return;
    }
    if (imageRequired && !file) {
      setLocalError("Image is required");
      return;
    }
    let imageBase64: string | undefined;
    let imageMimeType: ApexImageMime | undefined;
    if (file) {
      try {
        const decoded = await readFileAsBase64(file);
        imageBase64 = decoded.base64;
        imageMimeType = decoded.mime;
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : String(err));
        return;
      }
    }
    await onSubmit({
      name: name.trim(),
      weightMinKg: Number(weightMinKg),
      weightMaxKg: Number(weightMaxKg),
      imageBase64,
      imageMimeType,
    });
  }

  const displayError = localError ?? error;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Fish details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Leviathan Prime"
              maxLength={64}
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="weightMinKg">Weight min (kg)</Label>
              <Input
                id="weightMinKg"
                type="number"
                min={0}
                step={0.1}
                value={weightMinKg}
                onChange={(e) => setWeightMinKg(Number(e.target.value))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weightMaxKg">Weight max (kg)</Label>
              <Input
                id="weightMaxKg"
                type="number"
                min={0}
                step={0.1}
                value={weightMaxKg}
                onChange={(e) => setWeightMaxKg(Number(e.target.value))}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Image</CardTitle>
          <p className="text-xs text-muted-foreground">
            PNG / JPEG / WEBP, ≤ 2 MB. {imageRequired ? "Required." : "Leave empty to keep the current image."}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4">
            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="preview"
                className="h-24 w-24 rounded-md bg-muted object-contain"
              />
            )}
            <Input
              type="file"
              accept={ALLOWED_MIME.join(",")}
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
          </div>
        </CardContent>
      </Card>

      {displayError && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{displayError}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : (submitLabel ?? "Save")}
        </Button>
      </div>
    </form>
  );
}
