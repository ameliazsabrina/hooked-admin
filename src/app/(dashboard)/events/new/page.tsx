"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, X } from "lucide-react";

const ALLOWED_MIME = ["image/png", "image/jpeg", "image/webp"] as const;
type ApexImageMime = (typeof ALLOWED_MIME)[number];
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

/**
 * Helper to format a date for `<input type="datetime-local">`. The input
 * works in local time, so we format the local components (dropping the
 * timezone offset). When we send it back, the browser parses local-time
 * → ISO with the local offset, which Mongo stores as UTC.
 */
function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
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

export default function NewEventPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const apexCatalog = trpc.admin.event.apexCatalog.useQuery();
  const create = trpc.admin.event.create.useMutation();
  const createApex = trpc.admin.apexFish.create.useMutation();

  const [name, setName] = useState("");
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60_000);
  const [startsAt, setStartsAt] = useState(toDatetimeLocal(now));
  const [endsAt, setEndsAt] = useState(toDatetimeLocal(oneHourLater));
  const [apexBp, setApexBp] = useState(1000);
  const [prizePoolSol, setPrizePoolSol] = useState(0);
  const [selectedFish, setSelectedFish] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Inline "+ New apex fish" form state
  const [inlineOpen, setInlineOpen] = useState(false);
  const [inlineName, setInlineName] = useState("");
  const [inlineWeightMin, setInlineWeightMin] = useState(30);
  const [inlineWeightMax, setInlineWeightMax] = useState(50);
  const [inlineFile, setInlineFile] = useState<File | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const canSubmit =
    name.trim().length >= 1 &&
    selectedFish.size >= 1 &&
    apexBp >= 0 &&
    apexBp <= 5000 &&
    prizePoolSol >= 0 &&
    new Date(endsAt).getTime() > new Date(startsAt).getTime();

  function toggleFish(id: string) {
    setSelectedFish((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function resetInlineForm() {
    setInlineOpen(false);
    setInlineName("");
    setInlineWeightMin(30);
    setInlineWeightMax(50);
    setInlineFile(null);
    setInlineError(null);
  }

  async function handleInlineCreate(e: React.FormEvent) {
    e.preventDefault();
    setInlineError(null);
    if (!inlineFile) {
      setInlineError("Image is required");
      return;
    }
    if (inlineName.trim().length === 0) {
      setInlineError("Name is required");
      return;
    }
    if (inlineWeightMax < inlineWeightMin) {
      setInlineError("Weight max must be ≥ weight min");
      return;
    }
    let decoded;
    try {
      decoded = await readFileAsBase64(inlineFile);
    } catch (err) {
      setInlineError(err instanceof Error ? err.message : String(err));
      return;
    }
    try {
      const created = await createApex.mutateAsync({
        name: inlineName.trim(),
        weightMinKg: inlineWeightMin,
        weightMaxKg: inlineWeightMax,
        imageBase64: decoded.base64,
        imageMimeType: decoded.mime,
      });
      // Refresh the catalog and auto-select the new fish.
      await utils.admin.event.apexCatalog.invalidate();
      await utils.admin.event.apexCatalog.refetch();
      setSelectedFish((prev) => {
        const next = new Set(prev);
        next.add(created.id);
        return next;
      });
      resetInlineForm();
    } catch (err) {
      setInlineError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!canSubmit) return;
    try {
      const result = await create.mutateAsync({
        name: name.trim(),
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
        apexBp,
        prizePoolSol,
        apexFishIds: Array.from(selectedFish).sort(),
      });
      router.push(`/events/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New event</h1>
        <p className="text-sm text-muted-foreground">
          Schedule a future Apex event. The lifecycle worker activates it
          automatically when <strong>Starts at</strong> arrives.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Colosseum"
                maxLength={64}
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startsAt">Starts at (local)</Label>
                <Input
                  id="startsAt"
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endsAt">Ends at (local)</Label>
                <Input
                  id="endsAt"
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Drop rate &amp; prize</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apexBp">Apex BP (0 – 5000)</Label>
              <Input
                id="apexBp"
                type="number"
                min={0}
                max={5000}
                step={100}
                value={apexBp}
                onChange={(e) => setApexBp(Number(e.target.value))}
                required
              />
              <p className="text-xs text-muted-foreground">
                Basis points (out of 10,000) redirected from Basic to Apex
                during this event. 1000 = 10% of casts get an Apex chance.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prizePoolSol">Prize pool (SOL)</Label>
              <Input
                id="prizePoolSol"
                type="number"
                min={0}
                step={0.01}
                value={prizePoolSol}
                onChange={(e) => setPrizePoolSol(Number(e.target.value))}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Active apex fish</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Pick at least one. When an Apex tier rolls during this
                  event, the cast picks uniformly from the selected fish.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setInlineOpen((v) => !v)}
              >
                {inlineOpen ? (
                  <>
                    <X className="mr-1 h-3 w-3" /> Close
                  </>
                ) : (
                  <>
                    <Plus className="mr-1 h-3 w-3" /> Add new apex fish
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {inlineOpen && (
              <div className="mb-4 rounded-lg border p-4 space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="inlineName">Name</Label>
                    <Input
                      id="inlineName"
                      value={inlineName}
                      onChange={(e) => setInlineName(e.target.value)}
                      maxLength={64}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="inlineFile">Image (PNG/JPEG/WEBP, ≤2MB)</Label>
                    <Input
                      id="inlineFile"
                      type="file"
                      accept={ALLOWED_MIME.join(",")}
                      onChange={(e) =>
                        setInlineFile(e.target.files?.[0] ?? null)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="inlineWeightMin">Weight min (kg)</Label>
                    <Input
                      id="inlineWeightMin"
                      type="number"
                      min={0}
                      step={0.1}
                      value={inlineWeightMin}
                      onChange={(e) =>
                        setInlineWeightMin(Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="inlineWeightMax">Weight max (kg)</Label>
                    <Input
                      id="inlineWeightMax"
                      type="number"
                      min={0}
                      step={0.1}
                      value={inlineWeightMax}
                      onChange={(e) =>
                        setInlineWeightMax(Number(e.target.value))
                      }
                    />
                  </div>
                </div>
                {inlineError && (
                  <p className="text-sm text-destructive">{inlineError}</p>
                )}
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={resetInlineForm}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleInlineCreate}
                    disabled={createApex.isPending}
                  >
                    {createApex.isPending ? "Uploading…" : "Upload"}
                  </Button>
                </div>
              </div>
            )}

            {apexCatalog.isLoading && (
              <p className="text-sm text-muted-foreground">Loading…</p>
            )}
            {apexCatalog.error && (
              <p className="text-sm text-destructive">
                {apexCatalog.error.message}
              </p>
            )}
            {apexCatalog.data && apexCatalog.data.length === 0 && (
              <div className="rounded-lg border border-amber-300 bg-amber-50/50 p-4 text-sm dark:bg-amber-950/20">
                <p className="font-medium">No apex fish in the catalog.</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Use the <strong>Add new apex fish</strong> button above to
                  upload one, or run the migration script if you&apos;re
                  importing legacy fish.
                </p>
              </div>
            )}
            {apexCatalog.data && apexCatalog.data.length > 0 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {apexCatalog.data.map((fish) => {
                  const isSelected = selectedFish.has(fish.id);
                  return (
                    <button
                      key={fish.id}
                      type="button"
                      onClick={() => toggleFish(fish.id)}
                      className={`flex items-center gap-3 rounded-lg border p-3 text-left transition ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={fish.assetUrl}
                        alt={fish.name}
                        className="h-12 w-12 rounded-md bg-muted object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.visibility =
                            "hidden";
                        }}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{fish.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {fish.weightMin}–{fish.weightMax} kg
                        </div>
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground truncate max-w-[6ch]">
                        {fish.id.slice(-6)}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between">
          <Link href="/events">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={!canSubmit || create.isPending}>
            {create.isPending ? "Creating…" : "Create event"}
          </Button>
        </div>
      </form>
    </div>
  );
}
