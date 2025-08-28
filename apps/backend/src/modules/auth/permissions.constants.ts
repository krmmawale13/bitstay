// apps/backend/src/modules/auth/permissions.constants.ts
import { RoleEnum } from "@prisma/client";

/**
 * Canonical permission registry
 * NOTE: Keep this list in sync with:
 * - FE: apps/frontend/src/lib/permissions.meta.ts
 * - FE: apps/frontend/src/config/menu.config.ts
 */
export const PERMISSIONS = [
  // ------ Front Desk ------
  "dashboard.view",

  "customers.read",
  "customers.write",

  "bookings.read",
  "bookings.manage",

  // ------ Property (Hotels & Rooms) ------
  "hotels.read",
  "hotels.manage",

  // ------ Sales & POS ------
  "bars.read",
  "bars.manage",
  "pos.use",

  "invoices.read",
  "invoices.manage",

  // ------ Back Office ------
  "inventory.read",
  "inventory.manage",

  "suppliers.read",
  "suppliers.manage",

  // ------ Compliance & BI ------
  "reports.view",
  "reports.manage",
  "compliance.gst.read",     // NEW
  "compliance.excise.read",  // NEW

  // ------ System / Utilities ------
  "settings.access.manage",  // tighten access (admin-only by default)
  "notifications.read",      // NEW
  "approvals.read",          // NEW
  "files.read",              // NEW
  "refdata.read",            // NEW
] as const;

export type PermissionKey = typeof PERMISSIONS[number];

/**
 * Role → default permissions
 * These are sane defaults. Per-user overrides (tenant-scoped) are applied on top.
 */
export const ROLE_PERMISSIONS: Record<RoleEnum, PermissionKey[]> = {
  ADMIN: [...PERMISSIONS],

  MANAGER: [
    "dashboard.view",

    "customers.read", "customers.write",

    "bookings.read", "bookings.manage",

    "hotels.read", "hotels.manage",

    "bars.read", "bars.manage",
    "pos.use",

    "invoices.read", "invoices.manage",

    "inventory.read", "inventory.manage",
    "suppliers.read", "suppliers.manage",

    "reports.view", "reports.manage",
    "compliance.gst.read",
    "compliance.excise.read",

    // Utilities (view-level)
    "notifications.read",
    "approvals.read",
    "files.read",
    "refdata.read",
    // NOTE: manager does NOT get "settings.access.manage"
  ],

  RECEPTIONIST: [
    "dashboard.view",

    "customers.read", "customers.write",

    "bookings.read", "bookings.manage",

    "invoices.read", // can view own bills
    // (no invoices.manage by default)

    "hotels.read",

    "pos.use",

    "reports.view",

    // Utilities (non-destructive views)
    "notifications.read",
  ],

  CASHIER: [
    "dashboard.view",

    "pos.use",

    "invoices.read", "invoices.manage",

    "reports.view",

    // Utilities
    "notifications.read",
    "files.read", // access to print/download receipts, if stored
  ],

  WAITER: [
    "dashboard.view",
    "customers.read",
    "pos.use",
    // optional: "notifications.read",
  ],

  HOUSEKEEPING: [
    "dashboard.view",
    "hotels.read",
    // optional: "notifications.read",
  ],
};
