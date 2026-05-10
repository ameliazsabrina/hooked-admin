"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatTimestamp } from "@/lib/format";
import { Copy } from "lucide-react";

function HashCell({ value }: { value: string | null }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="inline-flex items-center gap-1">
      <span className="font-mono text-xs">{value.slice(0, 16)}…</span>
      <button
        type="button"
        onClick={() => navigator.clipboard.writeText(value)}
        className="text-muted-foreground hover:text-foreground"
        aria-label="copy"
      >
        <Copy className="h-3 w-3" />
      </button>
    </span>
  );
}

export default function SeedsPage() {
  const [page, setPage] = useState(1);
  const limit = 30;
  const list = trpc.admin.seeds.list.useQuery({ page, limit });
  const totalPages = list.data
    ? Math.max(1, Math.ceil(list.data.totalCount / limit))
    : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Daily Seeds</h1>
        <p className="text-sm text-muted-foreground">
          Commit-reveal RNG audit. The hash is published when the row is
          created; the raw seed is exposed only after the day ends so players
          can recompute their catch outcomes and verify the server didn&apos;t
          re-roll.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seeds ({list.data?.totalCount ?? 0})</CardTitle>
          <p className="text-xs text-muted-foreground">
            <span className="font-mono">seedHash = sha256(seed)</span>. Casts
            during the day write{" "}
            <span className="font-mono">sha256(seedForCast(seed, …))</span>{" "}
            to <code>FishingSession.pendingCast.seedHash</code>; once revealed,
            the catch is verifiable.
          </p>
        </CardHeader>
        <CardContent>
          {list.isLoading && (
            <p className="text-sm text-muted-foreground">Loading…</p>
          )}
          {list.error && (
            <p className="text-sm text-destructive">{list.error.message}</p>
          )}
          {list.data && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date (UTC)</TableHead>
                  <TableHead>Reveal status</TableHead>
                  <TableHead>Seed hash (sha256)</TableHead>
                  <TableHead>Raw seed</TableHead>
                  <TableHead>Published at</TableHead>
                  <TableHead>Reveal after</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.data.items.map((s) => (
                  <TableRow key={s.date}>
                    <TableCell className="font-mono">{s.date}</TableCell>
                    <TableCell>
                      {s.revealed ? (
                        <Badge variant="success">revealed</Badge>
                      ) : (
                        <Badge variant="secondary">pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <HashCell value={s.seedHashHex} />
                    </TableCell>
                    <TableCell>
                      {s.seedHex ? (
                        <HashCell value={s.seedHex} />
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          hidden until reveal
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatTimestamp(s.publishedAt as unknown as Date)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatTimestamp(s.revealAfter as unknown as Date)}
                    </TableCell>
                  </TableRow>
                ))}
                {list.data.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        No seeds yet — first session of the day creates one.
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Page {page} / {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(Math.max(1, page - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(Math.min(totalPages, page + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
