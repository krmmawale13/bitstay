// apps/frontend/src/config/menu.config.ts
import type { PermissionKey } from "@/lib/acl";

export type MenuItem = {
  label: string;
  href?: string;               // buckets won't have href; children will
  icon?: string;               // lucide icon name string; Sidebar maps string -> component
  required?: PermissionKey[];  // ANY semantics: if user has ANY, item is visible
  children?: MenuItem[];       // presence of children => this is a bucket
};

/**
 * Sidebar Information Architecture (Buckets → Items)
 * Buckets themselves are not clickable. Only children have href.
 * ADMIN sees everything; non-admin items are gated by `required`.
 */
export const MENU: MenuItem[] = [
  /* =========================
   * Front Desk
   * ========================= */
  {
    label: "Front Desk",
    icon: "LayoutDashboard",
    children: [
      { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", required: ["dashboard.view"] },
      { label: "Customers", href: "/customers", icon: "Users", required: ["customers.read", "customers.write"] },
      { label: "Bookings", href: "/bookings", icon: "CalendarCheck2", required: ["bookings.read"] },
    ],
  },

  /* =========================
   * Property (Hotels & Rooms)
   * ========================= */
  {
    label: "Property (Hotels & Rooms)",
    icon: "Building2",
    children: [
      { label: "Hotels", href: "/hotels", icon: "Building2", required: ["hotels.read"] },
      // keep Rooms path aligned with your current app (earlier you used /rooms)
      { label: "Rooms", href: "/rooms", icon: "BedDouble", required: ["hotels.read"] },
      // { label: "Create Hotel", href: "/hotels/create", icon: "Building2", required: ["hotels.manage"] },
      // { label: "Create Room", href: "/rooms/create", icon: "BedDouble", required: ["hotels.manage"] },
    ],
  },

  /* =========================
   * Sales & POS
   * ========================= */
  {
    label: "Sales & POS",
    icon: "ShoppingCart",
    children: [
      { label: "Bars & POS Tables", href: "/bars", icon: "Wine", required: ["bars.read", "pos.use"] },
      { label: "F&B Masters (Menu & Liquor)", href: "/fnb/masters", icon: "UtensilsCrossed", required: ["bars.manage"] }, // or "fnb.manage" if you use that
      { label: "POS Orders & KOT", href: "/pos/orders", icon: "ReceiptText", required: ["pos.use"] },
      { label: "Sales & Invoicing", href: "/invoices", icon: "FileText", required: ["invoices.read"] },
    ],
  },

  /* =========================
   * Back Office
   * ========================= */
  {
    label: "Back Office",
    icon: "Boxes",
    children: [
      { label: "Inventory", href: "/inventory", icon: "Boxes", required: ["inventory.read"] },
      { label: "Suppliers & Purchasing", href: "/suppliers", icon: "Truck", required: ["suppliers.read"] },
    ],
  },

  /* =========================
   * Compliance & BI
   * ========================= */
  {
    label: "Compliance & BI",
    icon: "BarChart2",
    children: [
      { label: "Reports & Analytics", href: "/reports", icon: "BarChart2", required: ["reports.view"] },
      { label: "Compliance & GST", href: "/compliance/gst", icon: "FileText", required: ["compliance.gst.read"] },
      { label: "Excise Compliance", href: "/compliance/excise", icon: "ScrollText", required: ["compliance.excise.read"] },
    ],
  },

  /* =========================
   * System / Utilities
   * ========================= */
  {
    label: "System / Utilities",
    icon: "ShieldCheck",
    children: [
      { label: "Access Control (RBAC)", href: "/settings/access", icon: "ShieldCheck", required: ["settings.access.manage"] },
      { label: "Notifications & Schedules", href: "/notifications", icon: "Bell", required: ["notifications.read"] },
      { label: "Approvals & Audit", href: "/approvals", icon: "Stamp", required: ["approvals.read"] },
      { label: "File Storage & Documents", href: "/files", icon: "FolderOpen", required: ["files.read"] },
      { label: "Reference Data Admin", href: "/refdata", icon: "Database", required: ["refdata.read"] },
    ],
  },
];
