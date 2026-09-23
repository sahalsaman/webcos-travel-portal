import { Badge } from "@/components/ui/badge";

type Variant = "default" | "accent" | "secondary" | "success" | "warning" | "destructive" | "outline";

const MAP: Record<string, Variant> = {
  active: "success",
  inactive: "secondary",
  // bookings
  pending: "warning",
  advanced: "accent",
  confirmed: "success",
  completed: "default",
  cancelled: "destructive",
  scheduled: "accent",
  paused: "warning",
  processed: "accent",
  sent: "accent",
  accepted: "success",
  rejected: "destructive",
  expired: "secondary",
  // payments
  created: "secondary",
  paid: "success",
  failed: "destructive",
  refunded: "outline",
  // partners
  approved: "success",
  suspended: "destructive",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={MAP[status] ?? "secondary"} className="capitalize">
      {status === "created" ? "Not paid" : status}
    </Badge>
  );
}
