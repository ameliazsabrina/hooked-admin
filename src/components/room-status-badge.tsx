import { Badge } from "@/components/ui/badge";

export function RoomPhaseBadge({ phase }: { phase: string }) {
  switch (phase) {
    case "entry":
      return <Badge variant="secondary">entry</Badge>;
    case "active":
      return <Badge variant="success">active</Badge>;
    case "settling":
      return <Badge variant="warning">settling</Badge>;
    case "closed":
      return <Badge variant="outline">closed</Badge>;
    default:
      return <Badge variant="outline">{phase}</Badge>;
  }
}
