import type { PermissionKey } from "@/lib/acl";

export type DashboardWidget = {
  key: string;
  title: string;
  required?: PermissionKey[]; // ALL required to render this widget
};

// NOTE: For widgets, prefer ALL (critical data shouldn't show on partial perms).
export const WIDGETS: DashboardWidget[] = [
  { key: "salesSummary",      title: "Sales Summary",    required: ["dashboard.view", "reports.view"] },
  { key: "topCustomers",      title: "Top Customers",    required: ["dashboard.view", "customers.read"] },
  { key: "inventoryLowStock", title: "Low Stock",        required: ["dashboard.view", "inventory.read"] },
  { key: "bookingsToday",     title: "Today’s Bookings", required: ["dashboard.view", "bookings.read"] },
  { key: "invoicesDue",       title: "Invoices Due",     required: ["dashboard.view", "invoices.read"] },
];
