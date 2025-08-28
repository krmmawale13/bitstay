import type { PermissionKey } from "@/lib/acl";

export type MenuItem = {
  label: string;
  href: string;
  icon?: string;              // map this string → lucide icon in Sidebar
  required?: PermissionKey[]; // ANY of these grants visibility
  children?: MenuItem[];
};

/**
 * Master menu (grouped). Parent can filter by RBAC + feature flags,
 * Sidebar is presentational and just renders this structure.
 */
export const MENU: MenuItem[] = [
  // FRONT DESK
  {
    label: "Front Desk",
    href: "#",
    icon: "Building2",
    children: [
      { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", required: ["dashboard.view"] },
      { label: "Bookings", href: "/bookings", icon: "Calendar", required: ["bookings.read"] },
      { label: "Customers", href: "/customers", icon: "Users", required: ["customers.read", "customers.write"] },
      // Phase-1: Property (Hotels & Rooms)
      { label: "Property", href: "/rooms", icon: "BedDouble", required: ["hotels.read"] },
    ],
  },

  // SALES & POS
  {
    label: "Sales & POS",
    href: "#",
    icon: "Store",
    children: [
      { label: "POS Tables", href: "/pos/tables", icon: "ListChecks", required: ["bars.read"] },
      { label: "F&B Masters", href: "/pos/masters", icon: "Wine", required: ["bars.manage", "pos.use"] },
      { label: "POS Orders & KOT", href: "/pos/orders", icon: "Wine", required: ["pos.use"] },
      { label: "Sales & Invoicing", href: "/invoices", icon: "FileText", required: ["invoices.read"] },
    ],
  },

  // BACK OFFICE
  {
    label: "Back Office",
    href: "#",
    icon: "Boxes",
    children: [
      { label: "Inventory", href: "/inventory", icon: "Boxes", required: ["inventory.read"] },
      { label: "Suppliers & Purchasing", href: "/suppliers", icon: "Truck", required: ["suppliers.read"] },
    ],
  },

  // COMPLIANCE & BI
  {
    label: "Compliance & BI",
    href: "#",
    icon: "BarChart2",
    children: [
      { label: "Reports & Analytics", href: "/reports", icon: "BarChart2", required: ["reports.view"] },
      { label: "Compliance & GST", href: "/compliance/gst", icon: "ShieldCheck", required: ["reports.manage", "invoices.manage"] },
      { label: "Excise", href: "/compliance/excise", icon: "ShieldCheck", required: ["inventory.manage", "reports.manage"] },
    ],
  },

  // SYSTEM
  {
    label: "System",
    href: "#",
    icon: "Settings",
    children: [
      { label: "Notifications & Schedules", href: "/settings/notifications", icon: "Bell", required: ["dashboard.view"] },
      { label: "Approvals & Audit", href: "/settings/approvals", icon: "Workflow", required: ["dashboard.view"] },
      { label: "File Storage", href: "/files", icon: "Folder", required: ["dashboard.view"] },
      { label: "Reference Data", href: "/settings/reference", icon: "FileText", required: ["reference.manage"] },
      { label: "Access Control", href: "/settings/access", icon: "Settings", required: ["settings.access.manage"] },
    ],
  },
];
