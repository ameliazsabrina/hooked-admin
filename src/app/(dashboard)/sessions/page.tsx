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
import { AddressLink, TxLink } from "@/components/tx-link";
import { formatTimestamp, truncatePubkey } from "@/lib/format";

type Status = "active" | "committed" | "abandoned";
type StatusFilter = Status | "all";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "active", label: "active" },
  { value: "committed", label: "committed" },
  { value: "abandoned", label: "abandoned" },
] as const satisfies readonly { value: StatusFilter; label: string }[];

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "active":
      return <Badge variant="success">active</Badge>;
    case "committed":
      return <Badge variant="default">committed</Badge>;
    case "abandoned":
      return <Badge variant="destructive">abandoned</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function SessionsPage() {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [wallet, setWallet] = useState("");
  const [submittedWallet, setSubmittedWallet] = useState<string | undefined>(
    undefined,
  );
  const [page, setPage] = useState(1);
  const limit = 50;

  const query = trpc.admin.sessions.list.useQuery({
    status: status === "all" ? undefined : status,
    wallet: submittedWallet,
    page,
    limit,
  });

  const totalPages = query.data
    ? Math.max(1, Math.ceil(query.data.totalCount / limit))
    : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Fishing Sessions</h1>
        <p className="text-sm text-muted-foreground">
          One row per (player, day, window). Replaces the on-chain
          FishingSession PDA — every session lives in MongoDB after the Phase
          6 cutover.
        </p>
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
              <label className="text-xs text-muted-foreground">Status</label>
              <FilterDropdown
                className="w-40"
                value={status}
                options={STATUS_OPTIONS}
                onValueChange={(value) => {
                  setStatus(value);
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
          <CardTitle>Sessions ({query.data?.totalCount ?? 0})</CardTitle>
          <p className="text-xs text-muted-foreground">
            Score / cast / catch counts are server-authoritative.{" "}
            <span className="font-mono">chainScoreTxSignature</span> is the
            keeper-bridged on-chain memo recording the final score on
            hooked_rooms.
          </p>
        </CardHeader>
        <CardContent>
          {query.isLoading && (
            <p className="text-sm text-muted-foreground">Loading…</p>
          )}
          {query.error && (
            <p className="text-sm text-destructive">{query.error.message}</p>
          )}
          {query.data && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Wallet</TableHead>
                  <TableHead>Day</TableHead>
                  <TableHead>Win</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Bait</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Casts</TableHead>
                  <TableHead>Catches</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Bridge tx</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.items.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Link
                        href={`/sessions/${s.id}`}
                        className="font-mono text-xs hover:underline"
                      >
                        {truncatePubkey(s.walletAddress, 6)}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs">{s.dailySeedDate}</TableCell>
                    <TableCell className="text-xs">
                      {s.window === 0 ? "day" : "night"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={s.status} />
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs">
                        {s.baitRemaining}/{s.baitInitial}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono">
                      {s.sessionScore}
                    </TableCell>
                    <TableCell>{s.castCount}</TableCell>
                    <TableCell>{s.catchCount}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatTimestamp(s.startedAt as unknown as Date)}
                    </TableCell>
                    <TableCell>
                      <TxLink signature={s.chainScoreTxSignature} />
                    </TableCell>
                  </TableRow>
                ))}
                {query.data.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10}>
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        No sessions match this filter.
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

// AddressLink is exported by tx-link but not used here; importing from there
// keeps the Solscan format consistent if we add a wallet-link column later.
void AddressLink;
