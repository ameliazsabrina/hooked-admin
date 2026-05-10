"use client";

import { ArrowDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TxLink, AddressLink } from "@/components/tx-link";
import { SolAmount } from "@/components/sol-amount";
import { cn } from "@/lib/utils";

type Lp = {
  status?: string | null;
  positionPubkey?: string | null;
  deployedLamports?: number | null;
  deployedAt?: Date | string | null;
  deployTxSignature?: string | null;
  exitedLamports?: number | null;
  exitedAt?: Date | string | null;
  feesLamports?: number | null;
  swapSlippageLamports?: number | null;
  realizedYieldLamports?: number | null;
  bufferTopUpLamports?: number | null;
  lastError?: string | null;
  withdrawTxSignature?: string | null;
  swapInTxSignature?: string | null;
  swapInSolLamports?: number | null;
  swapInUsdcRaw?: string | null;
  addLiquidityTxSignature?: string | null;
  removeLiquidityTxSignature?: string | null;
  removeLiquidityUsdcRaw?: string | null;
  removeLiquiditySolLamports?: number | null;
  swapOutTxSignature?: string | null;
  swapOutUsdcRaw?: string | null;
  swapOutSolLamports?: number | null;
  depositYieldTxSignature?: string | null;
};

type Player = {
  walletAddress: string;
  deposit: number;
  depositTxSignature: string;
  returned: boolean;
  returnTxSignature: string | null;
};

function Step({
  num,
  title,
  state,
  children,
}: {
  num: number;
  title: string;
  state: "done" | "pending" | "failed" | "neutral";
  children?: React.ReactNode;
}) {
  return (
    <Card
      className={cn(
        state === "pending" && "border-dashed opacity-70",
        state === "failed" && "border-destructive",
      )}
    >
      <CardContent className="flex gap-4 pt-6">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-mono">
          {num}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">{title}</h3>
            {state === "done" && <Badge variant="success">done</Badge>}
            {state === "pending" && <Badge variant="secondary">pending</Badge>}
            {state === "failed" && (
              <Badge variant="destructive">failed</Badge>
            )}
          </div>
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

function Arrow() {
  return (
    <div className="flex justify-center">
      <ArrowDown className="h-5 w-5 text-muted-foreground" />
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-mono text-xs">{value}</span>
    </div>
  );
}

export function SolFlowDiagram({
  players,
  winners,
  lp,
  closeTxSignature,
  finalizeTxSignature,
  createTxSignature,
}: {
  players: Player[];
  winners: { rank: number; walletAddress: string; prizeSol: number }[];
  lp: Lp | null;
  closeTxSignature: string | null;
  finalizeTxSignature: string | null;
  createTxSignature: string | null;
}) {
  const totalDepositedSol = players.reduce((s, p) => s + p.deposit, 0);
  const lpStatus = lp?.status ?? "pending";
  const lpFailed = lpStatus === "failed";
  const lpStarted =
    !!lp?.withdrawTxSignature || !!lp?.deployTxSignature || !!lp?.deployedAt;
  const lpExited = lpStatus === "exited" || !!lp?.exitedAt;
  const playersReturned = players.filter((p) => p.returned).length;

  return (
    <div className="space-y-3">
      {/* 0. Room created */}
      <Step
        num={0}
        title="Room created"
        state={createTxSignature ? "done" : "neutral"}
      >
        <Field
          label="create_room tx"
          value={<TxLink signature={createTxSignature} />}
        />
      </Step>
      <Arrow />

      {/* 1. Deposits */}
      <Step
        num={1}
        title="Deposits → Vault"
        state={players.length > 0 ? "done" : "pending"}
      >
        <Field
          label="Players"
          value={`${players.length} deposit(s)`}
        />
        <Field
          label="Total"
          value={<SolAmount sol={totalDepositedSol} muted={false} />}
        />
      </Step>
      <Arrow />

      {/* 2. withdraw_to_lp_manager */}
      <Step
        num={2}
        title="withdraw_to_lp_manager"
        state={
          lpFailed && !lp?.withdrawTxSignature
            ? "failed"
            : lp?.withdrawTxSignature
              ? "done"
              : "pending"
        }
      >
        <Field
          label="tx"
          value={<TxLink signature={lp?.withdrawTxSignature ?? null} />}
        />
        <Field
          label="amount"
          value={<SolAmount lamports={lp?.deployedLamports} />}
        />
      </Step>
      <Arrow />

      {/* 3. SOL → USDC */}
      <Step
        num={3}
        title="Swap SOL → USDC"
        state={lp?.swapInTxSignature ? "done" : lpFailed ? "failed" : "pending"}
      >
        <Field
          label="tx"
          value={<TxLink signature={lp?.swapInTxSignature ?? null} />}
        />
        <Field
          label="SOL in"
          value={<SolAmount lamports={lp?.swapInSolLamports} />}
        />
        <Field
          label="USDC out (raw)"
          value={lp?.swapInUsdcRaw ?? "—"}
        />
      </Step>
      <Arrow />

      {/* 4. Add liquidity */}
      <Step
        num={4}
        title="DLMM add_liquidity"
        state={
          lp?.addLiquidityTxSignature
            ? "done"
            : lpFailed
              ? "failed"
              : "pending"
        }
      >
        <Field
          label="tx"
          value={<TxLink signature={lp?.addLiquidityTxSignature ?? null} />}
        />
        <Field
          label="position"
          value={<AddressLink address={lp?.positionPubkey ?? null} />}
        />
        <Field
          label="deployed"
          value={<SolAmount lamports={lp?.deployedLamports} />}
        />
      </Step>
      <Arrow />

      {/* 5. accruing fees */}
      <Step
        num={5}
        title="Position accruing fees"
        state={lpExited ? "done" : lpStarted ? "neutral" : "pending"}
      >
        <Field
          label="fees so far"
          value={<SolAmount lamports={lp?.feesLamports} />}
        />
      </Step>
      <Arrow />

      {/* 6. remove liquidity */}
      <Step
        num={6}
        title="DLMM remove_liquidity"
        state={
          lp?.removeLiquidityTxSignature
            ? "done"
            : lpFailed
              ? "failed"
              : "pending"
        }
      >
        <Field
          label="tx"
          value={<TxLink signature={lp?.removeLiquidityTxSignature ?? null} />}
        />
        <Field
          label="SOL leg"
          value={<SolAmount lamports={lp?.removeLiquiditySolLamports} />}
        />
        <Field
          label="USDC leg (raw)"
          value={lp?.removeLiquidityUsdcRaw ?? "—"}
        />
      </Step>
      <Arrow />

      {/* 7. swap USDC -> SOL */}
      <Step
        num={7}
        title="Swap USDC → SOL"
        state={
          lp?.swapOutTxSignature
            ? "done"
            : lpExited
              ? "neutral"
              : lpFailed
                ? "failed"
                : "pending"
        }
      >
        <Field
          label="tx"
          value={<TxLink signature={lp?.swapOutTxSignature ?? null} />}
        />
        <Field
          label="USDC in (raw)"
          value={lp?.swapOutUsdcRaw ?? "—"}
        />
        <Field
          label="SOL out"
          value={<SolAmount lamports={lp?.swapOutSolLamports} />}
        />
      </Step>
      <Arrow />

      {/* 8. deposit yield → vault */}
      <Step
        num={8}
        title="(principal + yield) → Vault"
        state={
          lp?.depositYieldTxSignature
            ? "done"
            : lpFailed
              ? "failed"
              : "pending"
        }
      >
        <Field
          label="tx"
          value={<TxLink signature={lp?.depositYieldTxSignature ?? null} />}
        />
        <Field
          label="exited"
          value={<SolAmount lamports={lp?.exitedLamports} />}
        />
        <Field
          label="realized yield"
          value={<SolAmount lamports={lp?.realizedYieldLamports} />}
        />
        <Field
          label="buffer top-up"
          value={<SolAmount lamports={lp?.bufferTopUpLamports} />}
        />
        <Field
          label="slippage paid"
          value={<SolAmount lamports={lp?.swapSlippageLamports} />}
        />
      </Step>
      {lp?.lastError && (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 font-mono text-xs text-destructive">
          {lp.lastError}
        </p>
      )}
      <Arrow />

      {/* 9. close_room */}
      <Step
        num={9}
        title="close_room (extract 30% protocol share)"
        state={closeTxSignature ? "done" : "pending"}
      >
        <Field
          label="tx"
          value={<TxLink signature={closeTxSignature} />}
        />
      </Step>
      <Arrow />

      {/* 10. return_principal */}
      <Step
        num={10}
        title={`return_principal × ${players.length}`}
        state={
          playersReturned === players.length && players.length > 0
            ? "done"
            : playersReturned > 0
              ? "neutral"
              : "pending"
        }
      >
        <Field
          label="returned / total"
          value={`${playersReturned} / ${players.length}`}
        />
        <Field
          label="winners"
          value={`${winners.length} configured`}
        />
      </Step>
      <Arrow />

      {/* 11. finalize_room */}
      <Step
        num={11}
        title="finalize_room (vault closed)"
        state={finalizeTxSignature ? "done" : "pending"}
      >
        <Field
          label="tx"
          value={<TxLink signature={finalizeTxSignature} />}
        />
      </Step>
    </div>
  );
}
