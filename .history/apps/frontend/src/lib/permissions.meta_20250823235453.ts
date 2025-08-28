// apps/frontend/src/lib/permissions.meta.ts
import type { PermissionKey } from "@/lib/acl";

export type PermissionMeta = {
  label: string;
  group: string;
  description?: string;
};

// ✅ Canonical display order (extended to include Settings & Reference)
export const PERMISSION_GROUPS_IN_ORDER: string[] = [
  "Dashboard",
  "Customers",
  "Bookings",
  "Hotels",
  "Inventory",
  "Suppliers",
  "Bars",
  "POS",
  "Invoices",
  "Reports",
  "Reference",
  "Settings",
];

export const PERMISSIONS_META: Record<PermissionKey, PermissionMeta> = {
  "dashboard.view": {
    label: "View Dashboard",
    group: "Dashboard",
    description: "See the main KPIs and overview widgets.",
  },

  "customers.read": {
    label: "Customers — Read",
    group: "Customers",
    description: "View customer profiles and basic details.",
  },
  "customers.write": {
    label: "Customers — Manage",
    group: "Customers",
    description: "Create, edit, or delete customers.",
  },

  "bookings.read": {
    label: "Bookings — Read",
    group: "Bookings",
    description: "View bookings and availability.",
  },
  "bookings.manage": {
    label: "Bookings — Manage",
    group: "Bookings",
    description: "Create, modify, or cancel bookings.",
  },

  "hotels.read": {
    label: "Hotels — Read",
    group: "Hotels",
    description: "View rooms, housekeeping, and hotel data.",
  },
  "hotels.manage": {
    label: "Hotels — Manage",
    group: "Hotels",
    description: "Edit rooms, rates, and housekeeping settings.",
  },

  "inventory.read": {
    label: "Inventory — Read",
    group: "Inventory",
    description: "View stock items and quantities.",
  },
  "inventory.manage": {
    label: "Inventory — Manage",
    group: "Inventory",
    description: "Add, edit, or adjust stock and items.",
  },

  "suppliers.read": {
    label: "Suppliers — Read",
    group: "Suppliers",
    description: "View suppliers list and details.",
  },
  "suppliers.manage": {
    label: "Suppliers — Manage",
    group: "Suppliers",
    description: "Add or edit suppliers and contracts.",
  },

  "bars.read": {
    label: "Bars — Read",
    group: "Bars",
    description: "View bar menus and sales data.",
  },
  "bars.manage": {
    label: "Bars — Manage",
    group: "Bars",
    description: "Create or update bar items and pricing.",
  },

  "pos.use": {
    label: "Use POS",
    group: "POS",
    description: "Access the point-of-sale to create bills.",
  },

  "invoices.read": {
    label: "Invoices — Read",
    group: "Invoices",
    description: "View invoices and billing history.",
  },
  "invoices.manage": {
    label: "Invoices — Manage",
    group: "Invoices",
    description: "Create, edit, or void invoices.",
  },

  "reports.view": {
    label: "Reports — View",
    group: "Reports",
    description: "Access standard reports and analytics.",
  },
  "reports.manage": {
    label: "Reports — Manage",
    group: "Reports",
    description: "Create custom reports and export data.",
  },

  // ✅ Added per checkpoint
  "reference.manage": {
    label: "Reference Data — Manage",
    group: "Reference",
    description: "Maintain reference/master data and metadata versions.",
  },
  "settings.access.manage": {
    label: "Access Control — Manage",
    group: "Settings",
    description: "Manage roles, permissions, and overrides.",
  },
};
