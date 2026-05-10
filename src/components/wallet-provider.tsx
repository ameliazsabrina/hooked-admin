"use client";

import { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";

const cluster = (process.env.NEXT_PUBLIC_SOLANA_CLUSTER ?? "devnet") as
  | "devnet"
  | "testnet"
  | "mainnet-beta";

export function AdminWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const endpoint = useMemo(() => {
    if (cluster === "mainnet-beta") return clusterApiUrl("mainnet-beta");
    return clusterApiUrl(cluster);
  }, []);
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [],
  );
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
