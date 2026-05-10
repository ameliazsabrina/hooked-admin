"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { AdminWalletProvider } from "@/components/wallet-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { performAdminLogin } from "@/lib/auth";
import { truncatePubkey } from "@/lib/format";

function LoginInner() {
  const router = useRouter();
  const { publicKey, signMessage, connected, disconnect } = useWallet();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setError(null);
  }, [publicKey]);

  const handleSignIn = async () => {
    if (!publicKey || !signMessage) {
      setError("Wallet does not support signMessage");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await performAdminLogin({
        walletAddress: publicKey.toBase58(),
        signMessage,
      });
      router.replace("/dashboard");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Login failed";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Hooked Admin</CardTitle>
          <p className="text-sm text-muted-foreground">
            Connect an admin wallet to sign in.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-stretch gap-2">
            <WalletMultiButton style={{ width: "100%" }} />
            {connected && publicKey && (
              <p className="text-center text-xs text-muted-foreground">
                Connected:{" "}
                <span className="font-mono">
                  {truncatePubkey(publicKey.toBase58(), 6)}
                </span>
              </p>
            )}
          </div>
          <Button
            className="w-full"
            disabled={!connected || submitting || !signMessage}
            onClick={handleSignIn}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
          {error && (
            <p className="text-sm text-destructive">
              {error}
              {" — "}
              <button
                className="underline"
                onClick={async () => {
                  setError(null);
                  await disconnect();
                }}
              >
                disconnect
              </button>
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Your wallet must be on the server&apos;s ADMIN_WALLETS allowlist.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function LoginScreen() {
  return (
    <AdminWalletProvider>
      <LoginInner />
    </AdminWalletProvider>
  );
}
