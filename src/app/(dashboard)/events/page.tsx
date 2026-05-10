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
import { Button } from "@/components/ui/button";
import { FilterDropdown } from "@/components/filter-dropdown";
import { EventStatusBadge, type EventStatus } from "@/components/event-status-badge";
import { SolAmount } from "@/components/sol-amount";
import { formatTimestamp } from "@/lib/format";
import { Plus } from "lucide-react";

type StatusFilter = "all" | "active" | "scheduled" | "ended";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "scheduled", label: "Scheduled" },
  { value: "ended", label: "Ended" },
] as const satisfies readonly { value: StatusFilter; label: string }[];

export default function EventsListPage() {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const limit = 50;

  const query = trpc.admin.event.list.useQuery({
    status,
    page,
    limit,
  });

  const totalPages = query.data
    ? Math.max(1, Math.ceil(query.data.total / limit))
    : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Events</h1>
          <p className="text-sm text-muted-foreground">
            Apex events. One active at a time; the lifecycle worker auto-promotes
            the next-scheduled event when its start time arrives.
          </p>
        </div>
        <Link href="/events/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New event
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-3">
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {query.data ? `${query.data.total} event${query.data.total === 1 ? "" : "s"}` : "Events"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {query.isLoading && (
            <p className="text-sm text-muted-foreground">Loading…</p>
          )}
          {query.error && (
            <p className="text-sm text-destructive">{query.error.message}</p>
          )}
          {query.data && query.data.events.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No events yet. Click <strong>New event</strong> to schedule one.
            </p>
          )}
          {query.data && query.data.events.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Starts</TableHead>
                  <TableHead>Ends</TableHead>
                  <TableHead className="text-right">Apex BP</TableHead>
                  <TableHead className="text-right">Prize Pool</TableHead>
                  <TableHead className="text-right">Apex Fish</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.events.map((ev) => (
                  <TableRow key={ev.id} className="cursor-pointer">
                    <TableCell>
                      <Link
                        href={`/events/${ev.id}`}
                        className="text-primary underline-offset-2 hover:underline"
                      >
                        {ev.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <EventStatusBadge status={ev.status as EventStatus} />
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {formatTimestamp(ev.startsAt)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {formatTimestamp(ev.endsAt)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {ev.apexBp}
                    </TableCell>
                    <TableCell className="text-right">
                      <SolAmount sol={ev.prizePoolSol} />
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {ev.apexFishIds.length}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {query.data && totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Page {page} / {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
