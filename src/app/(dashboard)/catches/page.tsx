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
import { Badge } from "@/components/ui/badge";
import { AddressLink } from "@/components/tx-link";
import { formatTimestamp, truncatePubkey } from "@/lib/format";

type Rarity = "basic" | "rare" | "monster" | "legendary" | "apex";
type RarityFilter = Rarity | "all";

const RARITY_OPTIONS = [
  { value: "all", label: "All" },
  { value: "basic", label: "basic" },
  { value: "rare", label: "rare" },
  { value: "monster", label: "monster" },
  { value: "legendary", label: "legendary" },
  { value: "apex", label: "apex" },
] as const satisfies readonly { value: RarityFilter; label: string }[];

const RARITY_VARIANT: Record<
  Rarity,
  "default" | "secondary" | "destructive" | "outline" | "success" | "warning"
> = {
  basic: "outline",
  rare: "secondary",
  monster: "default",
  legendary: "warning",
  apex: "destructive",
};

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

export default function CatchesPage() {
  const [rarity, setRarity] = useState<RarityFilter>("all");
  const [wallet, setWallet] = useState("");
  const [submittedWallet, setSubmittedWallet] = useState<string | undefined>(
    undefined,
  );
  const [page, setPage] = useState(1);
  const limit = 50;

  const list = trpc.admin.catches.list.useQuery({
    rarity: rarity === "all" ? undefined : rarity,
    wallet: submittedWallet,
    page,
    limit,
  });
  const breakdown = trpc.admin.catches.rarityBreakdown.useQuery({
    sinceHours: 24,
  });

  const totalPages = list.data
    ? Math.max(1, Math.ceil(list.data.totalCount / limit))
    : 1;

  // Build rarity stats from breakdown
  const rarityCounts: Record<string, number> = {};
  for (const b of breakdown.data?.buckets ?? []) {
    rarityCounts[b._id] = b.count;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Catches</h1>
        <p className="text-sm text-muted-foreground">
          Server-rolled catch records. Each row is reproducible from the
          daily seed + session merkleRoot + castIndex.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          label="Basic (24h)"
          value={rarityCounts["basic"] ?? 0}
          hint="Common rolls — bulk of session score"
        />
        <StatCard
          label="Rare (24h)"
          value={rarityCounts["rare"] ?? 0}
          hint="Resets pity counter on catch"
        />
        <StatCard
          label="Monster (24h)"
          value={rarityCounts["monster"] ?? 0}
          hint="Mid-tier; significant score weight"
        />
        <StatCard
          label="Legendary (24h)"
          value={rarityCounts["legendary"] ?? 0}
          hint="Top-tier; pity-floor target"
        />
        <StatCard
          label="Apex (24h)"
          value={rarityCounts["apex"] ?? 0}
          hint="Event-only roll. Gated by eventApexBpAtStart."
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
              <label className="text-xs text-muted-foreground">Rarity</label>
              <FilterDropdown
                className="w-40"
                value={rarity}
                options={RARITY_OPTIONS}
                onValueChange={(value) => {
                  setRarity(value);
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
            <Button type="submit" variant="outline">
              Apply
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Catches ({list.data?.totalCount ?? 0})</CardTitle>
          <p className="text-xs text-muted-foreground">
            Click the session id to see the full session and its catch order.
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
                  <TableHead>Caught at</TableHead>
                  <TableHead>Wallet</TableHead>
                  <TableHead>Species</TableHead>
                  <TableHead>Rarity</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Bounty</TableHead>
                  <TableHead>Session</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.data.items.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatTimestamp(c.caughtAt as unknown as Date)}
                    </TableCell>
                    <TableCell>
                      <AddressLink address={c.walletAddress} />
                    </TableCell>
                    <TableCell>
                      {c.species}
                      {c.speciesId !== null && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          #{c.speciesId}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={RARITY_VARIANT[c.rarity as Rarity] ?? "outline"}
                      >
                        {c.rarity}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">
                      {c.weightKg.toFixed(2)} kg
                    </TableCell>
                    <TableCell className="font-mono">{c.score}</TableCell>
                    <TableCell>
                      {c.isBounty ? (
                        <Badge variant="warning">bounty</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {c.sessionId ? (
                        <Link
                          href={`/sessions/${c.sessionId}`}
                          className="font-mono text-xs hover:underline"
                        >
                          {truncatePubkey(c.sessionId, 4)}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">legacy</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {list.data.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        No catches match this filter.
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
