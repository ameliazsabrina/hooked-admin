"use client";

import { ExternalLink, Copy } from "lucide-react";
import { txUrl, addressUrl } from "@/lib/explorer";
import { truncatePubkey } from "@/lib/format";
import { cn } from "@/lib/utils";

export function TxLink({
  signature,
  className,
}: {
  signature: string | null | undefined;
  className?: string;
}) {
  if (!signature) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <a
        href={txUrl(signature)}
        target="_blank"
        rel="noreferrer"
        className="font-mono text-xs hover:underline inline-flex items-center gap-1"
      >
        {truncatePubkey(signature, 6)}
        <ExternalLink className="h-3 w-3" />
      </a>
      <button
        type="button"
        onClick={() => navigator.clipboard.writeText(signature)}
        className="text-muted-foreground hover:text-foreground"
        aria-label="copy"
      >
        <Copy className="h-3 w-3" />
      </button>
    </span>
  );
}

export function AddressLink({
  address,
  className,
}: {
  address: string | null | undefined;
  className?: string;
}) {
  if (!address) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <a
        href={addressUrl(address)}
        target="_blank"
        rel="noreferrer"
        className="font-mono text-xs hover:underline inline-flex items-center gap-1"
      >
        {truncatePubkey(address, 6)}
        <ExternalLink className="h-3 w-3" />
      </a>
      <button
        type="button"
        onClick={() => navigator.clipboard.writeText(address)}
        className="text-muted-foreground hover:text-foreground"
        aria-label="copy"
      >
        <Copy className="h-3 w-3" />
      </button>
    </span>
  );
}
