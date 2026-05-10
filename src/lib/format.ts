export function lamportsToSol(lamports: number | null | undefined): string {
  if (lamports === null || lamports === undefined) return "—";
  return (lamports / 1e9).toFixed(4) + " SOL";
}

export function solToString(sol: number | null | undefined, digits = 4): string {
  if (sol === null || sol === undefined) return "—";
  return sol.toFixed(digits) + " SOL";
}

export function truncatePubkey(pk: string | null | undefined, chars = 4): string {
  if (!pk) return "—";
  if (pk.length <= chars * 2 + 3) return pk;
  return `${pk.slice(0, chars)}…${pk.slice(-chars)}`;
}

export function formatTimestamp(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toISOString().replace("T", " ").slice(0, 19) + " UTC";
}

export function formatRelative(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = d instanceof Date ? d : new Date(d);
  const diff = date.getTime() - Date.now();
  const abs = Math.abs(diff);
  const sign = diff < 0 ? "ago" : "from now";
  const sec = Math.floor(abs / 1000);
  if (sec < 60) return `${sec}s ${sign}`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ${sign}`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ${sign}`;
  const day = Math.floor(hr / 24);
  return `${day}d ${sign}`;
}
