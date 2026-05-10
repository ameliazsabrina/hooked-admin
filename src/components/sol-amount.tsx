import { lamportsToSol, solToString } from "@/lib/format";
import { cn } from "@/lib/utils";

export function SolAmount({
  lamports,
  sol,
  digits = 4,
  className,
  muted = true,
}: {
  lamports?: number | null;
  sol?: number | null;
  digits?: number;
  className?: string;
  muted?: boolean;
}) {
  const text =
    lamports !== undefined
      ? lamportsToSol(lamports)
      : solToString(sol ?? null, digits);
  const isEmpty = text === "—";
  return (
    <span
      className={cn(
        "font-mono",
        isEmpty && muted ? "text-muted-foreground" : undefined,
        className,
      )}
    >
      {text}
    </span>
  );
}
