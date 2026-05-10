import { Badge } from "@/components/ui/badge";

export type EventStatus = "scheduled" | "active" | "ended";

/**
 * Lifecycle badge for FishingEvent docs. Mirrors RoomPhaseBadge.
 *  - scheduled: startsAt > now and not yet active
 *  - active:    `active: true` flag set; cast roll is honoring this event
 *  - ended:     endsAt has passed; awaiting (or showing) winners + payout
 */
export function EventStatusBadge({ status }: { status: EventStatus }) {
  switch (status) {
    case "scheduled":
      return <Badge variant="secondary">scheduled</Badge>;
    case "active":
      return <Badge variant="success">active</Badge>;
    case "ended":
      return <Badge variant="outline">ended</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
