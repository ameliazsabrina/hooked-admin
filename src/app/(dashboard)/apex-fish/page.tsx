"use client";

import Link from "next/link";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Pencil } from "lucide-react";
import { formatTimestamp } from "@/lib/format";

export default function ApexFishListPage() {
  const utils = trpc.useUtils();
  const list = trpc.admin.apexFish.list.useQuery();
  const del = trpc.admin.apexFish.delete.useMutation({
    onSuccess: () => {
      void utils.admin.apexFish.list.invalidate();
      void utils.admin.event.apexCatalog.invalidate();
    },
  });

  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(id: string, name: string) {
    if (
      !confirm(
        `Delete apex fish "${name}"? This is refused if any active or scheduled event references it.`,
      )
    ) {
      return;
    }
    setError(null);
    setPendingDelete(id);
    try {
      await del.mutateAsync({ id });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPendingDelete(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Apex fish</h1>
          <p className="text-sm text-muted-foreground">
            Admin-managed apex fish catalog. Each entry is reusable across
            events; the cast roll picks from the subset selected on the
            event itself.
          </p>
        </div>
        <Link href="/apex-fish/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New apex fish
          </Button>
        </Link>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {list.data
              ? `${list.data.length} fish${list.data.length === 1 ? "" : ""}`
              : "Catalog"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {list.isLoading && (
            <p className="text-sm text-muted-foreground">Loading…</p>
          )}
          {list.error && (
            <p className="text-sm text-destructive">{list.error.message}</p>
          )}
          {list.data && list.data.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No apex fish yet. Upload one to make it available for events.
            </p>
          )}
          {list.data && list.data.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.data.map((fish) => (
                <div
                  key={fish.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={fish.assetUrl}
                    alt={fish.name}
                    className="h-16 w-16 rounded-md bg-muted object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.visibility = "hidden";
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{fish.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {fish.weightMinKg}–{fish.weightMaxKg} kg
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Added {formatTimestamp(fish.createdAt)}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Link href={`/apex-fish/${fish.id}`}>
                      <Button size="sm" variant="outline">
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pendingDelete === fish.id}
                      onClick={() => handleDelete(fish.id, fish.name)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
