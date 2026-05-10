"use client";

import Link from "next/link";
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
import { RoomPhaseBadge } from "@/components/room-status-badge";
import { SolAmount } from "@/components/sol-amount";
import { AddressLink } from "@/components/tx-link";
import { Badge } from "@/components/ui/badge";
import { formatTimestamp, lamportsToSol } from "@/lib/format";

function StatCard({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: React.ReactNode;
  hint: string;
  href?: string;
}) {
  const card = (
    <Card
      className={
        href
          ? "transition-colors hover:border-foreground/30 hover:bg-muted/40"
          : undefined
      }
    >
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
  if (href) {
    return (
      <Link href={href} className="block">
        {card}
      </Link>
    );
  }
  return card;
}

export default function DashboardPage() {
  const summary = trpc.admin.stats.summary.useQuery();
  if (summary.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (summary.error) {
    return (
      <p className="text-sm text-destructive">
        Error: {summary.error.message}
      </p>
    );
  }
  const data = summary.data!;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Live snapshot of rooms, LP cycle, and admin activity.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Entry"
          value={data.counts.entry}
          hint="Rooms currently accepting deposits"
          href="/rooms?phase=entry"
        />
        <StatCard
          label="Active"
          value={data.counts.active}
          hint="Rooms past entry — LP deployed, fishing live"
          href="/rooms?phase=active"
        />
        <StatCard
          label="Settling"
          value={data.counts.settling}
          hint="Past closesAt, settlement keeper running"
          href="/rooms?phase=settling"
        />
        <StatCard
          label="Closed"
          value={data.counts.closed}
          hint="Lifetime count of finalized rooms"
          href="/rooms?phase=closed"
        />
        <StatCard
          label="LP Failures"
          value={data.counts.lpFailures}
          hint="Rooms with lp.status=failed — needs ops attention"
          href="/lp?status=failed"
        />
        <StatCard
          label="Stuck Returns"
          value={data.counts.stuckReturns}
          hint="Closed rooms with unreturned player principal"
          href="/rooms?stuckReturns=true"
        />
        <StatCard
          label="Total Live SOL"
          value={
            <SolAmount sol={data.totalLiveDepositedSol} muted={false} />
          }
          hint="Sum of deposits across entry + active + settling rooms"
          href="/rooms"
        />
        <StatCard
          label="LP Manager Balance"
          value={
            <SolAmount lamports={data.lpManagerLamports} muted={false} />
          }
          hint={
            data.lpManagerAddress
              ? "Wallet that holds principal during LP cycle + IL buffer"
              : "LP_MANAGER_KEYPAIR not configured"
          }
          href="/lp"
        />
      </div>

      <div>
        <h2 className="mt-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Fishing (off-chain) — last 24h
        </h2>
        <p className="text-xs text-muted-foreground">
          Server-authoritative now that the on-chain hooked_fishing program
          has been retired. Activity below comes from MongoDB.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Active sessions"
          value={data.fishing.activeSessions}
          hint="FishingSessions in 'active' state — players currently fishing"
          href="/sessions"
        />
        <StatCard
          label="Sessions started"
          value={data.fishing.sessions24h}
          hint="New FishingSession docs in the last 24h"
          href="/sessions"
        />
        <StatCard
          label="Catches"
          value={data.fishing.catches24h}
          hint="Catch documents written in the last 24h"
          href="/catches"
        />
        <StatCard
          label="Apex catches"
          value={data.fishing.apexCatches24h}
          hint="Rarity=apex catches (event-only rolls) in the last 24h"
          href="/catches"
        />
        <StatCard
          label="Suspicious reactions"
          value={data.fishing.reactionsSuspicious24h}
          hint={`Reactions < ${data.fishing.suspiciousThresholdMs}ms in 24h — investigate per-wallet`}
          href="/reactions"
        />
        <StatCard
          label="Pending score bridge"
          value={data.fishing.pendingScoreBridge}
          hint="Committed sessions waiting on the keeper to write final score on-chain"
          href="/sessions"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Wallets</CardTitle>
          <p className="text-xs text-muted-foreground">
            On-chain balances of the two server-controlled wallets that move
            SOL through the room lifecycle.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">LP Manager</p>
            <div className="mt-1 flex items-center justify-between">
              <AddressLink address={data.lpManagerAddress} />
              <span className="font-mono">
                {lamportsToSol(data.lpManagerLamports)}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Holds room principal during the DLMM cycle + IL buffer that
              covers net loss on exit.
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Treasury</p>
            <div className="mt-1 flex items-center justify-between">
              <AddressLink address={data.treasuryAddress} />
              <span className="font-mono">
                {lamportsToSol(data.treasuryLamports)}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Receives the 30% protocol share of yield on every close_room.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Rooms</CardTitle>
          <p className="text-xs text-muted-foreground">
            5 most recently created rooms, newest first. Click roomId for full
            attributes and SOL flow.
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room</TableHead>
                <TableHead>Phase</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Deposited</TableHead>
                <TableHead>Players</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentRooms.map((r) => (
                <TableRow key={r.roomId}>
                  <TableCell>
                    <Link
                      href={`/rooms/${r.roomId}`}
                      className="font-mono text-xs hover:underline"
                    >
                      {r.roomId}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <RoomPhaseBadge phase={r.phase} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatTimestamp(r.createdAt)}
                  </TableCell>
                  <TableCell>
                    <SolAmount sol={r.depositedSol} /> /{" "}
                    <SolAmount sol={r.capacitySol} muted />
                  </TableCell>
                  <TableCell>
                    {r.realPlayerCount}/{r.maxPlayers}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Admin Actions</CardTitle>
          <p className="text-xs text-muted-foreground">
            Last 5 entries from AdminAuditLog. Every admin tRPC call lands
            here. Full history on the Audit Log tab.
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Wallet</TableHead>
                <TableHead>Procedure</TableHead>
                <TableHead>Outcome</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.recentAudit.map((a, i) => (
                <TableRow key={`${a.adminWallet}-${a.timestamp}-${i}`}>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatTimestamp(a.timestamp as unknown as Date)}
                  </TableCell>
                  <TableCell>
                    <AddressLink address={a.adminWallet} />
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {a.procedure}
                  </TableCell>
                  <TableCell>
                    {a.outcome === "ok" ? (
                      <Badge variant="success">ok</Badge>
                    ) : (
                      <Badge variant="destructive">error</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
