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
import { FilterDropdown } from "@/components/filter-dropdown";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddressLink } from "@/components/tx-link";
import { formatTimestamp } from "@/lib/format";

type OutcomeFilter = "all" | "ok" | "error";

const OUTCOME_OPTIONS = [
  { value: "all", label: "All" },
  { value: "ok", label: "ok" },
  { value: "error", label: "error" },
] as const satisfies readonly { value: OutcomeFilter; label: string }[];

export default function AuditPage() {
  const [outcome, setOutcome] = useState<OutcomeFilter>("all");
  const [wallet, setWallet] = useState("");
  const [submittedWallet, setSubmittedWallet] = useState<string | undefined>(
    undefined,
  );
  const [procedure, setProcedure] = useState("");
  const [submittedProcedure, setSubmittedProcedure] = useState<
    string | undefined
  >(undefined);
  const [page, setPage] = useState(1);
  const limit = 50;

  const query = trpc.admin.audit.list.useQuery({
    adminWallet: submittedWallet,
    outcome: outcome === "all" ? undefined : outcome,
    procedure: submittedProcedure,
    page,
    limit,
  });

  const totalPages = query.data
    ? Math.max(1, Math.ceil(query.data.totalCount / limit))
    : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Audit Log</h1>
        <p className="text-sm text-muted-foreground">
          Every admin tRPC call. Auto-expires after 90 days.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              setSubmittedWallet(wallet.trim() || undefined);
              setSubmittedProcedure(procedure.trim() || undefined);
              setPage(1);
            }}
          >
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Outcome</label>
              <FilterDropdown
                className="w-32"
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
                placeholder="admin wallet pubkey"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">
                Procedure (substring match)
              </label>
              <Input
                className="w-60"
                value={procedure}
                onChange={(e) => setProcedure(e.target.value)}
                placeholder="rooms.get"
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
          <CardTitle>Entries ({query.data?.totalCount ?? 0})</CardTitle>
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
                  <TableHead>When</TableHead>
                  <TableHead>Wallet</TableHead>
                  <TableHead>Procedure</TableHead>
                  <TableHead>Outcome</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Input hash</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.items.map((a, i) => (
                  <TableRow
                    key={`${a.adminWallet}-${a.timestamp}-${i}`}
                  >
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
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
                    <TableCell className="max-w-xs truncate text-xs text-destructive">
                      {a.errorMessage}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {a.ipAddress ?? "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {(a.inputHash ?? "").slice(0, 10)}…
                    </TableCell>
                  </TableRow>
                ))}
                {query.data.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        No audit entries match this filter.
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
