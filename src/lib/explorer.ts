const cluster = process.env.NEXT_PUBLIC_SOLANA_CLUSTER ?? "devnet";

function suffix(): string {
  if (cluster === "mainnet" || cluster === "mainnet-beta") return "";
  return `?cluster=${cluster}`;
}

export function txUrl(sig: string): string {
  return `https://solscan.io/tx/${sig}${suffix()}`;
}

export function addressUrl(addr: string): string {
  return `https://solscan.io/account/${addr}${suffix()}`;
}

export function getCluster(): string {
  return cluster;
}
