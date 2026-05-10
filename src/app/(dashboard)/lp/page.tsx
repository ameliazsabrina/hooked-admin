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
import { FilterDropdown } from "@/components/filter-dropdown";
import { LpStatusBadge } from "@/components/lp-status-badge";
import { SolAmount } from "@/components/sol-amount";
import { Button } from "@/components/ui/button";
import { formatTimestamp } from "@/lib/format";

type LpStatus = "pending" | "deployed" | "exited" | "failed" | "skipped";
type LpStatusFilter = LpStatus | "all";

const LP_STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pending", label: "pending" },
  { value: "deployed", label: "deployed" },
  { value: "exited", label: "exited" },
  { value: "failed", label: "failed" },
  { value: "skipped", label: "skipped" },
] as const satisfies readonly { value: LpStatusFilter; label: string }[];

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

function isLpStatusFilter(value: string | null): value is LpStatusFilter {
  return (
    value !== null &&
    LP_STATUS_OPTIONS.some((opt) => opt.value === value)
  );
}

export default function LpListPage() {
  const searchParams = useSearchParams();
  const fromUrl = searchParams.get("status");
  const initialStatus: LpStatusFilter = isLpStatusFilter(fromUrl)
    ? fromUrl
    : "all";

  const [status, setStatus] = useState<LpStatusFilter>(initialStatus);
  const [page, setPage] = useState(1);
  const limit = 50;

  const list = trpc.admin.lp.list.useQuery({
    status: status === "all" ? undefined : status,
    page,
    limit,
  });
  const balances = trpc.admin.lp.managerBalance.useQuery();

  const totalPages = list.data
    ? Math.max(1, Math.ceil(list.data.totalCount / limit))
    : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">LP Positions</h1>
        <p className="text-sm text-muted-foreground">
          Every room&apos;s LP cycle and the wallets that fund it.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          label="Total Deployed"
          value={
            <SolAmount
              lamports={list.data?.totals.totalDeployed ?? null}
              muted={false}
            />
          }
          hint="Lifetime SOL placed into DLMM positions across all rooms"
        />
        <StatCard
          label="Realized Yield"
          value={
            <SolAmount
              lamports={list.data?.totals.totalRealizedYield ?? null}
              muted={false}
            />
          }
          hint="Net SOL earned after exiting positions (clamped to 0 on loss)"
        />
        <StatCard
          label="Slippage Cost"
          value={
            <SolAmount
              lamports={list.data?.totals.totalSlippage ?? null}
              muted={false}
            />
          }
          hint="Cumulative SOL lost to swap slippage on SOL↔USDC round-trips"
        />
        <StatCard
          label="Buffer Top-up"
          value={
            <SolAmount
              lamports={list.data?.totals.totalBufferTopUp ?? null}
              muted={false}
            />
          }
          hint="SOL the LP_MANAGER buffer paid to make players whole on net loss"
        />
        <StatCard
          label="LP Manager Balance"
          value={
            <SolAmount
              lamports={balances.data?.lpManager?.lamports ?? null}
              muted={false}
            />
          }
          hint={
            balances.data?.lpManager?.address
              ? "Live balance — funds the IL buffer and absorbs round-trip cost"
              : "LP_MANAGER_KEYPAIR not configured on the server"
          }
        />
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Status</label>
              <FilterDropdown
                className="w-40"
                value={status}
                options={LP_STATUS_OPTIONS}
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
          <CardTitle>Positions ({list.data?.totalCount ?? 0})</CardTitle>
          <p className="text-xs text-muted-foreground">
            One row per room. Deployed = SOL into DLMM. Exited = SOL back to
            vault. Yield = exited − deployed (or 0 on loss + buffer top-up).
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
                  <TableHead>Room</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Deployed</TableHead>
                  <TableHead>Exited</TableHead>
                  <TableHead>Yield</TableHead>
                  <TableHead>Fees</TableHead>
                  <TableHead>Slippage</TableHead>
                  <TableHead>Buffer Top-up</TableHead>
                  <TableHead>Closes</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.data.items.map((r) => (
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
                      <LpStatusBadge status={r.status} />
                    </TableCell>
                    <TableCell>
                      <SolAmount lamports={r.deployedLamports} />
                    </TableCell>
                    <TableCell>
                      <SolAmount lamports={r.exitedLamports} />
                    </TableCell>
                    <TableCell>
                      <SolAmount lamports={r.realizedYieldLamports} />
                    </TableCell>
                    <TableCell>
                      <SolAmount lamports={r.feesLamports} />
                    </TableCell>
                    <TableCell>
                      <SolAmount lamports={r.swapSlippageLamports} />
                    </TableCell>
                    <TableCell>
                      <SolAmount lamports={r.bufferTopUpLamports} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatTimestamp(r.closesAt as unknown as Date)}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-xs text-destructive">
                      {r.lastError}
                    </TableCell>
                  </TableRow>
                ))}
                {list.data.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10}>
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        No LP positions match this filter.
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
