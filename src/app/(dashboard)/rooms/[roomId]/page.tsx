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
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RoomPhaseBadge } from "@/components/room-status-badge";
import { LpStatusBadge } from "@/components/lp-status-badge";
import { TxLink, AddressLink } from "@/components/tx-link";
import { SolAmount } from "@/components/sol-amount";
import { SolFlowDiagram } from "@/components/sol-flow-diagram";
import { Badge } from "@/components/ui/badge";
import { formatTimestamp } from "@/lib/format";
import { ChevronLeft } from "lucide-react";

function KV({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "flex justify-between gap-4 rounded-md border border-amber-400 bg-amber-50 px-3 py-2 dark:bg-amber-950/30"
          : "flex justify-between gap-4 px-3 py-2"
      }
    >
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-sm" : "text-sm"}>{value}</span>
    </div>
  );
}

export default function RoomDetailPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const query = trpc.admin.rooms.get.useQuery({ roomId });

  if (query.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (query.error) {
    return (
      <p className="text-sm text-destructive">{query.error.message}</p>
    );
  }
  const data = query.data!;
  const room = data.db;
  const lp = room.lp ?? null;
  const players = room.players ?? [];

  type OnChainRoom = {
    depositedLamports?: string | number;
    humanCount?: number;
    status?: number;
  } | null;
  const onChainRoom = data.onChain.room as OnChainRoom;
  const onChainDeposited = onChainRoom?.depositedLamports
    ? Number(onChainRoom.depositedLamports) / 1e9
    : null;
  const depositedMismatch =
    onChainDeposited !== null &&
    Math.abs(onChainDeposited - room.depositedSol) > 1e-9;
  const onChainHuman = onChainRoom?.humanCount ?? null;
  const humanMismatch =
    onChainHuman !== null && onChainHuman !== room.realPlayerCount;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/rooms"
            className="inline-flex items-center text-xs text-muted-foreground hover:underline"
          >
            <ChevronLeft className="h-3 w-3" />
            back to rooms
          </Link>
          <h1 className="mt-1 font-mono text-2xl font-semibold">
            {room.roomId}
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <RoomPhaseBadge phase={room.phase} />
            <LpStatusBadge status={lp?.status ?? null} />
            <span className="text-xs text-muted-foreground">
              created {formatTimestamp(room.createdAt as unknown as Date)}
            </span>
          </div>
        </div>
        <Card className="w-72">
          <CardContent className="grid gap-1 pt-6">
            <KV
              label="On-chain pool"
              value={<AddressLink address={room.onChainPoolAddress} />}
              mono
            />
            <KV
              label="Pool ID"
              value={room.onChainPoolId ?? "—"}
              mono
            />
            <KV
              label="Created by"
              value={<AddressLink address={room.createdByAdmin} />}
              mono
            />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="players">
            Players ({players.length})
          </TabsTrigger>
          <TabsTrigger value="solflow">SOL Flow</TabsTrigger>
          <TabsTrigger value="winners">
            Winners ({room.winners?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="raw">Raw</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lifecycle</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-1">
              <KV
                label="Phase"
                value={<RoomPhaseBadge phase={room.phase} />}
              />
              <KV
                label="Created at"
                value={formatTimestamp(room.createdAt as unknown as Date)}
              />
              <KV
                label="Entry closes at"
                value={formatTimestamp(
                  room.entryClosesAt as unknown as Date,
                )}
              />
              <KV
                label="Closes at"
                value={formatTimestamp(room.closesAt as unknown as Date)}
              />
              <KV
                label="Capacity"
                value={<SolAmount sol={room.capacitySol} />}
              />
              <KV
                label="Max players"
                value={room.maxPlayers}
              />
              <KV
                label="Overflow triggered"
                value={room.overflowTriggered ? "yes" : "no"}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Capacity & Players</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-1">
              <KV
                label="Deposited (DB)"
                value={<SolAmount sol={room.depositedSol} muted={false} />}
                highlight={depositedMismatch}
              />
              {onChainDeposited !== null && (
                <KV
                  label="Deposited (on-chain)"
                  value={<SolAmount sol={onChainDeposited} muted={false} />}
                  highlight={depositedMismatch}
                />
              )}
              <KV
                label="Players (DB)"
                value={`${room.realPlayerCount}/${room.maxPlayers}`}
                highlight={humanMismatch}
              />
              {onChainHuman !== null && (
                <KV
                  label="Players (on-chain)"
                  value={`${onChainHuman}/${room.maxPlayers}`}
                  highlight={humanMismatch}
                />
              )}
              {data.onChain.error && (
                <p className="px-3 py-2 text-xs text-destructive">
                  on-chain fetch error: {data.onChain.error}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Settlement signatures</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-1">
              <KV
                label="create_room"
                value={
                  <TxLink signature={room.createTxSignature ?? null} />
                }
                mono
              />
              <KV
                label="close_room"
                value={
                  <TxLink signature={room.closeTxSignature ?? null} />
                }
                mono
              />
              <KV
                label="finalize_room"
                value={
                  <TxLink signature={room.finalizeTxSignature ?? null} />
                }
                mono
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="players">
          <Card>
            <CardHeader>
              <CardTitle>Players</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Wallet</TableHead>
                    <TableHead>Deposit</TableHead>
                    <TableHead>Deposit tx</TableHead>
                    <TableHead>Deposited at</TableHead>
                    <TableHead>Returned</TableHead>
                    <TableHead>Return tx</TableHead>
                    <TableHead>Returned at</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {players.map((p, i) => {
                    const stuck =
                      !p.returned &&
                      new Date(room.closesAt).getTime() < Date.now() &&
                      room.phase === "closed";
                    return (
                      <TableRow
                        key={`${p.walletAddress}-${i}`}
                        className={stuck ? "bg-destructive/10" : undefined}
                      >
                        <TableCell>
                          <AddressLink address={p.walletAddress} />
                        </TableCell>
                        <TableCell>
                          <SolAmount sol={p.deposit} muted={false} />
                        </TableCell>
                        <TableCell>
                          <TxLink
                            signature={p.depositTxSignature ?? null}
                          />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatTimestamp(p.depositedAt as Date | string | null)}
                        </TableCell>
                        <TableCell>
                          {p.returned ? (
                            <Badge variant="success">yes</Badge>
                          ) : (
                            <Badge variant="secondary">no</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <TxLink
                            signature={p.returnTxSignature ?? null}
                          />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatTimestamp(p.returnedAt as Date | string | null)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {players.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <p className="py-8 text-center text-sm text-muted-foreground">
                          No deposits yet.
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="solflow">
          <SolFlowDiagram
            players={players as unknown as Parameters<
              typeof SolFlowDiagram
            >[0]["players"]}
            winners={(room.winners ?? []) as unknown as Parameters<
              typeof SolFlowDiagram
            >[0]["winners"]}
            lp={lp as unknown as Parameters<typeof SolFlowDiagram>[0]["lp"]}
            createTxSignature={room.createTxSignature ?? null}
            closeTxSignature={room.closeTxSignature ?? null}
            finalizeTxSignature={room.finalizeTxSignature ?? null}
          />
        </TabsContent>

        <TabsContent value="winners">
          <Card>
            <CardHeader>
              <CardTitle>Winners</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Wallet</TableHead>
                    <TableHead>Display name</TableHead>
                    <TableHead>Prize</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(room.winners ?? []).map((w, i) => (
                    <TableRow key={`${w.walletAddress}-${i}`}>
                      <TableCell>
                        <Badge variant="default">#{w.rank}</Badge>
                      </TableCell>
                      <TableCell>
                        <AddressLink address={w.walletAddress} />
                      </TableCell>
                      <TableCell>{w.displayName}</TableCell>
                      <TableCell>
                        <SolAmount sol={w.prizeSol} muted={false} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {(room.winners ?? []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <p className="py-8 text-center text-sm text-muted-foreground">
                          No winners recorded.
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="raw" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                Score bridges ({data.scoreBridges?.length ?? 0})
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Per-session keeper transactions writing the final
                FishingSession score to <code>update_room_entry_score</code>{" "}
                on hooked_rooms. Each row is one player session.
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Wallet</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Window</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Bridged at</TableHead>
                    <TableHead>Signature</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data.scoreBridges ?? []).map((b, i) => (
                    <TableRow
                      key={`${b.walletAddress}-${b.dateKey}-${b.window}-${i}`}
                    >
                      <TableCell>
                        <AddressLink address={b.walletAddress} />
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {b.dateKey}
                      </TableCell>
                      <TableCell className="text-xs">
                        {b.window === 0 ? "day" : "night"}
                      </TableCell>
                      <TableCell className="font-mono">
                        {b.sessionScore}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatTimestamp(
                          b.chainScoreBridgedAt as unknown as Date,
                        )}
                      </TableCell>
                      <TableCell>
                        <TxLink signature={b.chainScoreTxSignature} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {(data.scoreBridges ?? []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <p className="py-6 text-center text-sm text-muted-foreground">
                          No score-bridge txs recorded yet for this
                          room&apos;s players.
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
              <CardTitle>Tx Trail (chronological)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Kind</TableHead>
                    <TableHead>Wallet</TableHead>
                    <TableHead>Lamports</TableHead>
                    <TableHead>Signature</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.txTrail.map((row, i) => (
                    <TableRow key={`${row.kind}-${i}-${row.signature ?? ""}`}>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatTimestamp(row.at as Date | null)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.kind}</Badge>
                      </TableCell>
                      <TableCell>
                        <AddressLink address={row.wallet ?? null} />
                      </TableCell>
                      <TableCell>
                        <SolAmount lamports={row.lamports} />
                      </TableCell>
                      <TableCell>
                        <TxLink signature={row.signature} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {row.notes}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>On-chain Room account</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded-md bg-muted px-4 py-3 text-xs">
                {JSON.stringify(data.onChain.room, null, 2)}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                On-chain RoomEntry accounts ({data.onChain.entries.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded-md bg-muted px-4 py-3 text-xs">
                {JSON.stringify(data.onChain.entries, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
