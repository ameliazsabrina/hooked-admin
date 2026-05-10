"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EventStatusBadge, type EventStatus } from "@/components/event-status-badge";
import { SolAmount } from "@/components/sol-amount";
import { formatTimestamp, truncatePubkey } from "@/lib/format";

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id ?? "";
  const utils = trpc.useUtils();

  const eventQ = trpc.admin.event.get.useQuery({ id }, { enabled: !!id });
  const apexCatalogQ = trpc.admin.event.apexCatalog.useQuery();

  const activate = trpc.admin.event.activate.useMutation({
    onSuccess: () => utils.admin.event.get.invalidate({ id }),
  });
  const deactivate = trpc.admin.event.deactivate.useMutation({
    onSuccess: () => utils.admin.event.get.invalidate({ id }),
  });
  const computeWinners = trpc.admin.event.computeWinners.useMutation({
    onSuccess: () => utils.admin.event.get.invalidate({ id }),
  });
  const payAll = trpc.admin.event.payAllWinners.useMutation({
    onSuccess: () => utils.admin.event.get.invalidate({ id }),
  });
  const payOne = trpc.admin.event.payWinner.useMutation({
    onSuccess: () => utils.admin.event.get.invalidate({ id }),
  });
  const deleteEvent = trpc.admin.event.delete.useMutation({
    onSuccess: () => router.push("/events"),
  });

  const [actionError, setActionError] = useState<string | null>(null);

  if (eventQ.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (eventQ.error) {
    return <p className="text-sm text-destructive">{eventQ.error.message}</p>;
  }
  if (!eventQ.data) return null;
  const event = eventQ.data;
  const status = event.status as EventStatus;
  const now = Date.now();
  const endsAt = new Date(event.endsAt).getTime();
  const hasEnded = now >= endsAt;

  const apexFishById = new Map(
    (apexCatalogQ.data ?? []).map((f) => [f.id, f]),
  );

  async function runAction(fn: () => Promise<unknown>) {
    setActionError(null);
    try {
      await fn();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{event.name}</h1>
            <EventStatusBadge status={status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Created by{" "}
            <span className="font-mono">{truncatePubkey(event.createdBy)}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/events">
            <Button variant="outline">Back</Button>
          </Link>
          {status === "scheduled" && (
            <Button
              onClick={() => runAction(() => activate.mutateAsync({ id }))}
              disabled={activate.isPending}
            >
              {activate.isPending ? "Activating…" : "Activate now"}
            </Button>
          )}
          {status === "active" && (
            <Button
              variant="destructive"
              onClick={() => runAction(() => deactivate.mutateAsync({ id }))}
              disabled={deactivate.isPending}
            >
              {deactivate.isPending ? "Deactivating…" : "Deactivate"}
            </Button>
          )}
          {status !== "active" && (event.finalRanks?.length ?? 0) === 0 && (
            <Button
              variant="outline"
              onClick={() =>
                runAction(async () => {
                  if (!confirm(`Delete event "${event.name}"? This cannot be undone.`)) return;
                  await deleteEvent.mutateAsync({ id });
                })
              }
              disabled={deleteEvent.isPending}
            >
              Delete
            </Button>
          )}
        </div>
      </div>

      {actionError && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{actionError}</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="apex">Apex fish ({event.apexFishIds.length})</TabsTrigger>
          <TabsTrigger value="winners">
            Winners
            {event.finalRanks ? ` (${event.finalRanks.length})` : ""}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Status">
                  <EventStatusBadge status={status} />
                </Field>
                <Field label="Active flag">
                  <Badge variant={event.active ? "success" : "secondary"}>
                    {String(event.active)}
                  </Badge>
                </Field>
                <Field label="Starts at">
                  <span className="font-mono text-sm">{formatTimestamp(event.startsAt)}</span>
                </Field>
                <Field label="Ends at">
                  <span className="font-mono text-sm">{formatTimestamp(event.endsAt)}</span>
                </Field>
                <Field label="Apex BP">
                  <span className="font-mono">{event.apexBp}</span>
                  <span className="text-xs text-muted-foreground"> / 10,000</span>
                </Field>
                <Field label="Prize pool">
                  <SolAmount sol={event.prizePoolSol} />
                </Field>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="apex" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active apex fish</CardTitle>
              <p className="text-xs text-muted-foreground">
                These are the only apex species the cast roll will return when
                the event is live.
              </p>
            </CardHeader>
            <CardContent>
              {apexCatalogQ.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading catalog…</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {event.apexFishIds.map((fishId) => {
                    const fish = apexFishById.get(fishId);
                    return (
                      <div
                        key={fishId}
                        className="flex items-center gap-3 rounded-lg border p-3"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={fish?.assetUrl ?? ""}
                          alt={fish?.name ?? fishId}
                          className="h-12 w-12 rounded-md bg-muted object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.visibility =
                              "hidden";
                          }}
                        />
                        <div className="flex-1">
                          <div className="font-medium">
                            {fish?.name ?? `fish ${fishId.slice(-6)}`}
                          </div>
                          {fish && (
                            <div className="text-xs text-muted-foreground">
                              {fish.weightMin}–{fish.weightMax} kg
                            </div>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground truncate max-w-[8ch]">
                          {fishId.slice(-6)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="winners" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Winners &amp; payout</CardTitle>
            </CardHeader>
            <CardContent>
              {!hasEnded && (
                <p className="text-sm text-muted-foreground">
                  Winners are computed after the event ends. Current end:{" "}
                  <span className="font-mono">{formatTimestamp(event.endsAt)}</span>.
                </p>
              )}

              {hasEnded && event.finalRanks === null && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Event has ended but winners haven&apos;t been computed yet.
                  </p>
                  <Button
                    onClick={() =>
                      runAction(() =>
                        computeWinners.mutateAsync({ id, force: false }),
                      )
                    }
                    disabled={computeWinners.isPending}
                  >
                    {computeWinners.isPending ? "Computing…" : "Compute winners"}
                  </Button>
                </div>
              )}

              {event.finalRanks !== null && event.finalRanks.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No catches were recorded during this event window. Nothing to
                  pay out.
                </p>
              )}

              {event.finalRanks && event.finalRanks.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {event.finalRanks.filter((r) => r.paid).length} of{" "}
                      {event.finalRanks.length} paid.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() =>
                          runAction(() =>
                            computeWinners.mutateAsync({ id, force: true }),
                          )
                        }
                        disabled={computeWinners.isPending}
                      >
                        Recompute
                      </Button>
                      <Button
                        onClick={() =>
                          runAction(() => payAll.mutateAsync({ id }))
                        }
                        disabled={
                          payAll.isPending ||
                          event.finalRanks.every((r) => r.paid)
                        }
                      >
                        {payAll.isPending ? "Paying…" : "Pay all"}
                      </Button>
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rank</TableHead>
                        <TableHead>Wallet</TableHead>
                        <TableHead>Display name</TableHead>
                        <TableHead className="text-right">Score</TableHead>
                        <TableHead className="text-right">Prize</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {event.finalRanks.map((r) => (
                        <TableRow key={r.rank}>
                          <TableCell className="font-mono">{r.rank}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {truncatePubkey(r.walletAddress)}
                          </TableCell>
                          <TableCell>{r.displayName}</TableCell>
                          <TableCell className="text-right font-mono">
                            {r.score.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <SolAmount sol={r.prizeSol} />
                          </TableCell>
                          <TableCell>
                            {r.paid ? (
                              <Badge variant="success">paid</Badge>
                            ) : (
                              <Badge variant="secondary">unpaid</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {!r.paid && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  runAction(() =>
                                    payOne.mutateAsync({ id, rank: r.rank }),
                                  )
                                }
                                disabled={payOne.isPending}
                              >
                                Pay
                              </Button>
                            )}
                            {r.paid && r.signature && (
                              <span className="text-xs font-mono text-muted-foreground">
                                {r.signature.slice(0, 12)}…
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs uppercase text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
