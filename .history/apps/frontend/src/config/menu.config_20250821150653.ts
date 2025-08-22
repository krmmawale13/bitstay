import type { PermissionKey } from "@/lib/acl";

export type MenuItem = {
  label: string;
  href: string;
  icon?: string;
  required?: PermissionKey[]; // ANY of these
  children?: MenuItem[];
};

export const MENU: MenuItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", required: ["dashboard.view"] },
  { label: "Customers", href: "/customers", icon: "Users", required: ["customers.read","customers.write"] },
  { label: "Inventory", href: "/inventory", icon: "Boxes", required: ["inventory.read","inventory.manage"] },
  { label: "Bars", href: "/bars", icon: "Beer", required: ["bars.read","bars.manage"] },
  { label: "Hotels", href: "/hotels", icon: "Hotel", required: ["hotels.read","hotels.manage"] },
  { label: "POS", href: "/pos", icon: "ShoppingCart", required: ["pos.use"] },
  { label: "Reports", href: "/reports", icon: "BarChart2", required: ["reports.view","reports.manage"] },
  { label: "Suppliers", href: "/suppliers", icon: "Truck", required: ["suppliers.read","suppliers.manage"] },
  { label: "Bookings", href: "/bookings", icon: "CalendarCheck2", required: ["bookings.read","bookings.manage"] },
  { label: "Invoices", href: "/invoices", icon: "FileInvoice", required: ["invoices.read","invoices.manage"] },
  { label: "Access Control", href: "/settings/access", icon: "ShieldCheck", required: ["reports.manage","dashboard.view"] },
];
