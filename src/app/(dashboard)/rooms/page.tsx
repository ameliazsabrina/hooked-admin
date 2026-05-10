"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
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
import { RoomPhaseBadge } from "@/components/room-status-badge";
import { LpStatusBadge } from "@/components/lp-status-badge";
import { SolAmount } from "@/components/sol-amount";
import { formatTimestamp } from "@/lib/format";

type Phase = "entry" | "active" | "settling" | "closed";
type PhaseFilter = Phase | "all";

const PHASE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "entry", label: "entry" },
  { value: "active", label: "active" },
  { value: "settling", label: "settling" },
  { value: "closed", label: "closed" },
] as const satisfies readonly { value: PhaseFilter; label: string }[];

export default function RoomsListPage() {
  const searchParams = useSearchParams();
  const initialPhase = (searchParams.get("phase") ?? "all") as PhaseFilter;
  const initialStuck = searchParams.get("stuckReturns") === "true";

  const [phase, setPhase] = useState<PhaseFilter>(initialPhase);
  const [stuckReturns, setStuckReturns] = useState<boolean>(initialStuck);
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 25;

  const query = trpc.admin.rooms.list.useQuery({
    phase: phase === "all" ? undefined : phase,
    stuckReturns: stuckReturns || undefined,
    search: submittedSearch || undefined,
    page,
    limit,
  });

  const totalPages = query.data
    ? Math.max(1, Math.ceil(query.data.totalCount / limit))
    : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {stuckReturns ? "Stuck Returns" : "Rooms"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {stuckReturns
            ? "Closed rooms with at least one player whose principal hasn't been returned. Investigate per-room — may be keeper failure, RPC error, or wallet rejection."
            : "Every room — past and present."}
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Phase</label>
              <FilterDropdown
                className="w-40"
                value={phase}
                options={PHASE_OPTIONS}
                onValueChange={(value) => {
                  setPhase(value);
                  setPage(1);
                }}
              />
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">
                Stuck returns only
              </span>
              <Button
                type="button"
                variant={stuckReturns ? "default" : "outline"}
                onClick={() => {
                  setStuckReturns((s) => !s);
                  setPage(1);
                }}
              >
                {stuckReturns ? "On" : "Off"}
              </Button>
            </label>
            <form
              className="flex flex-col gap-1"
              onSubmit={(e) => {
                e.preventDefault();
                setSubmittedSearch(search.trim());
                setPage(1);
              }}
            >
              <label className="text-xs text-muted-foreground">
                Search (roomId, wallet, on-chain pool)
              </label>
              <div className="flex gap-2">
                <Input
                  className="w-72"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="R-20260509-… or wallet address"
                />
                <Button type="submit" variant="outline">
                  Search
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Rooms ({query.data?.totalCount ?? 0})
          </CardTitle>
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
                  <TableHead>Room</TableHead>
                  <TableHead>Phase</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Closes</TableHead>
                  <TableHead>Deposited / Capacity</TableHead>
                  <TableHead>Players</TableHead>
                  <TableHead>LP</TableHead>
                  {stuckReturns && <TableHead>Unreturned</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.items.map((r) => (
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
                      {formatTimestamp(r.createdAt as unknown as Date)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatTimestamp(r.closesAt as unknown as Date)}
                    </TableCell>
                    <TableCell>
                      <SolAmount sol={r.depositedSol} muted={false} /> /{" "}
                      <SolAmount sol={r.capacitySol} muted />
                    </TableCell>
                    <TableCell>
                      {r.realPlayerCount}/{r.maxPlayers}
                    </TableCell>
                    <TableCell>
                      <LpStatusBadge status={r.lpStatus} />
                    </TableCell>
                    {stuckReturns && (
                      <TableCell>
                        <span className="font-mono text-xs text-destructive">
                          {r.unreturnedCount} player
                          {r.unreturnedCount === 1 ? "" : "s"}
                        </span>
                        {" / "}
                        <SolAmount sol={r.unreturnedSol} muted={false} />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {query.data.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={stuckReturns ? 8 : 7}>
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        No rooms match the current filter.
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
