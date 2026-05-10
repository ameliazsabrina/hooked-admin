import { Badge } from "@/components/ui/badge";

export function LpStatusBadge({ status }: { status: string | null }) {
  if (!status) return <Badge variant="outline">—</Badge>;
  switch (status) {
    case "pending":
      return <Badge variant="secondary">pending</Badge>;
    case "deployed":
      return <Badge variant="success">deployed</Badge>;
    case "exited":
      return <Badge variant="default">exited</Badge>;
    case "failed":
      return <Badge variant="destructive">failed</Badge>;
    case "skipped":
      return <Badge variant="outline">skipped</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
