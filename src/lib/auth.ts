"use client";

import bs58 from "bs58";
import { makeTrpcClient } from "./trpc";

function randomNonceHex(bytes = 16): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function performAdminLogin(opts: {
  walletAddress: string;
  signMessage: (msg: Uint8Array) => Promise<Uint8Array>;
}): Promise<{ token: string; wallet: string; expiresAt: string }> {
  const timestamp = Date.now().toString();
  const nonce = randomNonceHex();
  const msg = new TextEncoder().encode(
    `hooked-admin:admin.session.login:${timestamp}:${nonce}`,
  );
  const sigBytes = await opts.signMessage(msg);
  const signature = bs58.encode(sigBytes);

  const client = makeTrpcClient({ token: null });

  // Note: This assumes the external admin.session.login still exists
  // If this needs to be migrated too, we need more information about the external server
  const result = await client.admin.session.login.mutate({
    wallet: opts.walletAddress,
    timestamp,
    nonce,
    signature,
  });

  // Use tRPC instead of direct fetch
  await client.session.create.mutate(result);

  return result;
}

export async function readSessionFromCookie(): Promise<{
  token: string | null;
  wallet: string | null;
}> {
  try {
    const client = makeTrpcClient({ token: null });
    return await client.session.get.query();
  } catch {
    return { token: null, wallet: null };
  }
}

export async function performAdminLogout(token: string | null): Promise<void> {
  if (token) {
    try {
      const client = makeTrpcClient({ token });
      await client.admin.session.logout.mutate();
    } catch {
      // ignore — cookie deletion is the source of truth client-side
    }
  }

  try {
    const client = makeTrpcClient({ token: null });
    await client.session.delete.mutate();
  } catch {
    // ignore errors in cookie deletion
  }
}
