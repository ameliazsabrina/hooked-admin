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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FilterDropdown } from "@/components/filter-dropdown";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { AddressLink } from "@/components/tx-link";
import { formatTimestamp } from "@/lib/format";

type Outcome = "hit" | "escaped_no_tap" | "escaped_miss" | "cancelled";
type OutcomeFilter = Outcome | "all";

const OUTCOME_OPTIONS = [
  { value: "all", label: "All" },
  { value: "hit", label: "hit" },
  { value: "escaped_no_tap", label: "escaped_no_tap" },
  { value: "escaped_miss", label: "escaped_miss" },
  { value: "cancelled", label: "cancelled" },
] as const satisfies readonly { value: OutcomeFilter; label: string }[];

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

export default function ReactionsPage() {
  const [outcome, setOutcome] = useState<OutcomeFilter>("all");
  const [wallet, setWallet] = useState("");
  const [submittedWallet, setSubmittedWallet] = useState<string | undefined>(
    undefined,
  );
  const [suspiciousOnly, setSuspiciousOnly] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 100;

  const summary = trpc.admin.reactions.summary.useQuery({ sinceHours: 24 });
  const list = trpc.admin.reactions.list.useQuery({
    outcome: outcome === "all" ? undefined : outcome,
    wallet: submittedWallet,
    suspiciousOnly: suspiciousOnly || undefined,
    page,
    limit,
  });

  const totalPages = list.data
    ? Math.max(1, Math.ceil(list.data.totalCount / limit))
    : 1;

  const outcomeCounts: Record<string, number> = {};
  for (const o of summary.data?.outcomes ?? []) outcomeCounts[o._id] = o.count;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reaction Telemetry</h1>
        <p className="text-sm text-muted-foreground">
          Per-cast input timing logged by the WS gateway. Used to spot bots:
          impossibly fast reactions, repeated pre-nibble taps, or sample
          jitter outside human ranges.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          label="Total (24h)"
          value={summary.data?.totalSamples ?? 0}
          hint="Every cast resolution writes one row, regardless of outcome"
        />
        <StatCard
          label="Hits (24h)"
          value={outcomeCounts["hit"] ?? 0}
          hint="Player tapped during the green zone"
        />
        <StatCard
          label="Misses (24h)"
          value={outcomeCounts["escaped_miss"] ?? 0}
          hint="Tap was outside the green zone"
        />
        <StatCard
          label="No-tap (24h)"
          value={outcomeCounts["escaped_no_tap"] ?? 0}
          hint="Player never tapped within the reaction window"
        />
        <StatCard
          label="Suspicious (24h)"
          value={summary.data?.suspicious ?? 0}
          hint={`Reactions < ${
            summary.data?.suspiciousThresholdMs ?? 100
          }ms — below human-reflex floor`}
        />
      </div>

      <Card>
        <CardContent className="pt-6">
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              setSubmittedWallet(wallet.trim() || undefined);
              setPage(1);
            }}
          >
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Outcome</label>
              <FilterDropdown
                className="w-44"
                value={outcome}
                options={OUTCOME_OPTIONS}
                onValueChange={(value) => {
                  setOutcome(value);
                  setPage(1);
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Wallet</label>
              <Input
                className="w-72"
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                placeholder="player wallet pubkey"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">
                Suspicious only
              </label>
              <div className="flex h-10 items-center">
                <Switch
                  checked={suspiciousOnly}
                  onCheckedChange={(v) => {
                    setSuspiciousOnly(v);
                    setPage(1);
                  }}
                />
              </div>
            </div>
            <Button type="submit" variant="outline">
              Apply
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reactions ({list.data?.totalCount ?? 0})</CardTitle>
          <p className="text-xs text-muted-foreground">
            Suspicious rows are highlighted. Multiple suspicious rows from the
            same wallet should trigger a manual review.
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
                  <TableHead>When</TableHead>
                  <TableHead>Wallet</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Nibble delay</TableHead>
                  <TableHead>Reaction</TableHead>
                  <TableHead>Pre-taps</TableHead>
                  <TableHead>Jitter max</TableHead>
                  <TableHead>Rarity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.data.items.map((r) => (
                  <TableRow
                    key={r.id}
                    className={r.suspicious ? "bg-destructive/10" : undefined}
                  >
                    <TableCell className="text-xs text-muted-foreground">
                      {formatTimestamp(r.createdAt as unknown as Date)}
                    </TableCell>
                    <TableCell>
                      <AddressLink address={r.wallet} />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{r.outcome}</Badge>
                    </TableCell>
                    <TableCell className="font-mono">
                      {r.nibbleDelayMs}ms
                    </TableCell>
                    <TableCell className="font-mono">
                      {r.reactionTimeMs ?? "—"}
                      {r.reactionTimeMs !== null && "ms"}
                      {r.suspicious && (
                        <Badge variant="destructive" className="ml-2">
                          sus
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{r.preNibbleTapCount}</TableCell>
                    <TableCell>
                      {r.sampleJitterMaxMs !== null
                        ? `${r.sampleJitterMaxMs}ms`
                        : "—"}
                    </TableCell>
                    <TableCell>{r.rarity ?? "—"}</TableCell>
                  </TableRow>
                ))}
                {list.data.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        No reactions match this filter.
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
