import { useMemo } from "react";
import { useDashboardSummary } from "./useDashboardSummary";

export type QuickLink = {
  href: string;
  label: string;
  badge?: number;
};

export function useQuickLinks() {
  const { data, loading } = useDashboardSummary();

  const links = useMemo<QuickLink[]>(() => {
    return [
      { href: "/bookings/create", label: "New Booking" },
      { href: "/pos/create?mode=table", label: "New POS (Table)" },
      { href: "/pos/create?mode=room", label: "New POS (Room)" },
      { href: "/invoices/create", label: "Create Invoice" },
      { href: "/bookings?due=today&type=checkin", label: "Check-ins due", badge: data?.ops.checkinsDue ?? 0 },
      { href: "/bookings?due=today&type=checkout", label: "Check-outs due", badge: data?.ops.checkoutsDue ?? 0 },
      { href: "/bar?tab=open-bills", label: "Open POS bills", badge: 0 }, // wire later
    ];
  }, [data?.ops.checkinsDue, data?.ops.checkoutsDue]);

  return { links, loading };
}
