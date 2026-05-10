"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { TxLink, AddressLink } from "@/components/tx-link";
import { formatTimestamp, truncatePubkey } from "@/lib/format";
import { ChevronLeft } from "lucide-react";

const RARITY_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline" | "success" | "warning"
> = {
  basic: "outline",
  rare: "secondary",
  monster: "default",
  legendary: "warning",
  apex: "destructive",
};

function KV({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4 px-3 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-sm" : "text-sm"}>{value}</span>
    </div>
  );
}

export default function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const query = trpc.admin.sessions.get.useQuery({ sessionId });

  if (query.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (query.error) {
    return <p className="text-sm text-destructive">{query.error.message}</p>;
  }
  const data = query.data!;
  const s = data.session;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/sessions"
          className="inline-flex items-center text-xs text-muted-foreground hover:underline"
        >
          <ChevronLeft className="h-3 w-3" />
          back to sessions
        </Link>
        <h1 className="mt-1 font-mono text-2xl font-semibold">
          {truncatePubkey(s.walletAddress, 8)}
        </h1>
        <div className="mt-2 flex items-center gap-2">
          <Badge
            variant={
              s.status === "active"
                ? "success"
                : s.status === "committed"
                  ? "default"
                  : "destructive"
            }
          >
            {s.status}
          </Badge>
          <Badge variant="outline">
            day {s.dateKey} · {s.window === 0 ? "day window" : "night window"}
          </Badge>
          <span className="text-xs text-muted-foreground">
            started {formatTimestamp(s.startedAt as unknown as Date)}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Player</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-1">
            <KV
              label="Wallet"
              value={<AddressLink address={s.walletAddress} />}
              mono
            />
            <KV
              label="Nickname"
              value={data.player?.nickname ?? "—"}
            />
            <KV
              label="Shells"
              value={data.player?.shellBalance ?? 0}
              mono
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session economy</CardTitle>
            <p className="text-xs text-muted-foreground">
              Bait derives from the deposit tier. Pity counter increases on
              non-rare rolls and resets on a rare+ catch.
            </p>
          </CardHeader>
          <CardContent className="grid gap-1">
            <KV label="Tier" value={s.tier} />
            <KV
              label="Bait"
              value={
                <span className="font-mono">
                  {s.baitRemaining}/{s.baitInitial}
                </span>
              }
            />
            <KV
              label="Score"
              value={<span className="font-mono">{s.sessionScore}</span>}
            />
            <KV label="Casts" value={s.castCount} />
            <KV label="Catches" value={s.catchCount} />
            <KV label="Pity counter" value={s.pityCounter} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audit & bridge</CardTitle>
            <p className="text-xs text-muted-foreground">
              Daily seed proves the RNG; merkle root + bridge tx commit the
              final score to hooked_rooms.
            </p>
          </CardHeader>
          <CardContent className="grid gap-1">
            <KV
              label="Daily seed"
              value={
                <Link
                  href={`/seeds`}
                  className="font-mono text-xs hover:underline"
                >
                  {s.dailySeedDate}
                </Link>
              }
            />
            <KV
              label="Merkle root"
              value={
                s.merkleRootHex ? (
                  <span className="font-mono text-xs">
                    {s.merkleRootHex.slice(0, 12)}…
                  </span>
                ) : (
                  "—"
                )
              }
            />
            <KV
              label="Score-bridge tx"
              value={<TxLink signature={s.chainScoreTxSignature} />}
            />
            <KV
              label="Bridged at"
              value={formatTimestamp(s.chainScoreBridgedAt as unknown as Date)}
            />
            <KV
              label="Committed at"
              value={formatTimestamp(s.committedAt as unknown as Date)}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event snapshot at session start</CardTitle>
          <p className="text-xs text-muted-foreground">
            Captured when startSession ran. Locked even if the active event
            config changes mid-day — guarantees a session can&apos;t be
            re-rolled.
          </p>
        </CardHeader>
        <CardContent className="grid gap-1 sm:grid-cols-3">
          <KV
            label="Active"
            value={
              s.eventActiveAtStart ? (
                <Badge variant="success">yes</Badge>
              ) : (
                <Badge variant="secondary">no</Badge>
              )
            }
          />
          <KV label="Name" value={s.eventNameAtStart ?? "—"} mono />
          <KV label="Apex BP" value={s.eventApexBpAtStart} mono />
          <KV
            label="Apex fish"
            value={
              s.eventApexFishesAtStart && s.eventApexFishesAtStart.length > 0
                ? s.eventApexFishesAtStart.map((f) => f.name).join(", ")
                : "—"
            }
            mono
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Catches ({data.catches.length})</CardTitle>
          <p className="text-xs text-muted-foreground">
            Rolled server-side from the daily seed + cast index. Each row is
            verifiable post-reveal via the Seeds tab.
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cast #</TableHead>
                <TableHead>Species</TableHead>
                <TableHead>Rarity</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Bounty</TableHead>
                <TableHead>Caught at</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.catches.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono">{c.castIndex}</TableCell>
                  <TableCell>
                    {c.species}
                    <span className="ml-2 text-xs text-muted-foreground">
                      #{c.speciesId}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={RARITY_VARIANT[c.rarity] ?? "outline"}>
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
                  <TableCell className="text-xs text-muted-foreground">
                    {formatTimestamp(c.caughtAt as unknown as Date)}
                  </TableCell>
                </TableRow>
              ))}
              {data.catches.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      No catches recorded for this session.
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Reaction logs (last {data.reactionLogs.length} for this wallet)
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Anti-cheat telemetry. Reaction time {"< 100ms"} is flagged as
            suspicious — the lower bound of human reflex.
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead>Nibble delay</TableHead>
                <TableHead>Reaction</TableHead>
                <TableHead>Pre-taps</TableHead>
                <TableHead>Jitter max</TableHead>
                <TableHead>Rarity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.reactionLogs.map((r) => {
                const sus =
                  typeof r.reactionTimeMs === "number" &&
                  r.reactionTimeMs > 0 &&
                  r.reactionTimeMs < 100;
                return (
                  <TableRow
                    key={r.id}
                    className={sus ? "bg-destructive/10" : undefined}
                  >
                    <TableCell className="text-xs text-muted-foreground">
                      {formatTimestamp(r.createdAt as unknown as Date)}
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
                      {sus && (
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
                );
              })}
              {data.reactionLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      No reaction telemetry for this wallet.
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
