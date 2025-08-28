// apps/frontend/src/lib/permissions.meta.ts
import type { PermissionKey } from "@/lib/acl";

export type PermissionMeta = {
  label: string;
  group: string;
  description?: string;
};

// ✅ Sidebar buckets ke hisaab se order expand kiya
export const PERMISSION_GROUPS_IN_ORDER: string[] = [
  "Dashboard",
  "Customers",
  "Bookings",
  "Hotels",
  "POS",
  "Bars",
  "Inventory",
  "Suppliers",
  "Invoices",
  "Reports",
  "Compliance & BI",
  "System / Utilities",
];

export const PERMISSIONS_META: Record<PermissionKey, PermissionMeta> = {
  // ---------------- Dashboard ----------------
  "dashboard.view": {
    label: "View Dashboard",
    group: "Dashboard",
    description: "See the main KPIs and overview widgets.",
  },

  // ---------------- Customers ----------------
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

  // ---------------- Bookings ----------------
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

  // ---------------- Hotels (includes Rooms features) ----------------
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

  // ✅ New granular permissions (aligned with rooms CRUD + images + amenities)
  // NOTE: If your PermissionKey already includes these, they’ll render nicely.
  // If not, these extras are harmless.
  "rooms.read": {
    label: "Rooms — Read",
    group: "Hotels",
    description: "View room details and status.",
  },
  "rooms.manage": {
    label: "Rooms — Manage",
    group: "Hotels",
    description: "Create/update rooms, change status, set rates.",
  },
  "rooms.images.manage": {
    label: "Room Images — Manage",
    group: "Hotels",
    description: "Add/remove/reorder images for rooms.",
  },
  "amenities.read": {
    label: "Amenities — Read",
    group: "Hotels",
    description: "View amenity catalog and mappings.",
  },
  "amenities.manage": {
    label: "Amenities — Manage",
    group: "Hotels",
    description: "Manage amenity catalog and room-type mappings.",
  },

  // ---------------- POS ----------------
  "pos.use": {
    label: "Use POS",
    group: "POS",
    description: "Access the point-of-sale to create bills.",
  },

  // ---------------- Bars ----------------
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

  // ---------------- Inventory ----------------
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

  // ---------------- Suppliers ----------------
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

  // ---------------- Invoices ----------------
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

  // ---------------- Reports ----------------
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

  // ---------------- Compliance & BI ----------------
  "compliance.gst.read": {
    label: "Compliance — GST",
    group: "Compliance & BI",
    description: "Access GST compliance and filings.",
  },
  "compliance.excise.read": {
    label: "Compliance — Excise",
    group: "Compliance & BI",
    description: "Access Excise compliance and reports.",
  },

  // ---------------- System / Utilities ----------------
  "settings.access.manage": {
    label: "Manage Access Control",
    group: "System / Utilities",
    description: "Grant or revoke permissions for users.",
  },
  "notifications.read": {
    label: "Notifications — Read",
    group: "System / Utilities",
    description: "Receive and view system notifications.",
  },
  "approvals.read": {
    label: "Approvals — Read",
    group: "System / Utilities",
    description: "See pending approvals and audit logs.",
  },
  "files.read": {
    label: "Files — Read",
    group: "System / Utilities",
    description: "Access stored files and documents.",
  },
  // ✅ Add upload so image flows can be gated if you wire it in ACL
  "files.upload": {
    label: "Files — Upload",
    group: "System / Utilities",
    description: "Upload files (e.g., room images).",
  },
  "refdata.read": {
    label: "Reference Data — Read",
    group: "System / Utilities",
    description: "View and manage reference/master data.",
  },
};
